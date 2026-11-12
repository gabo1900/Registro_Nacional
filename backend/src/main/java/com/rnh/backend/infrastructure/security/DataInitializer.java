package com.rnh.backend.infrastructure.security;

import com.rnh.backend.domain.model.Consentimiento;
import com.rnh.backend.domain.model.Hincha;
import com.rnh.backend.domain.model.HuellaBiometrica;
import com.rnh.backend.domain.model.ProhibicionIngreso;
import com.rnh.backend.domain.model.Tenant;
import com.rnh.backend.domain.model.Usuario;
import com.rnh.backend.domain.port.out.HinchaRepositoryPort;
import com.rnh.backend.domain.port.out.ProhibicionRepositoryPort;
import com.rnh.backend.domain.port.out.TenantRepositoryPort;
import com.rnh.backend.domain.port.out.UsuarioRepositoryPort;
import com.rnh.backend.domain.vo.RutDocumento;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@ApplicationScoped
public class DataInitializer {

    @Inject
    TenantRepositoryPort tenantRepository;

    @Inject
    UsuarioRepositoryPort usuarioRepository;

    @Inject
    HinchaRepositoryPort hinchaRepository;

    @Inject
    ProhibicionRepositoryPort prohibicionRepository;

    @Inject
    CryptoService cryptoService;

