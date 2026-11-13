package com.rnh.backend.domain.port.in;

import com.rnh.backend.domain.model.AccesoLog;
import com.rnh.backend.domain.model.ProhibicionIngreso;

import java.util.List;

public interface VerificarAccesoUseCase {

    record ResultadoVerificacion(
            boolean autorizado,
            String estadoAcceso,
            String mensaje,
            double similarityScore,
            boolean livenessVerified,
            String hinchaNombre,
            String documentoEnmascarado,
            String biometricTokenRef,
            String codigoProhibicion,
            String puertaAcceso,
            String fotoDocumentoBase64,
            String fotoRostroBase64
    ) {}

    ResultadoVerificacion verificarAccesoEnPuerta(
            String tenantId,
            Long operadorUsuarioId,
            String documentoRut,
            String capturaEnVivoBase64,
            String descriptorCapturaJson,
            String huellaCredentialId,
            String modoVerificacion,
            String puertaAcceso
    );

    ResultadoVerificacion consultarHabilitacionTicketera(String tenantId, String documentoRut);

    ProhibicionIngreso registrarProhibicion(
            String tenantId,
            Long creadoPorUsuarioId,
            String documentoRut,
            String nombreReferencia,
            String codigoCausal,
            String motivo,
            String alcance
    );

    List<ProhibicionIngreso> listarProhibiciones(String tenantId, boolean isSuperAdmin);

    boolean levantarProhibicion(Long id, String tenantId, boolean isSuperAdmin);

    List<AccesoLog> listarBitacoraAccesos(String tenantId, boolean isSuperAdmin, int limit);

    List<AccesoLog> listarAccesosPorUsuario(Long usuarioId);
}
