package com.rnh.backend.infrastructure.adapter.in.rest;

import com.rnh.backend.domain.model.Consentimiento;
import com.rnh.backend.domain.model.Hincha;
import com.rnh.backend.domain.model.HuellaBiometrica;
import com.rnh.backend.domain.model.SolicitudArco;
import com.rnh.backend.domain.model.Usuario;
import com.rnh.backend.domain.port.in.EnrolarHinchaUseCase;
import com.rnh.backend.domain.port.in.VerificarAccesoUseCase;
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

@Path("/api/hincha")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class HinchaPortalResource {

    @Inject
    EnrolarHinchaUseCase enrolarHinchaUseCase;

    @Inject
    VerificarAccesoUseCase verificarAccesoUseCase;

    @Inject
    UsuarioRepositoryPort usuarioRepository;

    @Inject
    JwtTokenService jwtTokenService;

    public record RegistrarHuellaRequest(
            String credentialId,
            String publicKey,
            String dispositivoTipo,
            String dedoIndice
    ) {}

    public record SolicitudArcoRequest(
            String tipoDerecho,
            String fundamento
    ) {}

    private JwtTokenService.JwtClaims requireAuthenticated(String authHeader) {
        return jwtTokenService.validateAndParse(authHeader)
                .orElseThrow(() -> new SecurityException("Debe iniciar sesión para acceder a su portal RNH."));
    }

    @GET
    @Path("/perfil")
    public Map<String, Object> obtenerPortalHincha(@HeaderParam("Authorization") String authHeader) {
        JwtTokenService.JwtClaims claims = requireAuthenticated(authHeader);
        Usuario usuario = usuarioRepository.findById(claims.userId())
                .orElseThrow(() -> new SecurityException("Usuario no encontrado."));
        usuario.setPasswordHash(null);

        Hincha hincha = enrolarHinchaUseCase.obtenerPerfilHincha(claims.userId());
        Consentimiento consentimiento = enrolarHinchaUseCase.obtenerConsentimientoUsuario(claims.userId());

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("usuario", usuario);
        resp.put("hincha", hincha);
        resp.put("consentimiento", consentimiento);
        resp.put("huellas", enrolarHinchaUseCase.listarHuellasUsuario(claims.userId()));
        resp.put("historialAccesos", verificarAccesoUseCase.listarAccesosPorUsuario(claims.userId()));
        resp.put("solicitudesArco", enrolarHinchaUseCase.listarSolicitudesArcoUsuario(claims.userId()));
        return resp;
    }

    @POST
    @Path("/biometria")
    public Hincha actualizarEnrolamientoBiometrico(
            @HeaderParam("Authorization") String authHeader,
            EnrolarHinchaUseCase.ActualizarBiometriaCommand body
    ) {
        JwtTokenService.JwtClaims claims = requireAuthenticated(authHeader);
        EnrolarHinchaUseCase.ActualizarBiometriaCommand cmd = new EnrolarHinchaUseCase.ActualizarBiometriaCommand(
                claims.userId(),
                claims.tenantId() != null && !claims.tenantId().isBlank() ? claims.tenantId() : "anfp-central",
                body.tipoDocumento(),
                body.numeroDocumento(),
                body.nombres(),
                body.apellidos(),
                body.fechaNacimiento(),
                body.nacionalidad(),
                body.aceptaTerminosGenerales(),
                body.aceptaTratamientoBiometrico(),
                body.fotoDocumentoBase64(),
                body.selfieBase64(),
                body.descriptorFacialJson(),
                "127.0.0.1"
        );
        return enrolarHinchaUseCase.enrolarOActualizarBiometria(cmd);
    }

    @POST
    @Path("/huella")
    public HuellaBiometrica registrarHuella(
            @HeaderParam("Authorization") String authHeader,
            RegistrarHuellaRequest req
    ) {
        JwtTokenService.JwtClaims claims = requireAuthenticated(authHeader);
        return enrolarHinchaUseCase.registrarHuella(
                claims.userId(),
                claims.tenantId(),
                req.credentialId(),
                req.publicKey(),
                req.dispositivoTipo(),
                req.dedoIndice()
        );
    }

    @jakarta.ws.rs.DELETE
    @Path("/huella/{huellaId}")
    public Map<String, Object> eliminarMiHuella(
            @HeaderParam("Authorization") String authHeader,
            @jakarta.ws.rs.PathParam("huellaId") Long huellaId
    ) {
        JwtTokenService.JwtClaims claims = requireAuthenticated(authHeader);
        boolean ok = enrolarHinchaUseCase.eliminarHuella(huellaId, claims.userId(), claims.tenantId(), claims.isSuperAdmin());
        if (!ok) {
            throw new IllegalArgumentException("No se encontró la huella para eliminar.");
        }
        return Map.of("eliminada", true, "huellaId", huellaId);
    }

    @POST
    @Path("/arco")
    public SolicitudArco ejercerDerechoArco(
            @HeaderParam("Authorization") String authHeader,
            SolicitudArcoRequest req
    ) {
        JwtTokenService.JwtClaims claims = requireAuthenticated(authHeader);
        return enrolarHinchaUseCase.crearSolicitudArco(
                claims.userId(),
                claims.tenantId() != null && !claims.tenantId().isBlank() ? claims.tenantId() : "anfp-central",
                req.tipoDerecho(),
                req.fundamento()
        );
    }
}
