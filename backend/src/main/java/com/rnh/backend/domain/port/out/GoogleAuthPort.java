package com.rnh.backend.domain.port.out;

import java.util.Optional;

/**
 * Puerto de Salida para verificar criptográficamente tokens de Google OAuth 2.0 directamente con Google.
 */
public interface GoogleAuthPort {

    record GoogleUserInfo(
            String sub,
            String email,
            boolean emailVerified,
            String name,
            String pictureUrl
    ) {}

    Optional<GoogleUserInfo> verificarTokenConGoogle(String credentialToken, String tokenType);
}
