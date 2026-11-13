package com.rnh.backend.infrastructure.adapter.in.rest;

import com.rnh.backend.domain.model.Hincha;
import com.rnh.backend.domain.model.Tenant;
import com.rnh.backend.domain.port.in.TenantManagementUseCase;
import com.rnh.backend.domain.port.out.HinchaRepositoryPort;
import com.rnh.backend.domain.vo.RutDocumento;
import com.rnh.backend.infrastructure.adapter.out.biometric.GeminiVerificationService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Path("/api/public")
@Produces(MediaType.APPLICATION_JSON)
public class PublicCatalogResource {

    @Inject
    TenantManagementUseCase tenantUseCase;

    @Inject
    HinchaRepositoryPort hinchaRepository;

    @Inject
    GeminiVerificationService geminiVerificationService;

    public record IdentificarRostroRequest(
            String selfieBase64,
            String descriptorFacialJson
    ) {}

    @GET
    @Path("/tenants")
    public List<Map<String, Object>> listarTenantsPublicos() {
        List<Tenant> tenants = tenantUseCase.listarTenants();
        return tenants.stream()
                .filter(t -> "ACTIVE".equalsIgnoreCase(t.getEstado()))
                .map(t -> Map.<String, Object>of(
                        "id", t.getId(),
                        "codigo", t.getCodigo(),
                        "nombre", t.getNombre(),
                        "tipoEntidad", t.getTipoEntidad() != null ? t.getTipoEntidad() : "ESTADIO_MUNICIPAL"
                ))
                .toList();
    }

    @POST
    @Path("/identificar-rostro")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response identificarRostroPublico(IdentificarRostroRequest req) {
        if (req == null || req.selfieBase64() == null || req.selfieBase64().isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("message", "Debes tomar o adjuntar una fotografía de tu rostro para verificar."))
                    .build();
        }

        List<Hincha> registrados = hinchaRepository.findAllEnroladosConRostro();
        List<GeminiVerificationService.FaceMatchCandidate> candidatos = registrados.stream()
                .filter(h -> h.getFotoRostroBase64() != null && !h.getFotoRostroBase64().isBlank())
                .map(h -> new GeminiVerificationService.FaceMatchCandidate(h.getId(), h.getFotoRostroBase64()))
                .toList();

        GeminiVerificationService.FaceIdentificationResult resultado =
                geminiVerificationService.identificarRostroEnGaleria(req.selfieBase64(), candidatos);

        if (!resultado.rostroValido()) {
            return Response.ok(Map.of(
                    "rostroValido", false,
                    "encontrado", false,
                    "confianza", 0.0,
                    "mensaje", resultado.dictamen()
            )).build();
        }

        if (resultado.encontrado() && resultado.hinchaIdCoincidente() != null) {
            Hincha hincha = registrados.stream()
                    .filter(h -> resultado.hinchaIdCoincidente().equals(h.getId()))
                    .findFirst()
                    .orElse(null);

            if (hincha != null) {
                String nombreCompleto = ((hincha.getNombres() != null ? hincha.getNombres() : "") + " "
                        + (hincha.getApellidos() != null ? hincha.getApellidos() : "")).trim();
                String rutMask = enmascararRutSeguro(hincha.getDocumentoDecrypted(), hincha.getTipoDocumento());
                String estadioNombre = tenantUseCase.listarTenants().stream()
                        .filter(t -> t.getId() != null && t.getId().equals(hincha.getTenantId()))
                        .map(Tenant::getNombre)
                        .findFirst()
                        .orElse("Registro Nacional ANFP");

                Map<String, Object> body = new LinkedHashMap<>();
                body.put("rostroValido", true);
                body.put("encontrado", true);
                body.put("nombreCompleto", nombreCompleto.isBlank() ? "Hincha Registrado" : nombreCompleto);
                body.put("rutEnmascarado", rutMask);
                body.put("estadioPrincipal", estadioNombre);
                body.put("estado", hincha.getEstadoEnrolamiento() != null ? hincha.getEstadoEnrolamiento() : "COMPLETADO");
                body.put("tieneProhibicion", hincha.isTieneProhibicionActiva());
                body.put("huellaRegistrada", hincha.isHuellaRegistrada());
                body.put("confianza", resultado.confianza());
                body.put("mensaje", "¡Felicidades! Tus datos faciales ya están cargados en el Registro Nacional de Hinchas.");
                return Response.ok(body).build();
            }
        }

        return Response.ok(Map.of(
                "rostroValido", true,
                "encontrado", false,
                "confianza", 0.0,
                "mensaje", "No encontramos tus datos faciales registrados. Debes registrarte para ser hincha oficial del RNH."
        )).build();
    }

    private String enmascararRutSeguro(String rutPlano, String tipoDoc) {
        if (rutPlano == null || rutPlano.isBlank()) return "••.•••.•••-•";
        try {
            return new RutDocumento(rutPlano, tipoDoc != null ? tipoDoc : "CEDULA_CHILE").getValorEnmascarado();
        } catch (Exception e) {
            int len = rutPlano.length();
            return len > 4 ? "••.•••." + rutPlano.substring(len - 4) : "••.•••";
        }
    }

    @GET
    @Path("/health")
    public Map<String, Object> healthStatus() {
        return Map.of(
                "sistema", "Registro Nacional de Hinchas (RNH) - ANFP Chile",
                "arquitectura", "Hexagonal (Puertos y Adaptadores) - Quarkus 3 + PostgreSQL Single-DB Multi-Tenant",
                "seguridad", Map.of(
                        "cifradoEnReposo", "AES-256-GCM",
                        "blindIndex", "HMAC-SHA256",
                        "passwordHashing", "PBKDF2WithHmacSHA256 (65536 iteraciones + sal 128-bit)",
                        "zeroRetentionImagenes", true,
                        "cumplimientoLegal", "Ley N° 19.628 y Ley N° 19.327"
                )
        );
    }
}
