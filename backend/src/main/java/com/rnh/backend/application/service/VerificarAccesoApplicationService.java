package com.rnh.backend.application.service;

import com.rnh.backend.domain.model.AccesoLog;
import com.rnh.backend.domain.model.Hincha;
import com.rnh.backend.domain.model.HuellaBiometrica;
import com.rnh.backend.domain.model.ProhibicionIngreso;
import com.rnh.backend.domain.port.in.VerificarAccesoUseCase;
import com.rnh.backend.domain.port.out.BiometricProviderPort;
import com.rnh.backend.domain.port.out.HinchaRepositoryPort;
import com.rnh.backend.domain.port.out.ProhibicionRepositoryPort;
import com.rnh.backend.domain.vo.NivelConfianza;
import com.rnh.backend.domain.vo.RutDocumento;
import com.rnh.backend.infrastructure.adapter.out.biometric.FingerprintVerificationService;
import com.rnh.backend.infrastructure.security.CryptoService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class VerificarAccesoApplicationService implements VerificarAccesoUseCase {

    @Inject
    HinchaRepositoryPort hinchaRepository;

    @Inject
    ProhibicionRepositoryPort prohibicionRepository;

    @Inject
    BiometricProviderPort biometricProvider;

    @Inject
    CryptoService cryptoService;

    @Inject
    FingerprintVerificationService fingerprintVerificationService;

    @ConfigProperty(name = "rnh.biometric.api.similarity-threshold", defaultValue = "0.88")
    double similarityThreshold;

    @Override
    @Transactional
    public ResultadoVerificacion verificarAccesoEnPuerta(
            String tenantId,
            Long operadorUsuarioId,
            String documentoRut,
            String capturaEnVivoBase64,
            String descriptorCapturaJson,
            String huellaCredentialId,
            String modoVerificacion,
            String puertaAcceso
    ) {
        String puerta = (puertaAcceso != null && !puertaAcceso.isBlank()) ? puertaAcceso : "Torniquete Biométrico Principal";
        String modo = (modoVerificacion != null && !modoVerificacion.isBlank()) ? modoVerificacion : "CONTROL_PUERTA_FACIAL";

        Hincha hincha = null;
        String docHash = null;
        RutDocumento rutVo = null;

        // 1. Si se verifica mediante Huella Digital (WebAuthn / Sensor)
        if (huellaCredentialId != null && !huellaCredentialId.isBlank()) {
            Optional<HuellaBiometrica> huellaOpt = hinchaRepository.findHuellaByCredentialId(huellaCredentialId.trim());
            if (huellaOpt.isPresent()) {
                hincha = hinchaRepository.findById(huellaOpt.get().getHinchaId()).orElse(null);
                if (hincha != null) {
                    docHash = hincha.getDocumentoHash();
                    rutVo = new RutDocumento(hincha.getDocumentoDecrypted(), hincha.getTipoDocumento());
                }
            }
        }

        // 2. Si se proporcionó RUT/Documento (Verificación 1:1 ultrarrápida)
        if (hincha == null && documentoRut != null && !documentoRut.isBlank()) {
            rutVo = new RutDocumento(documentoRut, "CEDULA_CHILE");
            docHash = cryptoService.hmacSha256(rutVo.getValorNormalizado());
            hincha = hinchaRepository.findByDocumentoHash(docHash).orElse(null);
        }

        // 3. Si NO se dio RUT, intentar Identificación 1:N por Rostro o por Huella en el Recinto
        if (hincha == null && (documentoRut == null || documentoRut.isBlank())) {
            List<Hincha> candidatos = hinchaRepository.findByTenantId(tenantId);
            Hincha mejorCandidato = null;
            double mejorScore = 0.0;
            for (Hincha c : candidatos) {
                String vectorDesencriptado = hinchaRepository.findVectorCifradoByHinchaId(c.getId()).orElse(null);
                double s = biometricProvider.verificarIdentidadEnPuerta(
                        c.getBiometricTokenRef(),
                        vectorDesencriptado,
                        capturaEnVivoBase64,
                        descriptorCapturaJson
                );
                if (s > mejorScore && s >= similarityThreshold) {
                    mejorScore = s;
                    mejorCandidato = c;
                }
            }
            if (mejorCandidato != null) {
                hincha = mejorCandidato;
                docHash = hincha.getDocumentoHash();
                rutVo = new RutDocumento(hincha.getDocumentoDecrypted(), hincha.getTipoDocumento());
            }
        }

        if (docHash != null) {
            // Verificar prohibiciones de ingreso (Derecho de Admisión Ley N° 19.327)
            List<ProhibicionIngreso> prohibiciones = prohibicionRepository.findActivasByDocumentoHash(docHash, tenantId);
            if (!prohibiciones.isEmpty()) {
                ProhibicionIngreso p = prohibiciones.get(0);
                registrarLog(tenantId, hincha != null ? hincha.getId() : null, operadorUsuarioId, modo, puerta,
                        0.98, true, "DENEGADO_PROHIBICION",
                        "Bloqueo por Derecho de Admisión (" + p.getCodigoCausal() + "): " + p.getMotivo());

                return new ResultadoVerificacion(
                        false,
                        "DENEGADO_PROHIBICION",
                        "INGRESO PROHIBIDO - Derecho de Admisión activo (" + p.getCodigoCausal() + "): " + p.getMotivo(),
                        0.98,
                        true,
                        hincha != null ? hincha.getNombres() + " " + hincha.getApellidos() : p.getNombreReferencia(),
                        rutVo != null ? rutVo.getValorEnmascarado() : p.getDocumentoMasked(),
                        hincha != null ? hincha.getBiometricTokenRef() : "BLOQUEADO",
                        p.getCodigoCausal(),
                        puerta,
                        hincha != null ? hincha.getFotoDocumentoBase64() : null,
                        hincha != null ? hincha.getFotoRostroBase64() : null
                );
            }
        }

        if (hincha == null) {
            registrarLog(tenantId, null, operadorUsuarioId, modo, puerta,
                    0.0, false, "NO_ENROLADO", "Persona no encontrada en el Registro Nacional de Hinchas (RNH).");
            return new ResultadoVerificacion(
                    false,
                    "NO_ENROLADO",
                    "Asistente NO se encuentra enrolado en el Registro Nacional de Hinchas (RNH).",
                    0.0,
                    false,
                    "No Registrado",
                    rutVo != null ? rutVo.getValorEnmascarado() : "N/A",
                    null,
                    null,
                    puerta,
                    null,
                    null
            );
        }

        // 3. Evaluación Biométrica (Facial o Huella Dactilar Hardware / FIDO2)
        double score;
        if ("CONTROL_PUERTA_HUELLA".equalsIgnoreCase(modo)) {
            List<HuellaBiometrica> huellas = hinchaRepository.findHuellasByUsuarioId(hincha.getUsuarioId());
            if (huellas.isEmpty()) {
                score = 0.0;
            } else {
                HuellaBiometrica h = huellas.get(0);
                if (capturaEnVivoBase64 != null && !capturaEnVivoBase64.isBlank()) {
                    try {
                        String cleanB64 = capturaEnVivoBase64.contains(",")
                                ? capturaEnVivoBase64.substring(capturaEnVivoBase64.indexOf(",") + 1)
                                : capturaEnVivoBase64;
                        byte[] probeBytes = java.util.Base64.getDecoder().decode(cleanB64.trim());
                        String storedTemplate = cryptoService.decryptAesGcm(h.getPublicKeyEncrypted());
                        FingerprintVerificationService.FingerprintMatchResult matchRes =
                                fingerprintVerificationService.cotejarHuellas(storedTemplate, probeBytes);
                        score = matchRes.coincide() ? 0.992 : (matchRes.score() > 0 ? (matchRes.score() / 100.0) : 0.05);
                    } catch (Exception e) {
                        score = 0.0;
                    }
                } else if (huellaCredentialId != null && !huellaCredentialId.isBlank()) {
                    // Verificación FIDO2 / WebAuthn
                    score = h.getCredentialId().equals(huellaCredentialId.trim()) ? 0.994 : 0.0;
                } else {
                    score = 0.0;
                }
            }
        } else {
            String vectorDesencriptado = hinchaRepository.findVectorCifradoByHinchaId(hincha.getId()).orElse(null);
            score = biometricProvider.verificarIdentidadEnPuerta(
                    hincha.getBiometricTokenRef(),
                    vectorDesencriptado,
                    capturaEnVivoBase64,
                    descriptorCapturaJson
            );
        }

        NivelConfianza confianza = new NivelConfianza(score, similarityThreshold);
        String nombreCompleto = hincha.getNombres() + " " + hincha.getApellidos();
        String docMasked = new RutDocumento(hincha.getDocumentoDecrypted(), hincha.getTipoDocumento()).getValorEnmascarado();

        if (!confianza.esConfiable()) {
            registrarLog(tenantId, hincha.getId(), operadorUsuarioId, modo, puerta,
                    score, true, "DENEGADO_BIOMETRIA", "Score de similitud insuficiente: " + score);
            return new ResultadoVerificacion(
                    false,
                    "DENEGADO_BIOMETRIA",
                    "Verificación biométrica rechazada: puntaje de similitud bajo el umbral exigido (" + similarityThreshold + ").",
                    score,
                    true,
                    nombreCompleto,
                    docMasked,
                    hincha.getBiometricTokenRef(),
                    null,
                    puerta,
                    hincha.getFotoDocumentoBase64(),
                    hincha.getFotoRostroBase64()
            );
        }

        registrarLog(tenantId, hincha.getId(), operadorUsuarioId, modo, puerta,
                score, true, "AUTORIZADO", "Identidad verificada positivamente y sin prohibiciones de ingreso.");

        return new ResultadoVerificacion(
                true,
                "AUTORIZADO",
                "ACCESO AUTORIZADO - Identidad biométrica confirmada y sin prohibiciones vigentes.",
                score,
                true,
                nombreCompleto,
                docMasked,
                hincha.getBiometricTokenRef(),
                null,
                puerta,
                hincha.getFotoDocumentoBase64(),
                hincha.getFotoRostroBase64()
        );
    }

    @Override
    @Transactional
    public ResultadoVerificacion consultarHabilitacionTicketera(String tenantId, String documentoRut) {
        RutDocumento rutVo = new RutDocumento(documentoRut, "CEDULA_CHILE");
        String docHash = cryptoService.hmacSha256(rutVo.getValorNormalizado());

        List<ProhibicionIngreso> prohibiciones = prohibicionRepository.findActivasByDocumentoHash(docHash, tenantId);
        if (!prohibiciones.isEmpty()) {
            ProhibicionIngreso p = prohibiciones.get(0);
            registrarLog(tenantId, null, null, "VALIDACION_TICKETERA", "API Ticketera Online",
                    0.0, true, "DENEGADO_PROHIBICION", "Intento de compra bloqueado por " + p.getCodigoCausal());
            return new ResultadoVerificacion(
                    false,
                    "DENEGADO_PROHIBICION",
                    "VENTA DE ENTRADA BLOQUEADA: Registra prohibición de ingreso activa (" + p.getCodigoCausal() + ").",
                    0.0,
                    true,
                    p.getNombreReferencia(),
                    rutVo.getValorEnmascarado(),
                    null,
                    p.getCodigoCausal(),
                    "Ticketera Online",
                    null,
                    null
            );
        }

        Optional<Hincha> hinchaOpt = hinchaRepository.findByDocumentoHash(docHash);
        if (hinchaOpt.isEmpty()) {
            return new ResultadoVerificacion(
                    false,
                    "NO_ENROLADO",
                    "El comprador aún no está enrolado en el RNH. Debe completar su registro biométrico antes de adquirir entradas.",
                    0.0,
                    false,
                    "No Enrolado",
                    rutVo.getValorEnmascarado(),
                    null,
                    null,
                    "Ticketera Online",
                    null,
                    null
            );
        }

        Hincha h = hinchaOpt.get();
        registrarLog(tenantId, h.getId(), null, "VALIDACION_TICKETERA", "API Ticketera Online",
                1.0, true, "AUTORIZADO", "Hincha enrolado y habilitado para compra de entradas.");

        return new ResultadoVerificacion(
                true,
                "AUTORIZADO",
                "HABILITADO PARA COMPRA: Hincha enrolado en RNH y sin prohibiciones de ingreso vigentes.",
                1.0,
                true,
                h.getNombres() + " " + h.getApellidos(),
                rutVo.getValorEnmascarado(),
                h.getBiometricTokenRef(),
                null,
                "Ticketera Online",
                h.getFotoDocumentoBase64(),
                h.getFotoRostroBase64()
        );
    }

    @Override
    @Transactional
    public ProhibicionIngreso registrarProhibicion(
            String tenantId,
            Long creadoPorUsuarioId,
            String documentoRut,
            String nombreReferencia,
            String codigoCausal,
            String motivo,
            String alcance
    ) {
        RutDocumento rutVo = new RutDocumento(documentoRut, "CEDULA_CHILE");
        String docHash = cryptoService.hmacSha256(rutVo.getValorNormalizado());

        ProhibicionIngreso p = new ProhibicionIngreso();
        p.setTenantId(tenantId);
        hinchaRepository.findByDocumentoHash(docHash).ifPresent(h -> p.setHinchaId(h.getId()));
        p.setDocumentoHash(docHash);
        p.setDocumentoMasked(rutVo.getValorEnmascarado());
        p.setNombreReferencia(nombreReferencia != null ? nombreReferencia : "Sujeto Sancionado");
        p.setCodigoCausal(codigoCausal != null ? codigoCausal : "LEY_19327_DERECHO_ADMISION");
        p.setMotivo(motivo);
        p.setAlcance(alcance != null ? alcance : "NACIONAL");
        p.setActiva(true);
        p.setCreadoPorUsuarioId(creadoPorUsuarioId);

        return prohibicionRepository.save(p);
    }

    @Override
    public List<ProhibicionIngreso> listarProhibiciones(String tenantId, boolean isSuperAdmin) {
        if (isSuperAdmin) {
            return prohibicionRepository.findAll();
        }
        return prohibicionRepository.findAllByTenantOrNacional(tenantId);
    }

    @Override
    @Transactional
    public boolean levantarProhibicion(Long id, String tenantId, boolean isSuperAdmin) {
        return prohibicionRepository.desactivar(id, tenantId, isSuperAdmin);
    }

    @Override
    public List<AccesoLog> listarBitacoraAccesos(String tenantId, boolean isSuperAdmin, int limit) {
        if (isSuperAdmin && (tenantId == null || tenantId.isBlank() || "TODOS".equalsIgnoreCase(tenantId))) {
            return prohibicionRepository.findAllLogs(limit);
        }
        return prohibicionRepository.findLogsByTenantId(tenantId, limit);
    }

    @Override
    public List<AccesoLog> listarAccesosPorUsuario(Long usuarioId) {
        return hinchaRepository.findByUsuarioId(usuarioId)
                .map(h -> prohibicionRepository.findLogsByHinchaId(h.getId()))
                .orElse(List.of());
    }

    private void registrarLog(String tenantId, Long hinchaId, Long operadorId, String tipo, String puerta,
                              double score, boolean liveness, String resultado, String detalle) {
        AccesoLog log = new AccesoLog();
        log.setTenantId(tenantId != null && !tenantId.isBlank() ? tenantId : "anfp-central");
        log.setHinchaId(hinchaId);
        log.setOperadorUsuarioId(operadorId);
        log.setTipoOperacion(tipo);
        log.setPuertaAcceso(puerta);
        log.setSimilarityScore(score);
        log.setLivenessVerified(liveness);
        log.setResultado(resultado);
        log.setDetalleMensaje(detalle);
        prohibicionRepository.saveAccesoLog(log);
    }
}
