package com.rnh.backend.infrastructure.adapter.out.biometric;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Servicio Inteligente de Verificación y Cotejo Biométrico Forense con Google Gemini.
 *
 * Utilidad exclusiva:
 * - Detección de autenticidad del documento (Cédula chilena / Pasaporte).
 *   Rechaza de forma estricta fotos de paredes, objetos, pantallas, etc.
 * - Lectura OCR estricta de RUN/RUT, nombres y fecha de nacimiento.
 * - Cotejo biométrico 1:1 entre el rostro impreso en el documento y la selfie en vivo.
 */
@ApplicationScoped
public class GeminiVerificationService {

    private static final Logger LOG = Logger.getLogger(GeminiVerificationService.class);

    @Inject
    ObjectMapper objectMapper;

    @ConfigProperty(name = "rnh.gemini.api-key")
    Optional<String> geminiApiKey;

    @ConfigProperty(name = "rnh.gemini.model", defaultValue = "gemini-3.8-flash")
    String geminiModel;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    public record DocumentAnalysisResult(
            boolean exitoso,
            boolean documentoValido,
            boolean rutCoincide,
            String rutDetectado,
            String nombresDetectados,
            String apellidosDetectados,
            String fechaNacimientoDetectada,
            double coincidenciaRostroDocumento,
            String dictamen,
            String proveedor
    ) {}

    public DocumentAnalysisResult analizarDocumentoYCotejo(
            String fotoDocumentoBase64,
            String selfieBase64,
            String rutEsperado
    ) {
        String apiKey = geminiApiKey.orElse("").trim();
        if (apiKey.isBlank() || apiKey.startsWith("COLOCAR_")) {
            throw new SecurityException("El servicio central de verificación biométrica de la ANFP no se encuentra configurado.");
        }

        if (fotoDocumentoBase64 == null || fotoDocumentoBase64.isBlank()) {
            throw new SecurityException("Debe adjuntar una fotografía clara y legible de su cédula de identidad o pasaporte.");
        }

        if (selfieBase64 == null || selfieBase64.isBlank()) {
            throw new SecurityException("Debe capturar una fotografía en vivo de su rostro para realizar el cotejo de identidad.");
        }

        try {
            String cleanDoc = limpiarBase64(fotoDocumentoBase64);
            String mimeDoc = fotoDocumentoBase64.contains("image/png") ? "image/png" : "image/jpeg";

            String cleanSelfie = limpiarBase64(selfieBase64);
            String mimeSelfie = selfieBase64.contains("image/png") ? "image/png" : "image/jpeg";

            List<Map<String, Object>> parts = new ArrayList<>();

            // 1. Imagen del documento de identidad
            parts.add(Map.of(
                    "inline_data", Map.of(
                            "mime_type", mimeDoc,
                            "data", cleanDoc
                    )
            ));

            // 2. Imagen de la selfie en vivo
            parts.add(Map.of(
                    "inline_data", Map.of(
                            "mime_type", mimeSelfie,
                            "data", cleanSelfie
                    )
            ));

            // 3. Prompt de verificación forense
            String promptInstrucciones =
                    "Actúa como el sistema de verificación de identidad y biometría oficial de la ANFP y el Registro Nacional de Hinchas de Chile (RNH).\n" +
                    "Tienes dos imágenes adjuntas:\n" +
                    "- Imagen 1: Fotografía de la Cédula de Identidad de Chile (o Pasaporte).\n" +
                    "- Imagen 2: Selfie en vivo del rostro del ciudadano.\n\n" +
                    "REGLAS ESTRICTAS DE EVALUACIÓN:\n" +
                    "1. DOCUMENTO VÁLIDO: Verifica si la Imagen 1 es una Cédula de Identidad oficial de la República de Chile (o pasaporte válido). " +
                    "Si la Imagen 1 es una pared, piso, habitación, vehículo, objeto, animal, pantalla con reflejos ilegibles o cualquier cosa que NO sea un documento legal chileno oficial legible, " +
                    "debes responder 'documentoValido': false, 'coincidenciaRostro': 0.0, y en 'razon': 'No se detectó un documento de identidad legal válido. La imagen no corresponde a una cédula de identidad chilena legible.'\n\n" +
                    "2. RUT / RUN: Si la Imagen 1 es un documento válido, extrae el número de RUN/RUT visible en el plástico. " +
                    "RUT declarado por el hincha: '" + (rutEsperado != null ? rutEsperado : "") + "'. " +
                    "Compara el RUT extraído con el declarado (ignorando puntos y guión). Indica en 'rutCoincide' true si coinciden o false si difieren.\n\n" +
                    "3. COTEJO FACIAL BIOMÉTRICO: Compara los rasgos faciales de la fotografía del retrato oficial impreso en el documento (Imagen 1) con el rostro humano en la selfie en vivo (Imagen 2). " +
                    "Calcula 'coincidenciaRostro' como un valor decimal de 0.0 a 1.0 (donde 1.0 es misma persona con alta certeza, 0.75 a 0.99 coincidencia positiva, y < 0.60 personas diferentes o rostros no detectables).\n" +
                    "Si alguna imagen no contiene un rostro humano claro, 'coincidenciaRostro' debe ser 0.0.\n\n" +
                    "Devuelve ÚNICAMENTE un objeto JSON con esta estructura exacta:\n" +
                    "{\n" +
                    "  \"documentoValido\": true/false,\n" +
                    "  \"rutDetectado\": \"...\",\n" +
                    "  \"rutCoincide\": true/false,\n" +
                    "  \"nombres\": \"...\",\n" +
                    "  \"apellidos\": \"...\",\n" +
                    "  \"fechaNacimiento\": \"YYYY-MM-DD\",\n" +
                    "  \"coincidenciaRostro\": 0.95,\n" +
                    "  \"razon\": \"...\"\n" +
                    "}";

            parts.add(Map.of("text", promptInstrucciones));

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(Map.of("parts", parts)),
                    "generationConfig", Map.of("response_mime_type", "application/json")
            );

            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + geminiModel + ":generateContent?key=" + apiKey;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(20))
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                LOG.errorf("Error en API Gemini (HTTP %d): %s", response.statusCode(), response.body());
                throw new SecurityException("Error de comunicación con el servicio de verificación biométrica de la ANFP (HTTP " + response.statusCode() + ").");
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode candidates = root.path("candidates");
            if (!candidates.isArray() || candidates.isEmpty()) {
                throw new SecurityException("No se obtuvo respuesta concluyente del servicio de análisis biométrico.");
            }

