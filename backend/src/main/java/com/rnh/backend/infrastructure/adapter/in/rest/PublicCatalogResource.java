package com.rnh.backend.infrastructure.adapter.in.rest;

import com.rnh.backend.domain.model.Tenant;
import com.rnh.backend.domain.port.in.TenantManagementUseCase;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.List;
import java.util.Map;

@Path("/api/public")
@Produces(MediaType.APPLICATION_JSON)
public class PublicCatalogResource {

    @Inject
    TenantManagementUseCase tenantUseCase;

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
