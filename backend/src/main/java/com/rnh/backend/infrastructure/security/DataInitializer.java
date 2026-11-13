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

    @Inject
    SuperAdminPolicy superAdminPolicy;

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

        // 2. Asegurar Super Administradores Globales: SOLO los correos exactos de rnh.security.super-admin-emails (clave inicial 1234)
        for (String email : superAdminPolicy.correos()) {
            crearSuperAdminSiNoExiste(anfp, email);
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

    private void crearSuperAdminSiNoExiste(Tenant anfp, String email) {
        if (usuarioRepository.findByEmail(email).isEmpty()) {
            Usuario superAdmin = new Usuario();
            superAdmin.setUuid(UUID.randomUUID().toString());
            superAdmin.setTenantId(anfp.getId());
            superAdmin.setNombreCompleto("Gabriel Yáñez (Super Administrador RNH)");
            superAdmin.setEmail(email);
            superAdmin.setPasswordHash(cryptoService.hashPassword("1234"));
            superAdmin.setRol("SUPER_ADMIN");
            superAdmin.setEstado("ACTIVE");
            superAdmin.setRutDecrypted("17845920K");
            superAdmin.setRutHash(cryptoService.hmacSha256("17845920K"));
            superAdmin.setTelefonoDecrypted("+56987654321");
            superAdmin.setUltimoAcceso(LocalDateTime.now());
            usuarioRepository.save(superAdmin);
        }
    }
}
