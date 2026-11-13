package com.rnh.backend.application.service;

import com.rnh.backend.domain.exception.ConsentimientoFaltanteException;
import com.rnh.backend.domain.model.Consentimiento;
import com.rnh.backend.domain.model.Hincha;
import com.rnh.backend.domain.model.HuellaBiometrica;
import com.rnh.backend.domain.model.Tenant;
import com.rnh.backend.domain.model.Usuario;
import com.rnh.backend.domain.port.in.AuthUseCase;
import com.rnh.backend.domain.port.out.BiometricProviderPort;
import com.rnh.backend.domain.port.out.GoogleAuthPort;
import com.rnh.backend.domain.port.out.HinchaRepositoryPort;
import com.rnh.backend.domain.port.out.TenantRepositoryPort;
import com.rnh.backend.domain.port.out.UsuarioRepositoryPort;
import com.rnh.backend.domain.vo.RutDocumento;
import com.rnh.backend.domain.vo.VectorBiometricoRef;
import com.rnh.backend.infrastructure.security.CryptoService;
import com.rnh.backend.infrastructure.security.JwtTokenService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class AuthApplicationService implements AuthUseCase {

    @Inject
    UsuarioRepositoryPort usuarioRepository;

    @Inject
    TenantRepositoryPort tenantRepository;

    @Inject
    HinchaRepositoryPort hinchaRepository;

    @Inject
    BiometricProviderPort biometricProvider;

    @Inject
    GoogleAuthPort googleAuthPort;

    @Inject
    CryptoService cryptoService;

    @Inject
    JwtTokenService jwtTokenService;

    @Override
    @Transactional
    public AuthResult loginConCredenciales(String emailOrRut, String password, String tenantCodigo) {
        if (emailOrRut == null || emailOrRut.isBlank() || password == null || password.isBlank()) {
            throw new IllegalArgumentException("Debe ingresar su correo/RUT y contraseña.");
        }

        String tenantIdFiltro = null;
        if (tenantCodigo != null && !tenantCodigo.isBlank() && !"TODOS".equalsIgnoreCase(tenantCodigo)) {
            Optional<Tenant> tOpt = tenantRepository.findByCodigo(tenantCodigo.trim());
            if (tOpt.isPresent()) {
                tenantIdFiltro = tOpt.get().getId();
            }
        }

        Usuario autenticado = null;

        // 1. Búsqueda por Email
        List<Usuario> candidatos = usuarioRepository.findByEmail(emailOrRut.trim());
        for (Usuario u : candidatos) {
            boolean tenantMatch = (tenantIdFiltro == null)
                    || "SUPER_ADMIN".equalsIgnoreCase(u.getRol())
                    || tenantIdFiltro.equals(u.getTenantId());
            if (tenantMatch && cryptoService.verifyPassword(password, u.getPasswordHash())) {
                autenticado = u;
                break;
            }
        }

        // 2. Si no se encontró por email, buscar por Hash HMAC-SHA256 de RUT/Documento
        if (autenticado == null) {
            String rutNorm = RutDocumento.normalizar(emailOrRut);
            String rutHash = cryptoService.hmacSha256(rutNorm);
            Optional<Usuario> porRut = usuarioRepository.findByRutHashAndTenant(rutHash, tenantIdFiltro);
            if (porRut.isPresent() && cryptoService.verifyPassword(password, porRut.get().getPasswordHash())) {
                autenticado = porRut.get();
            }
        }

        if (autenticado == null) {
            throw new SecurityException("Credenciales inválidas o usuario no pertenece al Tenant seleccionado.");
        }

        validarEstadoUsuarioYTenant(autenticado);

        autenticado.setUltimoAcceso(LocalDateTime.now());
        autenticado = usuarioRepository.save(autenticado);

        String token = jwtTokenService.generateToken(autenticado);
        return new AuthResult(token, jwtTokenService.getTokenLifespanSeconds(), sanitizeUsuario(autenticado));
    }

    @Override
    @Transactional
    public AuthResult loginConGoogle(String googleCredentialToken, String tokenType, String tenantCodigo) {
        GoogleAuthPort.GoogleUserInfo googleUser = googleAuthPort
                .verificarTokenConGoogle(googleCredentialToken, tokenType)
                .orElseThrow(() -> new SecurityException(
                        "El token de Google no pudo ser verificado con los servidores oficiales de Google OAuth 2.0."
                ));

        if (!googleUser.emailVerified()) {
            throw new SecurityException("La cuenta de Google no tiene el correo electrónico verificado.");
        }

        Tenant targetTenant = resolverTenantPorCodigoODefault(tenantCodigo);

        // Buscar si el usuario ya existe por email
        List<Usuario> existentes = usuarioRepository.findByEmail(googleUser.email());
        Usuario usuario = null;

        for (Usuario u : existentes) {
            if ("SUPER_ADMIN".equalsIgnoreCase(u.getRol())) {
                usuario = u;
                break;
            }
            if (targetTenant.getId().equals(u.getTenantId())) {
                usuario = u;
                break;
            }
        }
        if (usuario == null && !existentes.isEmpty()) {
            usuario = existentes.get(0);
        }

        boolean isSuperAdminEmail = "yanezgabriel787@gmail.com".equalsIgnoreCase(googleUser.email())
                || "yanezgabriel3416@gmail.com".equalsIgnoreCase(googleUser.email())
                || "yanezgabriel78910@gmail.com".equalsIgnoreCase(googleUser.email());

        if (usuario == null) {
            // Provisión automática en el tenant seleccionado para nuevo usuario verificado por Google
            usuario = new Usuario();
            usuario.setUuid(UUID.randomUUID().toString());
            usuario.setTenantId(targetTenant.getId());
            usuario.setNombreCompleto(googleUser.name());
            usuario.setEmail(googleUser.email());
            usuario.setPasswordHash(cryptoService.hashPassword(UUID.randomUUID().toString()));
            usuario.setRol(isSuperAdminEmail ? "SUPER_ADMIN" : "USUARIO");
            usuario.setEstado("ACTIVE");
        } else if (isSuperAdminEmail) {
            usuario.setRol("SUPER_ADMIN");
        }

        usuario.setGoogleSub(googleUser.sub());
        usuario.setAvatarUrl(googleUser.pictureUrl());
        usuario.setUltimoAcceso(LocalDateTime.now());

        validarEstadoUsuarioYTenant(usuario);
        usuario = usuarioRepository.save(usuario);

        String token = jwtTokenService.generateToken(usuario);
        return new AuthResult(token, jwtTokenService.getTokenLifespanSeconds(), sanitizeUsuario(usuario));
    }

    @Override
    @Transactional
    public AuthResult registrarEIniciarHincha(RegisterHinchaCommand cmd) {
        if (!cmd.aceptaTerminosGenerales() || !cmd.aceptaTratamientoBiometrico()) {
            throw new ConsentimientoFaltanteException(
                    "Es obligatorio aceptar expresamente los Términos y Condiciones de la ANFP y el consentimiento de datos biométricos (Ley N° 19.628)."
            );
        }

        RutDocumento rutVo = new RutDocumento(cmd.numeroDocumento(), cmd.tipoDocumento());
        String docHash = cryptoService.hmacSha256(rutVo.getValorNormalizado());

        Tenant tenant = resolverTenantPorCodigoODefault(cmd.tenantCodigo());

        Optional<Usuario> existenteEmail = usuarioRepository.findByEmailAndTenant(cmd.email(), tenant.getId());
        if (existenteEmail.isPresent()) {
            throw new IllegalArgumentException("Ya existe un usuario registrado con ese correo electrónico en este recinto/tenant.");
        }

        // 1. Procesar biometría facial con prueba de vida (Zero-Retention de imágenes crudas)
        VectorBiometricoRef vectorRef = biometricProvider.registrarRostroYDocumento(
                rutVo.getValorNormalizado(),
                cmd.fotoDocumentoBase64(),
                cmd.selfieBase64(),
                cmd.descriptorFacialJson()
        );

        // 2. Crear Usuario en el Tenant
        Usuario nuevoUsuario = new Usuario();
        nuevoUsuario.setUuid(UUID.randomUUID().toString());
        nuevoUsuario.setTenantId(tenant.getId());
        nuevoUsuario.setNombreCompleto((cmd.nombres() + " " + cmd.apellidos()).trim());
        nuevoUsuario.setEmail(cmd.email().trim().toLowerCase());
        nuevoUsuario.setPasswordHash(cryptoService.hashPassword(cmd.password()));
        nuevoUsuario.setRol("USUARIO");
        nuevoUsuario.setEstado("ACTIVE");
        nuevoUsuario.setRutHash(docHash);
        nuevoUsuario.setRutDecrypted(rutVo.getValorNormalizado());
        nuevoUsuario.setTelefonoDecrypted(cmd.telefono());
        nuevoUsuario.setUltimoAcceso(LocalDateTime.now());
        nuevoUsuario = usuarioRepository.save(nuevoUsuario);

        // 3. Crear registro Hincha RNH con datos sensibles cifrados (AES-256-GCM)
        Hincha hincha = new Hincha();
        hincha.setUsuarioId(nuevoUsuario.getId());
        hincha.setTenantId(tenant.getId());
        hincha.setTipoDocumento(rutVo.getTipoDocumento());
        hincha.setDocumentoHash(docHash);
        hincha.setDocumentoDecrypted(rutVo.getValorNormalizado());
        hincha.setNombres(cmd.nombres().trim());
        hincha.setApellidos(cmd.apellidos().trim());
        if (cmd.fechaNacimiento() != null && !cmd.fechaNacimiento().isBlank()) {
            try {
                hincha.setFechaNacimiento(LocalDate.parse(cmd.fechaNacimiento()));
            } catch (Exception ignored) {}
        }
        hincha.setNacionalidad(cmd.nacionalidad() != null && !cmd.nacionalidad().isBlank() ? cmd.nacionalidad() : "Chilena");
        hincha.setBiometricTokenRef(vectorRef.getTokenReferencia());
        hincha.setLivenessPassed(vectorRef.isLivenessSuperado());
        hincha.setLivenessScore(vectorRef.getLivenessScore());
        boolean tieneHuella = cmd.huellaCredentialId() != null && !cmd.huellaCredentialId().isBlank();
        hincha.setHuellaRegistrada(tieneHuella);
        hincha.setEstadoEnrolamiento("COMPLETADO");
        hincha = hinchaRepository.save(hincha, vectorRef.getVectorCifrado());

        // 4. Guardar evidencia inmutable del Consentimiento Legal (Ley N° 19.628)
        Consentimiento consentimiento = new Consentimiento();
        consentimiento.setHinchaId(hincha.getId());
        consentimiento.setUsuarioId(nuevoUsuario.getId());
        consentimiento.setTenantId(tenant.getId());
        consentimiento.setAceptaTerminosGenerales(true);
        consentimiento.setAceptaTratamientoBiometrico(true);
        consentimiento.setAceptaTransferenciaProcesamiento(true);
        consentimiento.setVersionTerminos("ANFP-RNH-2026-v1.0");
        consentimiento.setIpOrigen(cmd.ipOrigen() != null ? cmd.ipOrigen() : "127.0.0.1");
        consentimiento.setHashDocumentoLegal(cryptoService.hmacSha256("TERMINOS_ANFP_RNH_2026:" + docHash));
        hinchaRepository.saveConsentimiento(consentimiento);

        // 5. Si adjuntó Huella Digital (WebAuthn / Sensor Biométrico), persistirla cifrada
        if (tieneHuella) {
            HuellaBiometrica huella = new HuellaBiometrica();
            huella.setHinchaId(hincha.getId());
            huella.setUsuarioId(nuevoUsuario.getId());
            huella.setTenantId(tenant.getId());
            huella.setCredentialId(cmd.huellaCredentialId());
            String pubKey = cmd.huellaPublicKey() != null ? cmd.huellaPublicKey() : "COSE_KEY_" + cmd.huellaCredentialId();
            huella.setPublicKeyEncrypted(pubKey);
            huella.setHuellaHash(cryptoService.hmacSha256(cmd.huellaCredentialId() + ":" + docHash));
            huella.setDispositivoTipo(cmd.huellaDispositivoTipo() != null ? cmd.huellaDispositivoTipo() : "WEBAUTHN_FIDO2_PLATFORM");
            huella.setDedoIndice(cmd.huellaDedo() != null ? cmd.huellaDedo() : "INDICE_DERECHO");
            huella.setSignCount(1L);
            huella.setActivo(true);
            hinchaRepository.saveHuella(huella);
        }

        String token = jwtTokenService.generateToken(nuevoUsuario);
        return new AuthResult(token, jwtTokenService.getTokenLifespanSeconds(), sanitizeUsuario(nuevoUsuario));
    }

    @Override
    @Transactional
    public AuthResult registroBasico(SimpleRegisterCommand cmd) {
        if (cmd.email() == null || cmd.email().isBlank() || cmd.password() == null || cmd.password().isBlank()) {
            throw new IllegalArgumentException("Debe ingresar correo electrónico y contraseña.");
        }
        if (cmd.rut() == null || cmd.rut().isBlank()) {
            throw new IllegalArgumentException("El número de documento / RUT es obligatorio.");
        }

        RutDocumento rutVo = new RutDocumento(cmd.rut(), "CEDULA_CHILE");
        String docHash = cryptoService.hmacSha256(rutVo.getValorNormalizado());

        Tenant tenant = resolverTenantPorCodigoODefault(cmd.tenantCodigo());

        Optional<Usuario> existenteEmail = usuarioRepository.findByEmailAndTenant(cmd.email(), tenant.getId());
        if (existenteEmail.isPresent()) {
            throw new IllegalArgumentException("Ya existe un usuario registrado con ese correo en este recinto.");
        }

        Usuario nuevoUsuario = new Usuario();
        nuevoUsuario.setUuid(UUID.randomUUID().toString());
        nuevoUsuario.setTenantId(tenant.getId());
        nuevoUsuario.setNombreCompleto(cmd.nombreCompleto() != null && !cmd.nombreCompleto().isBlank()
                ? cmd.nombreCompleto().trim()
                : "Usuario RNH");
        nuevoUsuario.setEmail(cmd.email().trim().toLowerCase());
        nuevoUsuario.setPasswordHash(cryptoService.hashPassword(cmd.password()));
        nuevoUsuario.setRol("USUARIO");
        nuevoUsuario.setEstado("ACTIVE");
        nuevoUsuario.setRutHash(docHash);
        nuevoUsuario.setRutDecrypted(rutVo.getValorNormalizado());
        nuevoUsuario.setTelefonoDecrypted(cmd.telefono());
        nuevoUsuario.setUltimoAcceso(LocalDateTime.now());
        nuevoUsuario = usuarioRepository.save(nuevoUsuario);

        String token = jwtTokenService.generateToken(nuevoUsuario);
        return new AuthResult(token, jwtTokenService.getTokenLifespanSeconds(), sanitizeUsuario(nuevoUsuario));
    }

    private Tenant resolverTenantPorCodigoODefault(String tenantCodigo) {
        if (tenantCodigo != null && !tenantCodigo.isBlank()) {
            Optional<Tenant> found = tenantRepository.findByCodigo(tenantCodigo.trim());
            if (found.isPresent()) return found.get();
            Optional<Tenant> byId = tenantRepository.findById(tenantCodigo.trim());
            if (byId.isPresent()) return byId.get();
        }
        return tenantRepository.findByCodigo("anfp-central")
                .or(() -> tenantRepository.findAll().stream().findFirst())
                .orElseThrow(() -> new IllegalStateException("No existen Tenants activos en el sistema."));
    }

    private void validarEstadoUsuarioYTenant(Usuario u) {
        if (!"ACTIVE".equalsIgnoreCase(u.getEstado())) {
            throw new SecurityException("Su cuenta de usuario se encuentra suspendida o inactiva.");
        }
        if (!"SUPER_ADMIN".equalsIgnoreCase(u.getRol()) && u.getTenantId() != null) {
            Tenant t = tenantRepository.findById(u.getTenantId())
                    .orElseThrow(() -> new SecurityException("El Tenant asociado a su cuenta no existe."));
            if (!"ACTIVE".equalsIgnoreCase(t.getEstado())) {
                throw new SecurityException("La entidad/estadio (" + t.getNombre() + ") se encuentra temporalmente suspendida.");
            }
        }
    }

    private Usuario sanitizeUsuario(Usuario u) {
        Usuario clean = new Usuario();
        clean.setId(u.getId());
        clean.setUuid(u.getUuid());
        clean.setTenantId(u.getTenantId());
        clean.setTenantNombre(u.getTenantNombre());
        clean.setTenantCodigo(u.getTenantCodigo());
        clean.setNombreCompleto(u.getNombreCompleto());
        clean.setEmail(u.getEmail());
        clean.setRol(u.getRol());
        clean.setEstado(u.getEstado());
        clean.setGoogleSub(u.getGoogleSub());
        clean.setAvatarUrl(u.getAvatarUrl());
        clean.setRutDecrypted(u.getRutDecrypted());
        clean.setTelefonoDecrypted(u.getTelefonoDecrypted());
        clean.setUltimoAcceso(u.getUltimoAcceso());
        clean.setCreatedAt(u.getCreatedAt());
        return clean;
    }
}
