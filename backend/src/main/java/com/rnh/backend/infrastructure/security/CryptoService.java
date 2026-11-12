package com.rnh.backend.infrastructure.security;

import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Servicio Criptográfico de Defensa en Profundidad:
 * - Cifrado simétrico autenticado AES-256-GCM para datos personales y vectores biométricos en reposo.
 * - Hashing irreversible HMAC-SHA256 con sal secreta para búsquedas ciegas (Blind Index) de RUT/Documento.
 * - Hashing robusto de contraseñas con PBKDF2WithHmacSHA256 + Sal aleatoria de 128 bits.
 */
@ApplicationScoped
public class CryptoService {

    private static final String AES_ALGO = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;
    private static final int PBKDF2_ITERATIONS = 65536;
    private static final int PBKDF2_KEY_BITS = 256;

    private final SecureRandom secureRandom = new SecureRandom();

    @ConfigProperty(name = "rnh.security.encryption.aes-key", defaultValue = "Uk5IX0NISUxFX0FFUzI1Nl9NQVNURVJfS0VZXzIwMjZfU0VDVVJF")
    String aesMasterKeyConfig;

    @ConfigProperty(name = "rnh.security.hashing.hmac-secret", defaultValue = "RNH_ANFP_HMAC_BLIND_INDEX_SECRET_2026_CHILE")
    String hmacSecretConfig;

    private SecretKeySpec getAesKey() {
        try {
            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            byte[] keyBytes = sha256.digest(aesMasterKeyConfig.getBytes(StandardCharsets.UTF_8));
            return new SecretKeySpec(keyBytes, "AES");
        } catch (Exception e) {
            throw new IllegalStateException("Error inicializando clave maestra AES-256", e);
        }
    }

    public String encryptAesGcm(String plainText) {
        if (plainText == null || plainText.isBlank()) {
            return null;
        }
        if (plainText.startsWith("AES256GCM$")) {
            return plainText;
        }
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            secureRandom.nextBytes(iv);
            Cipher cipher = Cipher.getInstance(AES_ALGO);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, getAesKey(), spec);
            byte[] cipherText = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            return "AES256GCM$" +
                    Base64.getEncoder().encodeToString(iv) + "$" +
                    Base64.getEncoder().encodeToString(cipherText);
        } catch (Exception e) {
            throw new IllegalStateException("Error cifrando dato sensible con AES-256-GCM", e);
        }
    }

    public String decryptAesGcm(String encryptedText) {
        if (encryptedText == null || encryptedText.isBlank()) {
            return null;
        }
        if (!encryptedText.startsWith("AES256GCM$")) {
            return encryptedText;
        }
        try {
            String[] parts = encryptedText.split("\\$");
            if (parts.length != 3) {
                return "[DATO_PROTEGIDO]";
            }
            byte[] iv = Base64.getDecoder().decode(parts[1]);
            byte[] cipherBytes = Base64.getDecoder().decode(parts[2]);
            Cipher cipher = Cipher.getInstance(AES_ALGO);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, getAesKey(), spec);
            byte[] plainBytes = cipher.doFinal(cipherBytes);
            return new String(plainBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return "[CIFRADO_PROTEGIDO]";
        }
    }

    public String hmacSha256(String normalizedValue) {
        if (normalizedValue == null || normalizedValue.isBlank()) {
            return null;
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(hmacSecretConfig.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(keySpec);
            byte[] rawHmac = mac.doFinal(normalizedValue.trim().toUpperCase().getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(rawHmac);
        } catch (Exception e) {
            throw new IllegalStateException("Error calculando blind index HMAC-SHA256", e);
        }
    }

    public String hashPassword(String rawPassword) {
        if (rawPassword == null || rawPassword.isBlank()) {
            throw new IllegalArgumentException("La contraseña no puede estar vacía.");
        }
        try {
            byte[] salt = new byte[16];
            secureRandom.nextBytes(salt);
            PBEKeySpec spec = new PBEKeySpec(rawPassword.toCharArray(), salt, PBKDF2_ITERATIONS, PBKDF2_KEY_BITS);
            SecretKeyFactory skf = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            byte[] hash = skf.generateSecret(spec).getEncoded();
            return "PBKDF2$" + PBKDF2_ITERATIONS + "$" +
                    Base64.getEncoder().encodeToString(salt) + "$" +
                    Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new IllegalStateException("Error generando hash seguro de contraseña", e);
        }
    }

    public boolean verifyPassword(String rawPassword, String storedHash) {
        if (rawPassword == null || storedHash == null) {
            return false;
        }
        try {
            if (!storedHash.startsWith("PBKDF2$")) {
                return false;
            }
            String[] parts = storedHash.split("\\$");
            if (parts.length != 4) {
                return false;
            }
            int iterations = Integer.parseInt(parts[1]);
            byte[] salt = Base64.getDecoder().decode(parts[2]);
            byte[] expectedHash = Base64.getDecoder().decode(parts[3]);

            PBEKeySpec spec = new PBEKeySpec(rawPassword.toCharArray(), salt, iterations, expectedHash.length * 8);
            SecretKeyFactory skf = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            byte[] actualHash = skf.generateSecret(spec).getEncoded();
            return MessageDigest.isEqual(expectedHash, actualHash);
        } catch (Exception e) {
            return false;
        }
    }
}
