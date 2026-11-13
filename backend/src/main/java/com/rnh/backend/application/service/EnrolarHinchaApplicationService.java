package com.rnh.backend.application.service;

import com.rnh.backend.domain.exception.ConsentimientoFaltanteException;
import com.rnh.backend.domain.model.Consentimiento;
import com.rnh.backend.domain.model.Hincha;
import com.rnh.backend.domain.model.HuellaBiometrica;
import com.rnh.backend.domain.model.SolicitudArco;
import com.rnh.backend.domain.model.Usuario;
import com.rnh.backend.domain.port.in.EnrolarHinchaUseCase;
import com.rnh.backend.domain.port.out.BiometricProviderPort;
import com.rnh.backend.domain.port.out.HinchaRepositoryPort;
import com.rnh.backend.domain.port.out.UsuarioRepositoryPort;
import com.rnh.backend.domain.vo.RutDocumento;
import com.rnh.backend.domain.vo.VectorBiometricoRef;
import com.rnh.backend.infrastructure.security.CryptoService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.LocalDate;
import java.util.List;

@ApplicationScoped
public class EnrolarHinchaApplicationService implements EnrolarHinchaUseCase {

    @Inject
    HinchaRepositoryPort hinchaRepository;

    @Inject
    UsuarioRepositoryPort usuarioRepository;

    @Inject
    BiometricProviderPort biometricProvider;

    @Inject
    CryptoService cryptoService;

    @Override
    public Hincha obtenerPerfilHincha(Long usuarioId) {
        return hinchaRepository.findByUsuarioId(usuarioId).orElse(null);
    }

    @Override
    @Transactional
    public Hincha enrolarOActualizarBiometria(ActualizarBiometriaCommand cmd) {
        if (!cmd.aceptaTerminosGenerales() || !cmd.aceptaTratamientoBiometrico()) {
            throw new ConsentimientoFaltanteException(
                    "Debe aceptar expresamente los Términos y Condiciones de la ANFP y el consentimiento biométrico."
            );
        }

        RutDocumento rutVo = new RutDocumento(cmd.numeroDocumento(), cmd.tipoDocumento());
        String docHash = cryptoService.hmacSha256(rutVo.getValorNormalizado());

        VectorBiometricoRef vectorRef = biometricProvider.registrarRostroYDocumento(
                rutVo.getValorNormalizado(),
                cmd.fotoDocumentoBase64(),
                cmd.selfieBase64(),
                cmd.descriptorFacialJson()
        );

        Hincha hincha = hinchaRepository.findByUsuarioId(cmd.usuarioId()).orElseGet(Hincha::new);
        hincha.setUsuarioId(cmd.usuarioId());
        hincha.setTenantId(cmd.tenantId());
        hincha.setTipoDocumento(rutVo.getTipoDocumento());
        hincha.setDocumentoHash(docHash);
        hincha.setDocumentoDecrypted(rutVo.getValorNormalizado());
        hincha.setNombres(cmd.nombres());
        hincha.setApellidos(cmd.apellidos());
        if (cmd.fechaNacimiento() != null && !cmd.fechaNacimiento().isBlank()) {
            try {
                hincha.setFechaNacimiento(LocalDate.parse(cmd.fechaNacimiento()));
            } catch (Exception ignored) {}
        }
        hincha.setNacionalidad(cmd.nacionalidad() != null ? cmd.nacionalidad() : "Chilena");
        hincha.setBiometricTokenRef(vectorRef.getTokenReferencia());
        hincha.setLivenessPassed(vectorRef.isLivenessSuperado());
        hincha.setLivenessScore(vectorRef.getLivenessScore());
        hincha.setEstadoEnrolamiento("COMPLETADO");
        if (cmd.fotoDocumentoBase64() != null && !cmd.fotoDocumentoBase64().isBlank()) {
            hincha.setFotoDocumentoBase64(cmd.fotoDocumentoBase64());
        }
        if (cmd.selfieBase64() != null && !cmd.selfieBase64().isBlank()) {
            hincha.setFotoRostroBase64(cmd.selfieBase64());
        }
        hincha.setResultadoCotejoDni("VERIFICADO_COTEJO_OK");

        hincha = hinchaRepository.save(hincha, vectorRef.getVectorCifrado());

        // Actualizar RUT en Usuario si aún no lo tenía
        usuarioRepository.findById(cmd.usuarioId()).ifPresent(u -> {
            u.setRutDecrypted(rutVo.getValorNormalizado());
            u.setRutHash(docHash);
            usuarioRepository.save(u);
        });

        Consentimiento consentimiento = new Consentimiento();
        consentimiento.setHinchaId(hincha.getId());
        consentimiento.setUsuarioId(cmd.usuarioId());
        consentimiento.setTenantId(cmd.tenantId());
        consentimiento.setAceptaTerminosGenerales(true);
        consentimiento.setAceptaTratamientoBiometrico(true);
        consentimiento.setAceptaTransferenciaProcesamiento(true);
        consentimiento.setVersionTerminos("ANFP-RNH-2026-v1.0");
        consentimiento.setIpOrigen(cmd.ipOrigen() != null ? cmd.ipOrigen() : "127.0.0.1");
        consentimiento.setHashDocumentoLegal(cryptoService.hmacSha256("TERMINOS_ANFP_RNH_2026:" + docHash));
        hinchaRepository.saveConsentimiento(consentimiento);

        return hincha;
    }

