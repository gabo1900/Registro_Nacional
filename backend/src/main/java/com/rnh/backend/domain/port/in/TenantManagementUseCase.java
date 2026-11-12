package com.rnh.backend.domain.port.in;

import com.rnh.backend.domain.model.Tenant;
import com.rnh.backend.domain.model.Usuario;

import java.util.List;

public interface TenantManagementUseCase {

    List<Tenant> listarTenants();

    Tenant crearTenant(Tenant tenant, String adminEmail, String adminNombre, String adminPassword);

    Tenant actualizarTenant(String id, Tenant tenant);

    boolean eliminarTenant(String id);

    List<Usuario> listarUsuariosGlobal(String filtroTenantId);

    List<Usuario> listarUsuariosPorTenant(String tenantId);

    Usuario crearUsuarioEnTenant(String tenantId, String nombreCompleto, String email, String password, String rol, String rut, String telefono);

    Usuario actualizarUsuario(Long usuarioId, String tenantIdContext, boolean isSuperAdmin, String nombreCompleto, String email, String password, String rol, String estado);

    boolean eliminarUsuario(Long usuarioId, String tenantIdContext, boolean isSuperAdmin);
}
