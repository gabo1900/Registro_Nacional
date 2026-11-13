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

    @Inject
    com.rnh.backend.infrastructure.adapter.out.biometric.FingerprintVerificationService fingerprintVerificationService;

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

        // 1. Obtener huellas activas existentes del usuario
        List<HuellaBiometrica> huellasExistentes = hinchaRepository.findHuellasByUsuarioId(usuarioId);

        // 2. Comprobar si esta misma huella ya está enrolada (comparar contra Huella 1 y Huella 2)
        String newKey = publicKeyRaw != null ? publicKeyRaw.trim() : "";
        for (int i = 0; i < huellasExistentes.size(); i++) {
            HuellaBiometrica h = huellasExistentes.get(i);
            int numeroHuella = i + 1;
            String nombreDedo = h.getDedoIndice() != null ? h.getDedoIndice() : ("Huella " + numeroHuella);

            // A. Cotejo de minucias con SourceAFIS (sensores de huella USB / Dahua / plantillas)
            if (!newKey.isBlank() && h.getPublicKeyEncrypted() != null) {
                try {
                    String storedDecrypted = cryptoService.decryptAesGcm(h.getPublicKeyEncrypted());
                    byte[] probeBytes = newKey.startsWith("{")
                            ? newKey.getBytes(java.nio.charset.StandardCharsets.UTF_8)
                            : java.util.Base64.getDecoder().decode(newKey);
                    com.rnh.backend.infrastructure.adapter.out.biometric.FingerprintVerificationService.FingerprintMatchResult matchRes =
                            fingerprintVerificationService.cotejarHuellas(storedDecrypted, probeBytes);
                    if (matchRes.coincide()) {
                        throw new IllegalArgumentException(
                                "Esta huella dactilar ya está enrolada en el sistema (corresponde a la Huella " + numeroHuella + ": " + nombreDedo + "). Debe usar un dedo diferente."
                        );
                    }
                } catch (IllegalArgumentException iae) {
                    throw iae;
                } catch (Exception ignored) {}
            }

            // B. Cotejo de Credential ID (FIDO2 / Hardware token)
            if (h.getCredentialId().equalsIgnoreCase(credentialId.trim())) {
                throw new IllegalArgumentException(
                        "Esta huella ya está enrolada en el sistema (corresponde a la Huella " + numeroHuella + ": " + nombreDedo + "). Debe usar un dedo diferente."
                );
            }

            // C. Cotejo de dedo anatómico seleccionado
            if (dedoIndice != null && !dedoIndice.isBlank() && dedoIndice.equalsIgnoreCase(h.getDedoIndice())) {
                throw new IllegalArgumentException(
                        "Esta huella ya está enrolada (corresponde a la Huella " + numeroHuella + ": " + nombreDedo + "). Debe seleccionar un dedo diferente para la Huella " + (huellasExistentes.size() + 1) + "."
                );
            }
        }

        // 3. Límite estricto: solo se pueden enrolar 2 huellas por hincha
        if (huellasExistentes.size() >= 2) {
            throw new IllegalArgumentException(
                    "El hincha ya tiene el límite máximo de 2 huellas enroladas. Si desea registrar una nueva huella, primero debe eliminar la Huella 1 o la Huella 2."
            );
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

        // Asignación de dedo por defecto si no se especificó
        String dedoFinal = dedoIndice;
        if (dedoFinal == null || dedoFinal.isBlank()) {
            if (huellasExistentes.isEmpty()) {
                dedoFinal = "INDICE_DERECHO";
            } else {
                dedoFinal = "INDICE_DERECHO".equalsIgnoreCase(huellasExistentes.get(0).getDedoIndice())
                        ? "PULGAR_DERECHO"
                        : "INDICE_DERECHO";
            }
        }

        HuellaBiometrica huella = new HuellaBiometrica();
        huella.setHinchaId(hincha.getId());
        huella.setUsuarioId(usuarioId);
        huella.setTenantId(hincha.getTenantId());
        huella.setCredentialId(credentialId.trim());
        String rawKeyOrTemplate = publicKeyRaw != null && !publicKeyRaw.isBlank() ? publicKeyRaw : "COSE_PUBKEY_" + credentialId;
        huella.setPublicKeyEncrypted(cryptoService.encryptAesGcm(rawKeyOrTemplate));
        huella.setHuellaHash(cryptoService.hmacSha256(credentialId + ":" + usuarioId));
        huella.setDispositivoTipo(dispositivoTipo != null && !dispositivoTipo.isBlank() ? dispositivoTipo : "WEBAUTHN_FIDO2_SENSOR");
        huella.setDedoIndice(dedoFinal);
        huella.setSignCount(1L);
        huella.setActivo(true);

        return hinchaRepository.saveHuella(huella);
    }

    @Override
    @Transactional
    public boolean eliminarHuella(Long huellaId, Long usuarioId, String tenantId, boolean isSuperAdmin) {
        if (huellaId == null) return false;
        boolean eliminada = hinchaRepository.deleteHuellaById(huellaId, usuarioId, tenantId, isSuperAdmin);
        if (eliminada) {
            // Si el hincha se queda sin huellas, actualizar la bandera en Hincha
            if (usuarioId != null) {
                List<HuellaBiometrica> restantes = hinchaRepository.findHuellasByUsuarioId(usuarioId);
                if (restantes.isEmpty()) {
                    hinchaRepository.findByUsuarioId(usuarioId).ifPresent(hincha -> {
                        hincha.setHuellaRegistrada(false);
                        hinchaRepository.save(hincha, null);
                    });
                }
            }
        }
        return eliminada;
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
