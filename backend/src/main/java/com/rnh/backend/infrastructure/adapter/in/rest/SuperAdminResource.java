package com.rnh.backend.infrastructure.adapter.in.rest;

import com.rnh.backend.domain.exception.TenantIsolationException;
import com.rnh.backend.domain.model.Tenant;
import com.rnh.backend.domain.model.Usuario;
import com.rnh.backend.domain.port.in.TenantManagementUseCase;
import com.rnh.backend.domain.port.in.VerificarAccesoUseCase;
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
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Path("/api/superadmin")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SuperAdminResource {

    @Inject
    TenantManagementUseCase tenantUseCase;

    @Inject
    VerificarAccesoUseCase verificarAccesoUseCase;

    @Inject
    JwtTokenService jwtTokenService;

    public record CreateTenantRequest(
            String nombre,
            String codigo,
            String rutEmpresa,
            String tipoEntidad,
            String estado,
            int maxUsuarios,
            String modulosActivos,
            String adminNombre,
            String adminEmail,
            String adminPassword
    ) {}

    public record CreateUserRequest(
            String tenantId,
            String nombreCompleto,
            String email,
            String password,
            String rol,
            String estado,
            String rut,
            String telefono
    ) {}

    private JwtTokenService.JwtClaims requireSuperAdmin(String authHeader) {
        JwtTokenService.JwtClaims claims = jwtTokenService.validateAndParse(authHeader)
                .orElseThrow(() -> new SecurityException("Debe iniciar sesión para acceder al panel global."));
        if (!claims.isSuperAdmin()) {
            throw new TenantIsolationException("Acceso exclusivo para el rol SUPER_ADMIN.");
        }
        return claims;
    }

    @GET
    @Path("/dashboard")
    public Map<String, Object> obtenerDashboardGlobal(
            @HeaderParam("Authorization") String authHeader,
            @QueryParam("tenantId") String filtroTenantId
    ) {
        requireSuperAdmin(authHeader);

        List<Tenant> tenants = tenantUseCase.listarTenants();
        List<Usuario> todosUsuarios = tenantUseCase.listarUsuariosGlobal("TODOS");
        List<Usuario> usuariosVisibles = tenantUseCase.listarUsuariosGlobal(filtroTenantId);

        long tenantsActivos = tenants.stream().filter(t -> "ACTIVE".equalsIgnoreCase(t.getEstado())).count();
        long usuariosActivos = todosUsuarios.stream().filter(u -> "ACTIVE".equalsIgnoreCase(u.getEstado())).count();

        Map<String, Object> kpis = new LinkedHashMap<>();
        kpis.put("totalTenants", tenants.size());
        kpis.put("tenantsActivos", tenantsActivos);
        kpis.put("totalUsuarios", todosUsuarios.size());
        kpis.put("usuariosActivos", usuariosActivos);
        kpis.put("usuariosVisibles", usuariosVisibles.size());
        kpis.put("filtroActual", (filtroTenantId == null || filtroTenantId.isBlank()) ? "TODOS" : filtroTenantId);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("kpis", kpis);
        response.put("tenants", tenants);
        response.put("usuarios", usuariosVisibles);
        response.put("logsRecientes", verificarAccesoUseCase.listarBitacoraAccesos(filtroTenantId, true, 25));
        response.put("prohibiciones", verificarAccesoUseCase.listarProhibiciones(null, true));
        return response;
    }

    @POST
    @Path("/tenants")
    public Tenant crearTenant(@HeaderParam("Authorization") String authHeader, CreateTenantRequest req) {
        requireSuperAdmin(authHeader);
        Tenant t = new Tenant();
        t.setNombre(req.nombre());
        t.setCodigo(req.codigo());
        t.setRutEmpresa(req.rutEmpresa());
        t.setTipoEntidad(req.tipoEntidad() != null ? req.tipoEntidad() : "ESTADIO_MUNICIPAL");
        t.setEstado(req.estado() != null ? req.estado() : "ACTIVE");
        t.setMaxUsuarios(req.maxUsuarios() > 0 ? req.maxUsuarios() : 10);
        t.setModulosActivos(req.modulosActivos() != null && !req.modulosActivos().isBlank()
                ? req.modulosActivos()
                : "BIOMETRIA_FACIAL,HUELLA_DIGITAL,DERECHO_ADMISION,TICKETERA,AUDITORIA");
        return tenantUseCase.crearTenant(t, req.adminEmail(), req.adminNombre(), req.adminPassword());
    }

    @PUT
    @Path("/tenants/{id}")
    public Tenant actualizarTenant(
            @HeaderParam("Authorization") String authHeader,
            @PathParam("id") String id,
            CreateTenantRequest req
    ) {
        requireSuperAdmin(authHeader);
        Tenant t = new Tenant();
        t.setNombre(req.nombre());
        t.setCodigo(req.codigo());
        t.setRutEmpresa(req.rutEmpresa());
        t.setTipoEntidad(req.tipoEntidad());
        t.setEstado(req.estado());
        t.setMaxUsuarios(req.maxUsuarios());
        t.setModulosActivos(req.modulosActivos());
        return tenantUseCase.actualizarTenant(id, t);
    }

    @DELETE
    @Path("/tenants/{id}")
    public Map<String, Object> eliminarTenant(
            @HeaderParam("Authorization") String authHeader,
            @PathParam("id") String id
    ) {
        requireSuperAdmin(authHeader);
        boolean deleted = tenantUseCase.eliminarTenant(id);
        return Map.of("deleted", deleted, "id", id);
    }

    @POST
    @Path("/users")
    public Usuario crearUsuarioGlobal(@HeaderParam("Authorization") String authHeader, CreateUserRequest req) {
        requireSuperAdmin(authHeader);
        return tenantUseCase.crearUsuarioEnTenant(
                req.tenantId(),
                req.nombreCompleto(),
                req.email(),
                req.password(),
                req.rol(),
                req.rut(),
                req.telefono()
        );
    }

    @PUT
    @Path("/users/{id}")
    public Usuario actualizarUsuarioGlobal(
            @HeaderParam("Authorization") String authHeader,
            @PathParam("id") Long id,
            CreateUserRequest req
    ) {
        requireSuperAdmin(authHeader);
        return tenantUseCase.actualizarUsuario(
                id,
                req.tenantId(),
                true,
                req.nombreCompleto(),
                req.email(),
                req.password(),
                req.rol(),
                req.estado()
        );
    }

    @DELETE
    @Path("/users/{id}")
    public Map<String, Object> eliminarUsuarioGlobal(
            @HeaderParam("Authorization") String authHeader,
            @PathParam("id") Long id
    ) {
        requireSuperAdmin(authHeader);
        boolean deleted = tenantUseCase.eliminarUsuario(id, null, true);
        return Map.of("deleted", deleted, "id", id);
    }
}
