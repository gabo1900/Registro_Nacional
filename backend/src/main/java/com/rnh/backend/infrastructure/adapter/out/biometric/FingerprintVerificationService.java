package com.rnh.backend.infrastructure.adapter.out.biometric;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.machinezoo.sourceafis.FingerprintCompatibility;
import com.machinezoo.sourceafis.FingerprintImage;
import com.machinezoo.sourceafis.FingerprintImageOptions;
import com.machinezoo.sourceafis.FingerprintMatcher;
import com.machinezoo.sourceafis.FingerprintTemplate;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Servicio de Autenticación Biométrica Dactilar basado en SourceAFIS (Java).
 *
 * Soporta:
 * - Imágenes de lectores físicos USB / Torniquetes (PNG, BMP, JPG, TIFF, WSQ a 500 DPI).
 * - Plantillas estándar hardware ANSI/INCITS 378 e ISO/IEC 19794-2 (Dahua, ZKTeco, SecuGen, DigitalPersona).
 * - Plantillas serializadas SourceAFIS JSON.
 * - Comparación 1:1 de minucias dactilares (crestas, bifurcaciones, deltas).
 * - Umbral biométrico estándar NIST (Score >= 40.0 equivale a FAR 1:100.000).
 */
@ApplicationScoped
public class FingerprintVerificationService {

    private static final Logger LOG = Logger.getLogger(FingerprintVerificationService.class);
    private static final int MIN_MINUTIAE = 8;

    @Inject
    ObjectMapper objectMapper;

    @ConfigProperty(name = "rnh.biometria.huella.umbral", defaultValue = "40.0")
    double umbralHuella;

    @ConfigProperty(name = "rnh.biometria.huella.dpi-por-defecto", defaultValue = "500.0")
    double dpiPorDefecto;

    public record FingerprintMatchResult(
            boolean coincide,
            double score,
            String dictamen
    ) {}

    public record ExtractedTemplateResult(
            String templateJson,
            int minutiaeCount
    ) {}

    /**
     * Decodifica un payload en Base64 estándar, Base64URL o Data URI (data:image/...;base64,...).
     */
    public byte[] decodeBase64Flexible(String raw) {
        if (raw == null || raw.isBlank()) {
            return new byte[0];
        }
        String clean = raw.trim();
        int commaIdx = clean.indexOf(',');
        if (commaIdx >= 0 && clean.substring(0, commaIdx).contains("base64")) {
            clean = clean.substring(commaIdx + 1).trim();
        }
        if (clean.startsWith("{")) {
            return clean.getBytes(StandardCharsets.UTF_8);
        }
        try {
            return Base64.getDecoder().decode(clean);
        } catch (IllegalArgumentException e) {
            // Intentar Base64URL
            String normalized = clean.replace('-', '+').replace('_', '/');
            int pad = (4 - (normalized.length() % 4)) % 4;
            normalized = normalized + "=".repeat(pad);
            return Base64.getDecoder().decode(normalized);
        }
    }

    /**
     * Parsea una captura desde imagen, plantilla ISO/ANSI o JSON serializado hacia FingerprintTemplate.
     */
    public FingerprintTemplate parseTemplate(byte[] datosSensor) {
        if (datosSensor == null || datosSensor.length == 0) {
            throw new IllegalArgumentException("Los datos de lectura del sensor dactilar están vacíos.");
        }

        // 1. Si viene en JSON serializado SourceAFIS
        String asText = new String(datosSensor, StandardCharsets.UTF_8).trim();
        if (asText.startsWith("{") && asText.contains("positionsX")) {
            return new FingerprintTemplate().deserialize(asText);
        }

        // 2. Intentar extraer minucias como Imagen biométrica (BMP, PNG, JPG, TIFF, WSQ)
        try {
            FingerprintImage img = new FingerprintImage(
                    datosSensor,
                    new FingerprintImageOptions().dpi(dpiPorDefecto)
            );
            return new FingerprintTemplate(img);
        } catch (Exception ignored) {}

        // 3. Intentar importar como plantilla estándar hardware ISO 19794-2 o ANSI 378 (Dahua / ZKTeco / SecuGen)
        try {
            FingerprintTemplate imported = FingerprintCompatibility.importTemplate(datosSensor);
            if (imported != null) {
                return imported;
            }
        } catch (Exception ignored) {}

        // 4. Intentar como plantilla binaria CBOR nativa de SourceAFIS
        try {
            return new FingerprintTemplate(datosSensor);
        } catch (Exception e) {
            throw new IllegalArgumentException(
                    "Formato biométrico dactilar no reconocido. Se requiere imagen de huella (PNG/BMP/JPG/WSQ) o plantilla ISO-19794-2 / ANSI-378."
            );
        }
    }

