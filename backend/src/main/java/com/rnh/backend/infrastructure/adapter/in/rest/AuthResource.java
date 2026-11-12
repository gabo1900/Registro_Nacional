package com.rnh.backend.infrastructure.adapter.in.rest;

import com.rnh.backend.domain.model.Hincha;
import com.rnh.backend.domain.model.Usuario;
import com.rnh.backend.domain.port.in.AuthUseCase;
import com.rnh.backend.domain.port.in.EnrolarHinchaUseCase;
import com.rnh.backend.domain.port.out.UsuarioRepositoryPort;
import com.rnh.backend.infrastructure.security.JwtTokenService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.LinkedHashMap;
import java.util.Map;

@Path("/api/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject
    AuthUseCase authUseCase;

    @Inject
    EnrolarHinchaUseCase enrolarHinchaUseCase;

    @Inject
    UsuarioRepositoryPort usuarioRepository;

    @Inject
    JwtTokenService jwtTokenService;

    public record LoginRequest(String emailOrRut, String password, String tenantCodigo) {}

    public record GoogleAuthRequest(String credential, String tokenType, String tenantCodigo) {}

    @POST
    @Path("/login")
    public Map<String, Object> login(LoginRequest req) {
        if (req == null) {
            throw new IllegalArgumentException("Payload de inicio de sesión vacío.");
        }
        AuthUseCase.AuthResult result = authUseCase.loginConCredenciales(
                req.emailOrRut(),
                req.password(),
                req.tenantCodigo()
        );
        return buildAuthResponse(result);
    }

    @POST
    @Path("/google")
    public Map<String, Object> loginWithGoogle(GoogleAuthRequest req) {
        if (req == null || req.credential() == null || req.credential().isBlank()) {
            throw new IllegalArgumentException("No se recibió el token de credencial de Google OAuth 2.0.");
        }
        AuthUseCase.AuthResult result = authUseCase.loginConGoogle(
                req.credential(),
                req.tokenType() != null ? req.tokenType() : "id_token",
                req.tenantCodigo()
        );
        return buildAuthResponse(result);
    }

    @POST
    @Path("/register")
    public Map<String, Object> registerHincha(AuthUseCase.RegisterHinchaCommand cmd) {
        if (cmd == null) {
            throw new IllegalArgumentException("Datos de enrolamiento vacíos.");
        }
        AuthUseCase.AuthResult result = authUseCase.registrarEIniciarHincha(cmd);
        return buildAuthResponse(result);
    }

    @POST
    @Path("/register-basic")
    public Map<String, Object> registerBasic(AuthUseCase.SimpleRegisterCommand cmd) {
        if (cmd == null) {
            throw new IllegalArgumentException("Datos de registro inicial vacíos.");
        }
        AuthUseCase.AuthResult result = authUseCase.registroBasico(cmd);
        return buildAuthResponse(result);
    }

    @GET
    @Path("/me")
    public Map<String, Object> me(@HeaderParam("Authorization") String authHeader) {
        JwtTokenService.JwtClaims claims = jwtTokenService.validateAndParse(authHeader)
                .orElseThrow(() -> new SecurityException("Sesión expirada o token JWT inválido."));
        Usuario u = usuarioRepository.findById(claims.userId())
                .orElseThrow(() -> new SecurityException("Usuario no encontrado."));
        u.setPasswordHash(null);
        Hincha h = enrolarHinchaUseCase.obtenerPerfilHincha(u.getId());
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("usuario", u);
        resp.put("hincha", h);
        return resp;
    }

    private Map<String, Object> buildAuthResponse(AuthUseCase.AuthResult result) {
        Hincha hincha = enrolarHinchaUseCase.obtenerPerfilHincha(result.usuario().getId());
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("accessToken", result.accessToken());
        map.put("tokenType", "Bearer");
        map.put("expiresIn", result.expiresInSeconds());
        map.put("usuario", result.usuario());
        map.put("hincha", hincha);
        return map;
    }
}