            JsonNode firstCandidateParts = candidates.get(0).path("content").path("parts");
            StringBuilder sb = new StringBuilder();
            if (firstCandidateParts.isArray()) {
                for (JsonNode part : firstCandidateParts) {
                    if (part.has("text")) {
                        sb.append(part.path("text").asText());
                    }
                }
            }

            String jsonText = extraerJsonDeTexto(sb.toString());
            JsonNode data = objectMapper.readTree(jsonText);

            boolean docValido = data.path("documentoValido").asBoolean(false);
            String rutDetectado = data.path("rutDetectado").asText("").trim();
            boolean rutCoincide = data.path("rutCoincide").asBoolean(false);
            double coincidencia = data.path("coincidenciaRostro").asDouble(0.0);
            String razon = data.path("razon").asText("Cotejo finalizado.").trim();

            // Si el RUT detectado coincide con el esperado al normalizar
            if (!rutCoincide && rutEsperado != null && !rutDetectado.isBlank()) {
                String r1 = com.rnh.backend.domain.vo.RutDocumento.normalizar(rutDetectado);
                String r2 = com.rnh.backend.domain.vo.RutDocumento.normalizar(rutEsperado);
                if (!r1.isEmpty() && r1.equalsIgnoreCase(r2)) {
                    rutCoincide = true;
                }
            }

            return new DocumentAnalysisResult(
                    true,
                    docValido,
                    rutCoincide,
                    rutDetectado,
                    data.path("nombres").asText(""),
                    data.path("apellidos").asText(""),
                    data.path("fechaNacimiento").asText(null),
                    coincidencia,
                    razon,
                    "GOOGLE_GEMINI_AI"
            );

        } catch (SecurityException se) {
            throw se;
        } catch (java.net.http.HttpTimeoutException te) {
            LOG.warn("Timeout conectando con API Gemini", te);
            throw new SecurityException("Tiempo de espera agotado al conectar con el servicio de validación de identidad. Verifique su señal de internet e intente nuevamente.");
        } catch (Exception e) {
            LOG.error("Error procesando validación con Gemini", e);
            throw new SecurityException("Error al procesar el cotejo biométrico: " + e.getMessage());
        }
    }

    private String limpiarBase64(String raw) {
        if (raw == null) return "";
        int commaIdx = raw.indexOf(',');
        return commaIdx >= 0 ? raw.substring(commaIdx + 1).trim() : raw.trim();
    }

    private String extraerJsonDeTexto(String text) {
        if (text == null) return "{}";
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return text.substring(start, end + 1);
        }
        return "{}";
    }
}