    /**
     * Extrae minucias dactilares reales, valida calidad mínima (>= 8 minucias) y serializa a JSON.
     */
    public ExtractedTemplateResult extraerYValidarPlantilla(byte[] datosSensor) {
        FingerprintTemplate template = parseTemplate(datosSensor);
        String json = template.serialize();
        int count = contarMinucias(json);
        if (count < MIN_MINUTIAE) {
            throw new IllegalArgumentException(
                    "No se detectaron suficientes minucias dactilares válidas (" + count + " detectadas, mínimo " + MIN_MINUTIAE + "). " +
                    "Asegúrese de capturar una huella nítida sobre el lector biométrico."
            );
        }
        return new ExtractedTemplateResult(json, count);
    }

    public int contarMinucias(String templateJson) {
        try {
            JsonNode node = objectMapper.readTree(templateJson);
            JsonNode posX = node.path("positionsX");
            return posX.isArray() ? posX.size() : 0;
        } catch (Exception e) {
            return 0;
        }
    }

    public boolean esPlantillaAfisJson(String texto) {
        return texto != null && texto.trim().startsWith("{") && texto.contains("positionsX");
    }

    /**
     * Compara una plantilla almacenada (JSON SourceAFIS o Base64) contra una captura en vivo del sensor.
     * Si se presenta un dedo diferente o de otra persona, el puntaje es típicamente < 15 y se RECHAZA.
     * Si se presenta el mismo dedo, el puntaje supera 40-150 y se AUTORIZA.
     */
    public FingerprintMatchResult cotejarHuellas(String plantillaAlmacenadaDesencriptada, byte[] capturaEnVivoBytes) {
        if (plantillaAlmacenadaDesencriptada == null || plantillaAlmacenadaDesencriptada.isBlank()
                || capturaEnVivoBytes == null || capturaEnVivoBytes.length == 0) {
            return new FingerprintMatchResult(false, 0.0, "Datos biométricos insuficientes para realizar el cotejo.");
        }

        try {
            FingerprintTemplate storedTemplate;
            if (esPlantillaAfisJson(plantillaAlmacenadaDesencriptada)) {
                storedTemplate = new FingerprintTemplate().deserialize(plantillaAlmacenadaDesencriptada.trim());
            } else {
                storedTemplate = parseTemplate(decodeBase64Flexible(plantillaAlmacenadaDesencriptada));
            }

            FingerprintTemplate liveTemplate = parseTemplate(capturaEnVivoBytes);

            FingerprintMatcher matcher = new FingerprintMatcher(storedTemplate);
            double score = matcher.match(liveTemplate);

            boolean coincide = score >= umbralHuella;
            String dictamen = coincide
                    ? "Cotejo AFIS positivo (Score: " + String.format("%.2f", score) + " >= " + umbralHuella + ")"
                    : "Huella dactilar rechazada: no coincide con la registrada (Score: " + String.format("%.2f", score) + " < " + umbralHuella + ")";

            return new FingerprintMatchResult(coincide, score, dictamen);

        } catch (Exception e) {
            LOG.warn("Error ejecutando comparación AFIS: " + e.getMessage());
            return new FingerprintMatchResult(false, 0.0, "No se pudo procesar la comparación dactilar: " + e.getMessage());
        }
    }
}
