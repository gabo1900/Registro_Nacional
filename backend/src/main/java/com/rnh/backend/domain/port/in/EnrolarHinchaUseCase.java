package com.rnh.backend.domain.port.in;

import com.rnh.backend.domain.model.Consentimiento;
import com.rnh.backend.domain.model.Hincha;
import com.rnh.backend.domain.model.HuellaBiometrica;
import com.rnh.backend.domain.model.SolicitudArco;

import java.util.List;

public interface EnrolarHinchaUseCase {

    record ActualizarBiometriaCommand(
            Long usuarioId,
            String tenantId,
            String tipoDocumento,
            String numeroDocumento,
            String nombres,
            String apellidos,
            String fechaNacimiento,
            String nacionalidad,
            boolean aceptaTerminosGenerales,
            boolean aceptaTratamientoBiometrico,
            String fotoDocumentoBase64,
            String selfieBase64,
            String descriptorFacialJson,
            String ipOrigen
    ) {}

    Hincha obtenerPerfilHincha(Long usuarioId);

    Hincha enrolarOActualizarBiometria(ActualizarBiometriaCommand command);

    HuellaBiometrica registrarHuella(Long usuarioId, String tenantId, String credentialId, String publicKeyRaw, String dispositivoTipo, String dedoIndice);

    boolean eliminarHuella(Long huellaId, Long usuarioId, String tenantId, boolean isSuperAdmin);

    List<HuellaBiometrica> listarHuellasUsuario(Long usuarioId);

    Consentimiento obtenerConsentimientoUsuario(Long usuarioId);

    SolicitudArco crearSolicitudArco(Long usuarioId, String tenantId, String tipoDerecho, String fundamento);

    List<SolicitudArco> listarSolicitudesArcoUsuario(Long usuarioId);
}