    @Transactional
    public void onStart(@Observes StartupEvent ev) {
        // 1. Asegurar Tenants base
        Tenant anfp = ensureTenant(
                "02da80fb-f3b3-4c93-a90c-ec7dcc3d6462",
                "anfp-central",
                "ANFP Central Chile (Entidad Rectora)",
                "70.015.400-7",
                "ENTIDAD_RECTORA",
                25
        );

        Tenant estadioMunicipal = ensureTenant(
                "9691b2ce-d442-4be3-8c62-0eb17abbe2c5",
                "estadio-municipal",
                "Estadio Municipal Ester Roa",
                "69.150.200-K",
                "ESTADIO_MUNICIPAL",
                15
        );

        Tenant estadioNacional = ensureTenant(
                "2981ed7d-984b-497c-9a37-598904bc92fa",
                "estadio-nacional",
                "Estadio Nacional Julio Martínez",
                "61.979.400-1",
                "ESTADIO_MUNICIPAL",
                20
        );

        Tenant monumental = ensureTenant(
                "14efa5c0-4c0a-4452-a67e-b77288bc1237",
                "monumental",
                "Estadio Monumental (Blanco y Negro S.A.)",
                "99.586.320-4",
                "CLUB_DEPORTIVO",
                15
        );

        ensureTenant(
                "9f4cc3ca-f250-4257-9a8a-7c1df3d3f049",
                "santa-laura",
                "Estadio Santa Laura U-SEK",
                "96.814.510-2",
                "ESTADIO_MUNICIPAL",
                10
        );

        // 2. Asegurar Super Administrador Global solicitado: yanezgabriel787@gmail.com / clave 1234
        if (usuarioRepository.findByEmail("yanezgabriel787@gmail.com").isEmpty()) {
            Usuario superAdmin = new Usuario();
            superAdmin.setUuid(UUID.randomUUID().toString());
            superAdmin.setTenantId(anfp.getId());
            superAdmin.setNombreCompleto("Gabriel Yáñez (Super Administrador RNH)");
            superAdmin.setEmail("yanezgabriel787@gmail.com");
            superAdmin.setPasswordHash(cryptoService.hashPassword("1234"));
            superAdmin.setRol("SUPER_ADMIN");
            superAdmin.setEstado("ACTIVE");
            superAdmin.setRutDecrypted("17845920K");
            superAdmin.setRutHash(cryptoService.hmacSha256("17845920K"));
            superAdmin.setTelefonoDecrypted("+56987654321");
            superAdmin.setUltimoAcceso(LocalDateTime.now());
            usuarioRepository.save(superAdmin);
        }

        // 3. Asegurar Administrador de Tenant (Estadio Municipal)
        if (usuarioRepository.findByEmail("admin@estadiomunicipal.cl").isEmpty()) {
            Usuario adminTenant = new Usuario();
            adminTenant.setUuid(UUID.randomUUID().toString());
            adminTenant.setTenantId(estadioMunicipal.getId());
            adminTenant.setNombreCompleto("Administrador Estadio Municipal");
            adminTenant.setEmail("admin@estadiomunicipal.cl");
            adminTenant.setPasswordHash(cryptoService.hashPassword("1234"));
            adminTenant.setRol("ADMIN_TENANT");
            adminTenant.setEstado("ACTIVE");
            adminTenant.setRutDecrypted("154328765");
            adminTenant.setRutHash(cryptoService.hmacSha256("154328765"));
            adminTenant.setTelefonoDecrypted("+56944556677");
            usuarioRepository.save(adminTenant);
        }

        // 4. Asegurar Operador de Acceso en Estadio Nacional
        if (usuarioRepository.findByEmail("operador@estadionacional.cl").isEmpty()) {
            Usuario operador = new Usuario();
            operador.setUuid(UUID.randomUUID().toString());
            operador.setTenantId(estadioNacional.getId());
            operador.setNombreCompleto("Operador Torniquete Norte");
            operador.setEmail("operador@estadionacional.cl");
            operador.setPasswordHash(cryptoService.hashPassword("1234"));
            operador.setRol("OPERADOR_ACCESO");
            operador.setEstado("ACTIVE");
            usuarioRepository.save(operador);
        }

        // 5. Asegurar Usuario / Hincha enrolado de prueba
        if (usuarioRepository.findByEmail("hincha@estadiomunicipal.cl").isEmpty()) {
            String rutHincha = "18543210K";
            String rutHash = cryptoService.hmacSha256(rutHincha);

            Usuario userHincha = new Usuario();
            userHincha.setUuid(UUID.randomUUID().toString());
            userHincha.setTenantId(estadioMunicipal.getId());
            userHincha.setNombreCompleto("Matías Fernández Hincha");
            userHincha.setEmail("hincha@estadiomunicipal.cl");
            userHincha.setPasswordHash(cryptoService.hashPassword("1234"));
            userHincha.setRol("USUARIO");
            userHincha.setEstado("ACTIVE");
            userHincha.setRutDecrypted(rutHincha);
            userHincha.setRutHash(rutHash);
            userHincha.setTelefonoDecrypted("+56911223344");
            userHincha = usuarioRepository.save(userHincha);

            Hincha hincha = new Hincha();
            hincha.setUsuarioId(userHincha.getId());
            hincha.setTenantId(estadioMunicipal.getId());
            hincha.setTipoDocumento("CEDULA_CHILE");
            hincha.setDocumentoHash(rutHash);
            hincha.setDocumentoDecrypted(rutHincha);
            hincha.setNombres("Matías");
            hincha.setApellidos("Fernández");
            hincha.setFechaNacimiento(LocalDate.of(1996, 5, 14));
            hincha.setNacionalidad("Chilena");
            hincha.setBiometricTokenRef("RNH-BIO-MATIAS14");
            hincha.setLivenessPassed(true);
            hincha.setLivenessScore(0.991);
            hincha.setHuellaRegistrada(true);
            hincha.setEstadoEnrolamiento("COMPLETADO");
            hincha = hinchaRepository.save(hincha, "[0.124,0.531,-0.219,0.882,0.441,-0.112,0.674,0.391]");

            Consentimiento c = new Consentimiento();
            c.setHinchaId(hincha.getId());
            c.setUsuarioId(userHincha.getId());
            c.setTenantId(estadioMunicipal.getId());
            c.setAceptaTerminosGenerales(true);
            c.setAceptaTratamientoBiometrico(true);
            c.setAceptaTransferenciaProcesamiento(true);
            c.setVersionTerminos("ANFP-RNH-2026-v1.0");
            c.setIpOrigen("127.0.0.1");
            c.setHashDocumentoLegal(cryptoService.hmacSha256("TERMINOS_ANFP_RNH_2026:" + rutHash));
            hinchaRepository.saveConsentimiento(c);

            HuellaBiometrica h = new HuellaBiometrica();
            h.setHinchaId(hincha.getId());
            h.setUsuarioId(userHincha.getId());
            h.setTenantId(estadioMunicipal.getId());
            h.setCredentialId("FIDO2-CRED-ESTADIO-18543210K");
            h.setPublicKeyEncrypted("COSE_PUBKEY_ED25519_18543210K");
            h.setHuellaHash(cryptoService.hmacSha256("FIDO2-CRED-ESTADIO-18543210K"));
            h.setDispositivoTipo("TouchID / Sensor Biométrico FIDO2");
            h.setDedoIndice("INDICE_DERECHO");
            h.setSignCount(1L);
            h.setActivo(true);
            hinchaRepository.saveHuella(h);
        }

        // 6. Asegurar ejemplo de Prohibición de Ingreso (Derecho de Admisión Código 101 - Ley N° 19.327)
        String rutSancionado = RutDocumento.normalizar("20.111.222-3");
        String hashSancionado = cryptoService.hmacSha256(rutSancionado);
        if (prohibicionRepository.findActivasByDocumentoHash(hashSancionado, monumental.getId()).isEmpty()) {
            ProhibicionIngreso p = new ProhibicionIngreso();
            p.setTenantId(monumental.getId());
            p.setDocumentoHash(hashSancionado);
            p.setDocumentoMasked("201.***-3");
            p.setNombreReferencia("Individuo Sancionado (Código 101)");
            p.setCodigoCausal("LEY_19327_ART_10_DERECHO_ADMISION");
            p.setMotivo("Prohibición nacional de ingreso a estadios por infracción grave a la Ley N° 19.327 (Estadio Seguro).");
            p.setAlcance("NACIONAL");
            p.setActiva(true);
            prohibicionRepository.save(p);
        }
    }

    private Tenant ensureTenant(String id, String codigo, String nombre, String rutEmpresa, String tipoEntidad, int maxUsuarios) {
        return tenantRepository.findByCodigo(codigo).orElseGet(() -> {
            Tenant t = new Tenant();
            t.setId(id);
            t.setCodigo(codigo);
            t.setNombre(nombre);
            t.setRutEmpresa(rutEmpresa);
            t.setTipoEntidad(tipoEntidad);
            t.setEstado("ACTIVE");
            t.setMaxUsuarios(maxUsuarios);
            t.setStorageUsadoMb(0.12);
            t.setModulosActivos("BIOMETRIA_FACIAL,HUELLA_DIGITAL,DERECHO_ADMISION,TICKETERA,AUDITORIA");
            return tenantRepository.save(t);
        });
    }
}
