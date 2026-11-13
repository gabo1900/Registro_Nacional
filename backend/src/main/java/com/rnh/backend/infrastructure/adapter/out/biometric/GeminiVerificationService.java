package com.rnh.backend.infrastructure.adapter.out.biometric;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.awt.Graphics2D;
import java.awt.Image;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;

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

    public record FaceMatchCandidate(
            Long hinchaId,
            String fotoRostroBase64
    ) {}

    public record FaceIdentificationResult(
            boolean rostroValido,
            boolean encontrado,
            Long hinchaIdCoincidente,
            double confianza,
            String dictamen
    ) {}

    /**
     * Identificación facial 1:N rápida contra las selfies registradas en base de datos usando Gemini Vision.
     * Compacta las miniaturas en memoria a <= 280px para que el análisis sea ágil (~2-4 segundos).
     */
    public FaceIdentificationResult identificarRostroEnGaleria(
            String selfieEnVivoBase64,
            List<FaceMatchCandidate> candidatos
    ) {
        String apiKey = geminiApiKey.orElse("").trim();
        if (apiKey.isBlank() || apiKey.startsWith("COLOCAR_")) {
            throw new SecurityException("El servicio de reconocimiento facial no está configurado.");
        }
        if (selfieEnVivoBase64 == null || selfieEnVivoBase64.isBlank()) {
            throw new SecurityException("Debe capturar una fotografía de su rostro.");
        }

        String probeCompacta = compactarImagenJpeg(selfieEnVivoBase64, 420, 0.78f);

        // Si no hay hinchas registrados con rostro aún, validamos igual que la cámara haya captado una persona real
        if (candidatos == null || candidatos.isEmpty()) {
            return evaluarSinCandidatos(apiKey, probeCompacta);
        }

        final int BATCH_SIZE = 12;
        for (int start = 0; start < candidatos.size(); start += BATCH_SIZE) {
            List<FaceMatchCandidate> lote = candidatos.subList(start, Math.min(start + BATCH_SIZE, candidatos.size()));
            FaceIdentificationResult res = ejecutarLoteIdentificacion(apiKey, probeCompacta, lote);
            if (!res.rostroValido()) {
                return res;
            }
            if (res.encontrado() && res.hinchaIdCoincidente() != null && res.confianza() >= 0.72) {
                return res;
            }
        }

        return new FaceIdentificationResult(
                true,
                false,
                null,
                0.0,
                "No encontramos tus datos faciales registrados. Debes registrarte para ser hincha oficial del RNH."
        );
    }

    private FaceIdentificationResult evaluarSinCandidatos(String apiKey, String probeCompacta) {
        try {
            List<Map<String, Object>> parts = List.of(
                    Map.of("inline_data", Map.of("mime_type", "image/jpeg", "data", probeCompacta)),
                    Map.of("text", "Analiza si en esta imagen aparece un rostro humano claro y frontal. Responde JSON: {\"rostroValido\": true/false, \"razon\": \"...\"}")
            );
            JsonNode data = invocarGeminiJson(apiKey, parts, 12);
            boolean rostroValido = data.path("rostroValido").asBoolean(false);
            if (!rostroValido) {
                return new FaceIdentificationResult(false, false, null, 0.0, "No se detectó un rostro humano claro en la foto.");
            }
            return new FaceIdentificationResult(
                    true,
                    false,
                    null,
                    0.0,
                    "Aún no hay registros faciales cargados. Debes registrarte para ser hincha oficial del RNH."
            );
        } catch (SecurityException se) {
            throw se;
        } catch (Exception e) {
            LOG.warn("Error validando rostro sin candidatos", e);
            throw new SecurityException("No se pudo analizar la fotografía facial en este momento.");
        }
    }

    private FaceIdentificationResult ejecutarLoteIdentificacion(
            String apiKey,
            String probeCompacta,
            List<FaceMatchCandidate> lote
    ) {
        try {
            List<Map<String, Object>> parts = new ArrayList<>();
            parts.add(Map.of("text", "FOTO_EN_VIVO (persona que consulta si está registrada):"));
            parts.add(Map.of("inline_data", Map.of("mime_type", "image/jpeg", "data", probeCompacta)));

            for (FaceMatchCandidate c : lote) {
                if (c.fotoRostroBase64() == null || c.fotoRostroBase64().isBlank()) continue;
                String candCompacta = compactarImagenJpeg(c.fotoRostroBase64(), 260, 0.72f);
                parts.add(Map.of("text", "CANDIDATO_ID=" + c.hinchaId() + ":"));
                parts.add(Map.of("inline_data", Map.of("mime_type", "image/jpeg", "data", candCompacta)));
            }

            String prompt =
                    "Eres el motor biométrico de identificación facial 1:N del Registro Nacional de Hinchas (RNH).\n" +
                    "1. Verifica primero si FOTO_EN_VIVO muestra claramente el rostro de una persona real. " +
                    "Si FOTO_EN_VIVO es una pared, oscuridad, un objeto, o no tiene rostro visible, responde rostroValido=false, encontrado=false, confianza=0.0.\n" +
                    "2. Si hay un rostro claro en FOTO_EN_VIVO, compáralo geométrica y biométricamente (ojos, nariz, boca, cejas, óvalo facial, pómulos) " +
                    "contra cada imagen CANDIDATO_ID adjunta (tolerando cambios de luz, ángulo leve o expresión).\n" +
                    "3. Responde encontrado=true y el candidatoId exacto ÚNICAMENTE si estás seguro (>= 0.72) de que es exactamente la MISMA persona. " +
                    "Si es otra persona o no se parece lo suficiente, responde encontrado=false y candidatoId=null.\n\n" +
                    "Devuelve ÚNICAMENTE este JSON:\n" +
                    "{\n" +
                    "  \"rostroValido\": true,\n" +
                    "  \"encontrado\": true,\n" +
                    "  \"candidatoId\": 12,\n" +
                    "  \"confianza\": 0.93,\n" +
                    "  \"razon\": \"...\"\n" +
                    "}";

            parts.add(Map.of("text", prompt));
            JsonNode data = invocarGeminiJson(apiKey, parts, 18);

            boolean rostroValido = data.path("rostroValido").asBoolean(false);
            if (!rostroValido) {
                String razon = data.path("razon").asText("No se detectó un rostro humano claro. Intenta con mejor luz frente a la cámara.");
                return new FaceIdentificationResult(false, false, null, 0.0, razon);
            }

            boolean encontrado = data.path("encontrado").asBoolean(false);
            double confianza = data.path("confianza").asDouble(0.0);
            Long candId = data.hasNonNull("candidatoId") && data.path("candidatoId").isNumber()
                    ? data.path("candidatoId").asLong()
                    : null;

            // Validar que el candidatoId realmente exista dentro del lote evaluado
            if (encontrado && candId != null) {
                final Long idBuscado = candId;
                boolean existeEnLote = lote.stream().anyMatch(c -> idBuscado.equals(c.hinchaId()));
                if (!existeEnLote) {
                    encontrado = false;
                    candId = null;
                }
            }

            String razon = data.path("razon").asText(
                    encontrado
                            ? "Identidad facial confirmada en el Registro Nacional de Hinchas."
                            : "No encontramos coincidencia facial en los registros."
            );

            return new FaceIdentificationResult(true, encontrado && candId != null && confianza >= 0.72, candId, confianza, razon);

        } catch (SecurityException se) {
            throw se;
        } catch (java.net.http.HttpTimeoutException te) {
            LOG.warn("Timeout en identificación facial 1:N con Gemini", te);
            throw new SecurityException("La verificación tardó demasiado por señal de internet. Intenta nuevamente.");
        } catch (Exception e) {
            LOG.error("Error ejecutando identificación facial 1:N", e);
            throw new SecurityException("Error analizando datos faciales: " + e.getMessage());
        }
    }

    private JsonNode invocarGeminiJson(String apiKey, List<Map<String, Object>> parts, int timeoutSeconds) throws Exception {
        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of("parts", parts)),
                "generationConfig", Map.of(
                        "response_mime_type", "application/json",
                        "temperature", 0.1
                )
        );
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + geminiModel + ":generateContent?key=" + apiKey;
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            LOG.errorf("Error Gemini 1:N (HTTP %d): %s", response.statusCode(), response.body());
            throw new SecurityException("Servicio biométrico temporalmente no disponible (HTTP " + response.statusCode() + ").");
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode candidates = root.path("candidates");
        if (!candidates.isArray() || candidates.isEmpty()) {
            throw new SecurityException("El análisis biométrico no devolvió respuesta.");
        }
        JsonNode firstParts = candidates.get(0).path("content").path("parts");
        StringBuilder sb = new StringBuilder();
        if (firstParts.isArray()) {
            for (JsonNode p : firstParts) {
                if (p.has("text")) sb.append(p.path("text").asText());
            }
        }
        return objectMapper.readTree(extraerJsonDeTexto(sb.toString()));
    }

    private String compactarImagenJpeg(String base64Raw, int maxWidth, float quality) {
        String clean = limpiarBase64(base64Raw);
        try {
            byte[] decoded = Base64.getDecoder().decode(clean);
            BufferedImage original = ImageIO.read(new ByteArrayInputStream(decoded));
            if (original == null) {
                return clean;
            }
            int w = original.getWidth();
            int h = original.getHeight();
            int targetW = w;
            int targetH = h;
            if (w > maxWidth && w > 0) {
                targetW = maxWidth;
                targetH = Math.max(1, (int) Math.round((double) h * maxWidth / w));
            }
            BufferedImage rgb = new BufferedImage(targetW, targetH, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = rgb.createGraphics();
            g.drawImage(original.getScaledInstance(targetW, targetH, Image.SCALE_SMOOTH), 0, 0, null);
            g.dispose();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpeg");
            if (writers.hasNext()) {
                ImageWriter writer = writers.next();
                ImageWriteParam param = writer.getDefaultWriteParam();
                if (param.canWriteCompressed()) {
                    param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                    param.setCompressionQuality(quality);
                }
                try (ImageOutputStream ios = ImageIO.createImageOutputStream(baos)) {
                    writer.setOutput(ios);
                    writer.write(null, new IIOImage(rgb, null, null), param);
                }
                writer.dispose();
                return Base64.getEncoder().encodeToString(baos.toByteArray());
            }
            ImageIO.write(rgb, "jpeg", baos);
            return Base64.getEncoder().encodeToString(baos.toByteArray());
        } catch (Exception e) {
            return clean;
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