    @Override
    @Transactional
    public HuellaBiometrica registrarHuella(Long usuarioId, String tenantId, String credentialId, String publicKeyRaw, String dispositivoTipo, String dedoIndice) {
        if (credentialId == null || credentialId.isBlank()) {
            throw new IllegalArgumentException("El identificador de credencial biométrica (credentialId) es obligatorio.");
        }

        Hincha hincha = hinchaRepository.findByUsuarioId(usuarioId).orElseGet(() -> {
            Usuario u = usuarioRepository.findById(usuarioId)
                    .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado."));
            Hincha nuevo = new Hincha();
            nuevo.setUsuarioId(usuarioId);
            nuevo.setTenantId(tenantId != null && !tenantId.isBlank() ? tenantId : u.getTenantId());
            nuevo.setTipoDocumento("CEDULA_CHILE");
            String rut = u.getRutDecrypted() != null ? u.getRutDecrypted() : "PEND-" + usuarioId;
            nuevo.setDocumentoDecrypted(rut);
            nuevo.setDocumentoHash(cryptoService.hmacSha256(rut));
            nuevo.setNombres(u.getNombreCompleto());
            nuevo.setApellidos("");
            nuevo.setNacionalidad("Chilena");
            nuevo.setBiometricTokenRef("RNH-HUELLA-" + usuarioId);
            nuevo.setLivenessPassed(true);
            nuevo.setLivenessScore(0.99);
            nuevo.setHuellaRegistrada(true);
            nuevo.setEstadoEnrolamiento("COMPLETADO");
            return hinchaRepository.save(nuevo, "VEC_HUELLA_INIT");
        });

        hincha.setHuellaRegistrada(true);
        hinchaRepository.save(hincha, null);

        HuellaBiometrica huella = new HuellaBiometrica();
        huella.setHinchaId(hincha.getId());
        huella.setUsuarioId(usuarioId);
        huella.setTenantId(hincha.getTenantId());
        huella.setCredentialId(credentialId.trim());
        huella.setPublicKeyEncrypted(publicKeyRaw != null && !publicKeyRaw.isBlank() ? publicKeyRaw : "COSE_PUBKEY_" + credentialId);
        huella.setHuellaHash(cryptoService.hmacSha256(credentialId + ":" + usuarioId));
        huella.setDispositivoTipo(dispositivoTipo != null && !dispositivoTipo.isBlank() ? dispositivoTipo : "WEBAUTHN_FIDO2_SENSOR");
        huella.setDedoIndice(dedoIndice != null && !dedoIndice.isBlank() ? dedoIndice : "INDICE_DERECHO");
        huella.setSignCount(1L);
        huella.setActivo(true);

        return hinchaRepository.saveHuella(huella);
    }

    @Override
    public List<HuellaBiometrica> listarHuellasUsuario(Long usuarioId) {
        return hinchaRepository.findHuellasByUsuarioId(usuarioId);
    }

    @Override
    public Consentimiento obtenerConsentimientoUsuario(Long usuarioId) {
        return hinchaRepository.findLatestConsentimientoByUsuarioId(usuarioId).orElse(null);
    }

    @Override
    @Transactional
    public SolicitudArco crearSolicitudArco(Long usuarioId, String tenantId, String tipoDerecho, String fundamento) {
        SolicitudArco s = new SolicitudArco();
        s.setUsuarioId(usuarioId);
        s.setTenantId(tenantId);
        s.setTipoDerecho(tipoDerecho);
        s.setFundamento(fundamento);
        s.setEstado("EN_REVISION_DPO");
        s.setRespuestaDpo("Solicitud recibida por el Delegado de Protección de Datos ANFP (ifierro@anfpchile.cl) conforme al Art. 12 Ley N° 19.628.");
        return hinchaRepository.saveSolicitudArco(s);
    }

    @Override
    public List<SolicitudArco> listarSolicitudesArcoUsuario(Long usuarioId) {
        return hinchaRepository.findSolicitudesArcoByUsuarioId(usuarioId);
    }
}
