package com.rnh.backend.application.service;

import com.rnh.backend.domain.exception.TenantIsolationException;
import com.rnh.backend.domain.model.Tenant;
import com.rnh.backend.domain.model.Usuario;
import com.rnh.backend.domain.port.in.TenantManagementUseCase;
import com.rnh.backend.domain.port.out.TenantRepositoryPort;
import com.rnh.backend.domain.port.out.UsuarioRepositoryPort;
import com.rnh.backend.domain.vo.RutDocumento;
import com.rnh.backend.infrastructure.security.CryptoService;
import com.rnh.backend.infrastructure.security.SuperAdminPolicy;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class TenantManagementApplicationService implements TenantManagementUseCase {

    @Inject
    TenantRepositoryPort tenantRepository;

    @Inject
    UsuarioRepositoryPort usuarioRepository;

    @Inject
    CryptoService cryptoService;

    @Inject
    SuperAdminPolicy superAdminPolicy;

    @Override
    public List<Tenant> listarTenants() {
        return tenantRepository.findAll();
    }

    @Override
    @Transactional
    public Tenant crearTenant(Tenant tenant, String adminEmail, String adminNombre, String adminPassword) {
        if (tenant.getCodigo() == null || tenant.getCodigo().isBlank()) {
            throw new IllegalArgumentException("El código único del Tenant es obligatorio.");
        }
        if (tenant.getNombre() == null || tenant.getNombre().isBlank()) {
            throw new IllegalArgumentException("El nombre de la empresa/estadio es obligatorio.");
        }
        if (tenantRepository.findByCodigo(tenant.getCodigo()).isPresent()) {
            throw new IllegalArgumentException("Ya existe un Tenant con el código: " + tenant.getCodigo());
        }

        tenant.setId(UUID.randomUUID().toString());
        if (tenant.getEstado() == null || tenant.getEstado().isBlank()) {
            tenant.setEstado("ACTIVE");
        }
        if (tenant.getMaxUsuarios() <= 0) {
            tenant.setMaxUsuarios(10);
        }
        Tenant creado = tenantRepository.save(tenant);

        // Si se proporcionaron credenciales del Administrador inicial del Tenant (ej. Estadio Municipal), crearlo automáticamente
        if (adminEmail != null && !adminEmail.isBlank() && adminPassword != null && !adminPassword.isBlank()) {
            Usuario admin = new Usuario();
            admin.setUuid(UUID.randomUUID().toString());
            admin.setTenantId(creado.getId());
            admin.setNombreCompleto(adminNombre != null && !adminNombre.isBlank() ? adminNombre : "Admin " + creado.getNombre());
            admin.setEmail(adminEmail.trim().toLowerCase());
            admin.setPasswordHash(cryptoService.hashPassword(adminPassword));
            admin.setRol("ADMIN_TENANT");
            admin.setEstado("ACTIVE");
            usuarioRepository.save(admin);
            creado.setUsuariosActuales(1);
        }

        return creado;
    }

    @Override
    @Transactional
    public Tenant actualizarTenant(String id, Tenant datos) {
        Tenant existente = tenantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tenant no encontrado."));
        if (datos.getNombre() != null && !datos.getNombre().isBlank()) {
            existente.setNombre(datos.getNombre());
        }
        if (datos.getCodigo() != null && !datos.getCodigo().isBlank()) {
            existente.setCodigo(datos.getCodigo());
        }
        if (datos.getRutEmpresa() != null) {
            existente.setRutEmpresa(datos.getRutEmpresa());
        }
        if (datos.getTipoEntidad() != null) {
            existente.setTipoEntidad(datos.getTipoEntidad());
        }
        if (datos.getEstado() != null) {
            existente.setEstado(datos.getEstado());
        }
        if (datos.getMaxUsuarios() > 0) {
            existente.setMaxUsuarios(datos.getMaxUsuarios());
        }
        if (datos.getModulosActivos() != null) {
            existente.setModulosActivos(datos.getModulosActivos());
        }
        return tenantRepository.save(existente);
    }

    @Override
    @Transactional
    public boolean eliminarTenant(String id) {
        return tenantRepository.deleteById(id);
    }

    @Override
    public List<Usuario> listarUsuariosGlobal(String filtroTenantId) {
        List<Usuario> lista;
        if (filtroTenantId == null || filtroTenantId.isBlank() || "TODOS".equalsIgnoreCase(filtroTenantId)) {
            lista = usuarioRepository.findAll();
        } else {
            lista = usuarioRepository.findByTenantId(filtroTenantId);
        }
        return lista.stream().map(this::ocultarHash).toList();
    }

    @Override
    public List<Usuario> listarUsuariosPorTenant(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new TenantIsolationException("Se requiere un Tenant válido para consultar sus usuarios.");
        }
        return usuarioRepository.findByTenantId(tenantId).stream().map(this::ocultarHash).toList();
    }

    @Override
    @Transactional
    public Usuario crearUsuarioEnTenant(String tenantId, String nombreCompleto, String email, String password, String rol, String rut, String telefono) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("El Tenant especificado no existe."));

        long actuales = usuarioRepository.countByTenantId(tenantId);
        if (actuales >= tenant.getMaxUsuarios()) {
            throw new IllegalStateException("El Tenant '" + tenant.getNombre() + "' alcanzó su capacidad máxima contratada (" + tenant.getMaxUsuarios() + " usuarios).");
        }

        if (usuarioRepository.findByEmailAndTenant(email, tenantId).isPresent()) {
            throw new IllegalArgumentException("Ya existe un usuario con ese correo dentro de este Tenant.");
        }

        Usuario nuevo = new Usuario();
        nuevo.setUuid(UUID.randomUUID().toString());
        nuevo.setTenantId(tenantId);
        nuevo.setNombreCompleto(nombreCompleto.trim());
        nuevo.setEmail(email.trim().toLowerCase());
        nuevo.setPasswordHash(cryptoService.hashPassword(password));
        nuevo.setRol(rol != null && !rol.isBlank() ? rol : "USUARIO");
        nuevo.setEstado("ACTIVE");

        if (rut != null && !rut.isBlank()) {
            String norm = RutDocumento.normalizar(rut);
            nuevo.setRutDecrypted(norm);
            nuevo.setRutHash(cryptoService.hmacSha256(norm));
        }
        if (telefono != null && !telefono.isBlank()) {
            nuevo.setTelefonoDecrypted(telefono.trim());
        }

        return ocultarHash(usuarioRepository.save(nuevo));
    }

    @Override
    @Transactional
    public Usuario actualizarUsuario(Long usuarioId, String tenantIdContext, boolean isSuperAdmin, String nombreCompleto, String email, String password, String rol, String estado) {
        Usuario existente = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado."));

        if (!isSuperAdmin && !tenantIdContext.equals(existente.getTenantId())) {
            throw new TenantIsolationException("Acceso denegado: no puede modificar usuarios de otro Tenant.");
        }

        if (nombreCompleto != null && !nombreCompleto.isBlank()) {
            existente.setNombreCompleto(nombreCompleto.trim());
        }
        if (email != null && !email.isBlank()) {
            existente.setEmail(email.trim().toLowerCase());
        }
        if (password != null && !password.isBlank()) {
            existente.setPasswordHash(cryptoService.hashPassword(password));
        }
        if (rol != null && !rol.isBlank()) {
            if (!isSuperAdmin && "SUPER_ADMIN".equalsIgnoreCase(rol)) {
                throw new TenantIsolationException("Un administrador de Tenant no puede otorgar privilegios de Super Administrador.");
            }
            existente.setRol(rol);
        }
        if (estado != null && !estado.isBlank()) {
            existente.setEstado(estado);
        }

        return ocultarHash(usuarioRepository.save(existente));
    }

    @Override
    @Transactional
    public boolean eliminarUsuario(Long usuarioId, String tenantIdContext, boolean isSuperAdmin) {
        Usuario existente = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado."));

        if (superAdminPolicy.esSuperAdmin(existente.getEmail())) {
            throw new IllegalArgumentException("No se puede eliminar una cuenta principal de Super Administrador.");
        }

        if (!isSuperAdmin && !tenantIdContext.equals(existente.getTenantId())) {
            throw new TenantIsolationException("Acceso denegado: aislamiento Multi-Tenant impide eliminar usuarios de otra entidad.");
        }

        return usuarioRepository.deleteById(usuarioId);
    }

    private Usuario ocultarHash(Usuario u) {
        u.setPasswordHash(null);
        return u;
    }
}
