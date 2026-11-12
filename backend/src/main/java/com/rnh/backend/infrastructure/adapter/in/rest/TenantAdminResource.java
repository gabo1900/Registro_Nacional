package com.rnh.backend.infrastructure.adapter.in.rest;

import com.rnh.backend.domain.exception.TenantIsolationException;
import com.rnh.backend.domain.model.Hincha;
import com.rnh.backend.domain.model.ProhibicionIngreso;
import com.rnh.backend.domain.model.Tenant;
import com.rnh.backend.domain.model.Usuario;
import com.rnh.backend.domain.port.in.TenantManagementUseCase;
import com.rnh.backend.domain.port.in.VerificarAccesoUseCase;
import com.rnh.backend.domain.port.out.HinchaRepositoryPort;
import com.rnh.backend.domain.port.out.TenantRepositoryPort;
import com.rnh.backend.infrastructure.security.JwtTokenService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Path("/api/tenant")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TenantAdminResource {

    @Inject
    TenantManagementUseCase tenantUseCase;

    @Inject
    TenantRepositoryPort tenantRepository;

    @Inject
    HinchaRepositoryPort hinchaRepository;

    @Inject
    VerificarAccesoUseCase verificarAccesoUseCase;

    @Inject
    JwtTokenService jwtTokenService;

    public record TenantUserRequest(
            String nombreCompleto,
            String email,
            String password,
            String rol,
            String estado,
            String rut,
            String telefono
    ) {}

    public record VerificacionPuertaRequest(
            String documentoRut,
            String capturaEnVivoBase64,
            String descriptorCapturaJson,
            String huellaCredentialId,
            String modoVerificacion,
            String puertaAcceso
    ) {}

    public record ProhibicionRequest(
            String documentoRut,
            String nombreReferencia,
            String codigoCausal,
            String motivo,
            String alcance
    ) {}

    private JwtTokenService.JwtClaims requireTenantAdminOrOperator(String authHeader) {
        JwtTokenService.JwtClaims claims = jwtTokenService.validateAndParse(authHeader)
                .orElseThrow(() -> new SecurityException("Token JWT inválido o expirado."));
        if (!claims.isAdminTenant() && !"OPERADOR_ACCESO".equalsIgnoreCase(claims.rol())) {
            throw new TenantIsolationException("No tiene permisos administrativos sobre este Tenant.");
        }
        return claims;
    }

    private String resolveTenantId(JwtTokenService.JwtClaims claims) {
        if (claims.tenantId() != null && !claims.tenantId().isBlank()) {
            return claims.tenantId();
        }
        return tenantRepository.findAll().stream().findFirst().map(Tenant::getId).orElse("");
    }

    @GET
    @Path("/dashboard")
    public Map<String, Object> obtenerDashboardTenant(@HeaderParam("Authorization") String authHeader) {
        JwtTokenService.JwtClaims claims = requireTenantAdminOrOperator(authHeader);
        String tenantId = resolveTenantId(claims);

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant no encontrado."));
        List<Usuario> usuarios = tenantUseCase.listarUsuariosPorTenant(tenantId);
        List<Hincha> hinchas = hinchaRepository.findByTenantId(tenantId);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("tenant", tenant);
        resp.put("usuarios", usuarios);
        resp.put("hinchasEnrolados", hinchas);
        resp.put("prohibiciones", verificarAccesoUseCase.listarProhibiciones(tenantId, claims.isSuperAdmin()));
        resp.put("accesosLog", verificarAccesoUseCase.listarBitacoraAccesos(tenantId, false, 30));
        resp.put("solicitudesArco", hinchaRepository.findSolicitudesArcoByTenantId(tenantId));
        return resp;
    }

    @POST
    @Path("/users")
    public Usuario crearUsuarioEnMiTenant(@HeaderParam("Authorization") String authHeader, TenantUserRequest req) {
        JwtTokenService.JwtClaims claims = requireTenantAdminOrOperator(authHeader);
        String tenantId = resolveTenantId(claims);
        String rolAsignado = (req.rol() != null && !req.rol().isBlank()) ? req.rol() : "USUARIO";
        if ("SUPER_ADMIN".equalsIgnoreCase(rolAsignado) && !claims.isSuperAdmin()) {
            throw new TenantIsolationException("No puede crear usuarios con rol SUPER_ADMIN desde un Tenant.");
        }
        return tenantUseCase.crearUsuarioEnTenant(
                tenantId,
                req.nombreCompleto(),
                req.email(),
                req.password(),
                rolAsignado,
                req.rut(),
                req.telefono()
        );
    }

    @PUT
    @Path("/users/{id}")
    public Usuario actualizarUsuarioEnMiTenant(
            @HeaderParam("Authorization") String authHeader,
            @PathParam("id") Long id,
            TenantUserRequest req
    ) {
        JwtTokenService.JwtClaims claims = requireTenantAdminOrOperator(authHeader);
        String tenantId = resolveTenantId(claims);
        return tenantUseCase.actualizarUsuario(
                id,
                tenantId,
                claims.isSuperAdmin(),
                req.nombreCompleto(),
                req.email(),
                req.password(),
                req.rol(),
                req.estado()
        );
    }

    @DELETE
    @Path("/users/{id}")
    public Map<String, Object> eliminarUsuarioEnMiTenant(
            @HeaderParam("Authorization") String authHeader,
            @PathParam("id") Long id
    ) {
        JwtTokenService.JwtClaims claims = requireTenantAdminOrOperator(authHeader);
        String tenantId = resolveTenantId(claims);
        boolean deleted = tenantUseCase.eliminarUsuario(id, tenantId, claims.isSuperAdmin());
        return Map.of("deleted", deleted, "id", id);
    }

    @POST
    @Path("/verificar-puerta")
    public VerificarAccesoUseCase.ResultadoVerificacion verificarEnPuerta(
            @HeaderParam("Authorization") String authHeader,
            VerificacionPuertaRequest req
    ) {
        JwtTokenService.JwtClaims claims = requireTenantAdminOrOperator(authHeader);
        String tenantId = resolveTenantId(claims);
        return verificarAccesoUseCase.verificarAccesoEnPuerta(
                tenantId,
                claims.userId(),
                req.documentoRut(),
                req.capturaEnVivoBase64(),
                req.descriptorCapturaJson(),
                req.huellaCredentialId(),
                req.modoVerificacion(),
                req.puertaAcceso()
        );
    }

    @POST
    @Path("/verificar-ticketera")
    public VerificarAccesoUseCase.ResultadoVerificacion verificarTicketera(
            @HeaderParam("Authorization") String authHeader,
            Map<String, String> body
    ) {
        JwtTokenService.JwtClaims claims = requireTenantAdminOrOperator(authHeader);
        String tenantId = resolveTenantId(claims);
        String rut = body.getOrDefault("documentoRut", "");
        return verificarAccesoUseCase.consultarHabilitacionTicketera(tenantId, rut);
    }

    @POST
    @Path("/prohibiciones")
    public ProhibicionIngreso crearProhibicion(
            @HeaderParam("Authorization") String authHeader,
            ProhibicionRequest req
    ) {
        JwtTokenService.JwtClaims claims = requireTenantAdminOrOperator(authHeader);
        String tenantId = resolveTenantId(claims);
        return verificarAccesoUseCase.registrarProhibicion(
                tenantId,
                claims.userId(),
                req.documentoRut(),
                req.nombreReferencia(),
                req.codigoCausal(),
                req.motivo(),
                req.alcance()
        );
    }

    @DELETE
    @Path("/prohibiciones/{id}")
    public Map<String, Object> levantarProhibicion(
            @HeaderParam("Authorization") String authHeader,
            @PathParam("id") Long id
    ) {
        JwtTokenService.JwtClaims claims = requireTenantAdminOrOperator(authHeader);
        String tenantId = resolveTenantId(claims);
        boolean ok = verificarAccesoUseCase.levantarProhibicion(id, tenantId, claims.isSuperAdmin());
        return Map.of("levantada", ok, "id", id);
    }
}
