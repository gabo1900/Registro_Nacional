package com.rnh.backend.infrastructure.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rnh.backend.domain.model.Usuario;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Proveedor de Tokens JWT firmados criptográficamente (HMAC-SHA256 / RFC 7519)
 * con aislamiento Multi-Tenant en los claims (sub, userId, email, rol, tenantId, tenantCodigo).
 */
@ApplicationScoped
public class JwtTokenService {

    @Inject
    ObjectMapper objectMapper;

    @ConfigProperty(name = "rnh.security.jwt.secret", defaultValue = "RNH_CHILE_JWT_SIGNING_KEY_2026_SUPER_SECRET_HEXAGONAL_KEY")
    String jwtSecret;

    @ConfigProperty(name = "smallrye.jwt.new-token.lifespan", defaultValue = "28800")
    long tokenLifespanSeconds;

    @ConfigProperty(name = "mp.jwt.verify.issuer", defaultValue = "https://hinchas.yanitia.com")
    String issuer;

    public record JwtClaims(
            Long userId,
            String email,
            String rol,
            String tenantId,
            String tenantCodigo,
            String nombreCompleto,
            long exp
    ) {
        public boolean isSuperAdmin() {
            return "SUPER_ADMIN".equalsIgnoreCase(rol);
        }

        public boolean isAdminTenant() {
            return "ADMIN_TENANT".equalsIgnoreCase(rol) || isSuperAdmin();
        }
    }

    public long getTokenLifespanSeconds() {
        return tokenLifespanSeconds;
    }

    public String generateToken(Usuario usuario) {
        try {
            long now = Instant.now().getEpochSecond();
            long exp = now + tokenLifespanSeconds;

            Map<String, Object> header = Map.of("alg", "HS256", "typ", "JWT");
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("iss", issuer);
            payload.put("sub", usuario.getEmail());
            payload.put("userId", usuario.getId());
            payload.put("email", usuario.getEmail());
            payload.put("rol", usuario.getRol());
            payload.put("tenantId", usuario.getTenantId() != null ? usuario.getTenantId() : "");
            payload.put("tenantCodigo", usuario.getTenantCodigo() != null ? usuario.getTenantCodigo() : "");
            payload.put("nombreCompleto", usuario.getNombreCompleto());
            payload.put("iat", now);
            payload.put("exp", exp);

            String headerB64 = Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(objectMapper.writeValueAsBytes(header));
            String payloadB64 = Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(objectMapper.writeValueAsBytes(payload));

            String signingInput = headerB64 + "." + payloadB64;
            String signatureB64 = signHmacSha256(signingInput);
            return signingInput + "." + signatureB64;
        } catch (Exception e) {
            throw new IllegalStateException("Error generando JWT", e);
        }
    }

    public Optional<JwtClaims> validateAndParse(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return Optional.empty();
        }
        String token = authorizationHeader.substring(7).trim();
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return Optional.empty();
            }
            String signingInput = parts[0] + "." + parts[1];
            String expectedSig = signHmacSha256(signingInput);
            if (!MessageDigest.isEqual(
                    expectedSig.getBytes(StandardCharsets.UTF_8),
                    parts[2].getBytes(StandardCharsets.UTF_8))) {
                return Optional.empty();
            }

            byte[] payloadBytes = Base64.getUrlDecoder().decode(parts[1]);
            @SuppressWarnings("unchecked")
            Map<String, Object> claims = objectMapper.readValue(payloadBytes, Map.class);

            long exp = ((Number) claims.get("exp")).longValue();
            if (Instant.now().getEpochSecond() > exp) {
                return Optional.empty();
            }

            Long userId = ((Number) claims.get("userId")).longValue();
            String email = (String) claims.get("email");
            String rol = (String) claims.get("rol");
            String tenantId = (String) claims.getOrDefault("tenantId", "");
            String tenantCodigo = (String) claims.getOrDefault("tenantCodigo", "");
            String nombreCompleto = (String) claims.getOrDefault("nombreCompleto", "");

            return Optional.of(new JwtClaims(userId, email, rol, tenantId, tenantCodigo, nombreCompleto, exp));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private String signHmacSha256(String data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(secretKey);
        byte[] raw = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
    }
}
