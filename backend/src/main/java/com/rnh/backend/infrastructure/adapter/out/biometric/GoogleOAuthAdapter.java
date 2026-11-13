package com.rnh.backend.infrastructure.adapter.out.biometric;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rnh.backend.domain.port.out.GoogleAuthPort;
import io.quarkus.runtime.LaunchMode;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.Optional;

/**
 * Adaptador de Salida que verifica criptográficamente el token de Google OAuth 2.0
 * consultando directamente los servidores oficiales de Google:
 * - https://oauth2.googleapis.com/tokeninfo (para id_token JWT)
 * - https://www.googleapis.com/oauth2/v3/userinfo (para access_token OAuth2)
 */
@ApplicationScoped
public class GoogleOAuthAdapter implements GoogleAuthPort {

    @Inject
    ObjectMapper objectMapper;

    @ConfigProperty(name = "rnh.google.oauth.client-id")
    Optional<String> configuredGoogleClientId;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .build();

    @Override
    @SuppressWarnings("unchecked")
    public Optional<GoogleUserInfo> verificarTokenConGoogle(String credentialToken, String tokenType) {
        if (credentialToken == null || credentialToken.isBlank()) {
            return Optional.empty();
        }
        try {
            HttpRequest request;
            if ("access_token".equalsIgnoreCase(tokenType)) {
                request = HttpRequest.newBuilder()
                        .uri(URI.create("https://www.googleapis.com/oauth2/v3/userinfo"))
                        .header("Authorization", "Bearer " + credentialToken.trim())
                        .timeout(Duration.ofSeconds(8))
                        .GET()
                        .build();
            } else {
                String encoded = URLEncoder.encode(credentialToken.trim(), StandardCharsets.UTF_8);
                request = HttpRequest.newBuilder()
                        .uri(URI.create("https://oauth2.googleapis.com/tokeninfo?id_token=" + encoded))
                        .timeout(Duration.ofSeconds(8))
                        .GET()
                        .build();
            }

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                return Optional.empty();
            }

            Map<String, Object> body = objectMapper.readValue(response.body(), Map.class);
            String email = (String) body.get("email");
            String sub = (String) body.get("sub");
            if (email == null || sub == null) {
                return Optional.empty();
            }

            // Si el client-id está configurado en producción, validar que el 'aud' coincida con nuestro Client ID
            String clientId = configuredGoogleClientId != null ? configuredGoogleClientId.orElse("") : "";
            if (!clientId.isBlank() && !clientId.startsWith("COLOCAR_") && body.containsKey("aud")) {
                String aud = String.valueOf(body.get("aud"));
                if (!clientId.trim().equals(aud)) {
                    return Optional.empty();
                }
            }

            Object emailVerifiedRaw = body.get("email_verified");
            boolean emailVerified = "true".equalsIgnoreCase(String.valueOf(emailVerifiedRaw));
            String name = (String) body.getOrDefault("name", email.split("@")[0]);
            String picture = (String) body.getOrDefault("picture", "");

            return Optional.of(new GoogleUserInfo(sub, email.toLowerCase(), emailVerified, name, picture));
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}
