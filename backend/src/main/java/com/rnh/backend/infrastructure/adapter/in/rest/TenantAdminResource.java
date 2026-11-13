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
    com.rnh.backend.domain.port.in.EnrolarHinchaUseCase enrolarHinchaUseCase;

    @Inject
    com.rnh.backend.infrastructure.security.CryptoService cryptoService;

    @Inject
    com.rnh.backend.domain.port.out.UsuarioRepositoryPort usuarioRepository;

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

    public record EnrolarHuellaAdminRequest(
            String rut,
            Long hinchaId,
            String credentialId,
            String publicKey,
            String dispositivoTipo,
            String dedoIndice
    ) {}

    public record EnrolarBiometriaAdminRequest(
            String rut,
            String nombres,
            String apellidos,
            String fechaNacimiento,
            String fotoDocumentoBase64,
            String selfieBase64,
            String descriptorFacialJson
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

    @GET
    @Path("/hinchas/buscar")
    public Map<String, Object> buscarHinchaPorRut(
            @HeaderParam("Authorization") String authHeader,
            @jakarta.ws.rs.QueryParam("rut") String rut
    ) {
        requireTenantAdminOrOperator(authHeader);
        if (rut == null || rut.isBlank()) {
            throw new IllegalArgumentException("Debe ingresar un RUT para buscar.");
        }
        String rutNorm = com.rnh.backend.domain.vo.RutDocumento.normalizar(rut);
        String rutHash = cryptoService.hmacSha256(rutNorm);

        Hincha hincha = hinchaRepository.findByDocumentoHash(rutHash)
                .orElseThrow(() -> new IllegalArgumentException("No se encontró ningún hincha con el RUT: " + rutNorm));

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("hincha", hincha);
        resp.put("rutNormalizado", rutNorm);
        resp.put("rutEnmascarado", new com.rnh.backend.domain.vo.RutDocumento(rutNorm, hincha.getTipoDocumento()).getValorEnmascarado());
        resp.put("huellas", enrolarHinchaUseCase.listarHuellasUsuario(hincha.getUsuarioId()));
        resp.put("fotoDocumentoBase64", hincha.getFotoDocumentoBase64());
        resp.put("fotoRostroBase64", hincha.getFotoRostroBase64());
        resp.put("resultadoCotejoDni", hincha.getResultadoCotejoDni());
        return resp;
    }

    @POST
    @Path("/hinchas/enrolar-huella")
    public com.rnh.backend.domain.model.HuellaBiometrica enrolarHuellaAdmin(
            @HeaderParam("Authorization") String authHeader,
            EnrolarHuellaAdminRequest req
    ) {
        JwtTokenService.JwtClaims claims = requireTenantAdminOrOperator(authHeader);
        String tenantId = resolveTenantId(claims);

        Hincha hincha = null;
        if (req.hinchaId() != null) {
            hincha = hinchaRepository.findById(req.hinchaId()).orElse(null);
        }
        if (hincha == null && req.rut() != null && !req.rut().isBlank()) {
            String rutNorm = com.rnh.backend.domain.vo.RutDocumento.normalizar(req.rut());
            String hash = cryptoService.hmacSha256(rutNorm);
            hincha = hinchaRepository.findByDocumentoHash(hash).orElse(null);
        }
        if (hincha == null) {
            throw new IllegalArgumentException("No se encontró al hincha para asociar la huella.");
        }

        return enrolarHinchaUseCase.registrarHuella(
                hincha.getUsuarioId(),
                tenantId,
                req.credentialId(),
                req.publicKey(),
                req.dispositivoTipo() != null ? req.dispositivoTipo() : "Sensor Biométrico FIDO2 / Módulo Estadio",
                req.dedoIndice() != null ? req.dedoIndice() : "INDICE_DERECHO"
        );
    }

    @POST
    @Path("/hinchas/enrolar-biometria")
    public Hincha enrolarBiometriaAdmin(
            @HeaderParam("Authorization") String authHeader,
            EnrolarBiometriaAdminRequest req
    ) {
        JwtTokenService.JwtClaims claims = requireTenantAdminOrOperator(authHeader);
        String tenantId = resolveTenantId(claims);

        if (req.rut() == null || req.rut().isBlank()) {
            throw new IllegalArgumentException("El RUT del hincha es obligatorio.");
        }
        String rutNorm = com.rnh.backend.domain.vo.RutDocumento.normalizar(req.rut());
        String hash = cryptoService.hmacSha256(rutNorm);

        Hincha hincha = hinchaRepository.findByDocumentoHash(hash).orElse(null);
        Long usuarioId;
        if (hincha != null) {
            usuarioId = hincha.getUsuarioId();
        } else {
            // Si el hincha no existe, crear usuario base en el tenant
            Usuario u = new Usuario();
            u.setUuid(java.util.UUID.randomUUID().toString());
            u.setTenantId(tenantId);
            u.setNombreCompleto((req.nombres() + " " + (req.apellidos() != null ? req.apellidos() : "")).trim());
            u.setEmail("hincha." + rutNorm.toLowerCase() + "@rnh.local");
            u.setPasswordHash(cryptoService.hashPassword(java.util.UUID.randomUUID().toString()));
            u.setRol("USUARIO");
            u.setEstado("ACTIVE");
            u.setRutDecrypted(rutNorm);
            u.setRutHash(hash);
            u = usuarioRepository.save(u);
            usuarioId = u.getId();
        }

        com.rnh.backend.domain.port.in.EnrolarHinchaUseCase.ActualizarBiometriaCommand cmd =
                new com.rnh.backend.domain.port.in.EnrolarHinchaUseCase.ActualizarBiometriaCommand(
                        usuarioId,
                        tenantId,
                        "CEDULA_CHILE",
                        rutNorm,
                        req.nombres() != null ? req.nombres() : "Hincha",
                        req.apellidos() != null ? req.apellidos() : "",
                        req.fechaNacimiento(),
                        "Chilena",
                        true,
                        true,
                        req.fotoDocumentoBase64(),
                        req.selfieBase64(),
                        req.descriptorFacialJson(),
                        "127.0.0.1"
                );

        return enrolarHinchaUseCase.enrolarOActualizarBiometria(cmd);
    }
}
