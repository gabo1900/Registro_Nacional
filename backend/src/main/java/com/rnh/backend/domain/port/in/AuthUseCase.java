package com.rnh.backend.domain.port.in;

import com.rnh.backend.domain.model.Usuario;

public interface AuthUseCase {

    record AuthResult(
            String accessToken,
            long expiresInSeconds,
            Usuario usuario
    ) {}

    record RegisterHinchaCommand(
            String tenantCodigo,
            String nombres,
            String apellidos,
            String tipoDocumento,
            String numeroDocumento,
            String fechaNacimiento,
            String nacionalidad,
            String email,
            String telefono,
            String password,
            boolean aceptaTerminosGenerales,
            boolean aceptaTratamientoBiometrico,
            String fotoDocumentoBase64,
            String selfieBase64,
            String descriptorFacialJson,
            String huellaCredentialId,
            String huellaPublicKey,
            String huellaDispositivoTipo,
            String huellaDedo,
            String ipOrigen
    ) {}

    record SimpleRegisterCommand(
            String tenantCodigo,
            String nombreCompleto,
            String rut,
            String telefono,
            String email,
            String password
    ) {}

    AuthResult loginConCredenciales(String emailOrRut, String password, String tenantCodigo);

    AuthResult loginConGoogle(String googleCredentialToken, String tokenType, String tenantCodigo);

    AuthResult registrarEIniciarHincha(RegisterHinchaCommand command);

    AuthResult registroBasico(SimpleRegisterCommand command);
}
