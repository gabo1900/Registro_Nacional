package com.rnh.backend.domain.port.out;

import com.rnh.backend.domain.model.Usuario;
import java.util.List;
import java.util.Optional;

public interface UsuarioRepositoryPort {
    List<Usuario> findAll();
    List<Usuario> findByTenantId(String tenantId);
    Optional<Usuario> findById(Long id);
    Optional<Usuario> findByEmailAndTenant(String email, String tenantId);
    List<Usuario> findByEmail(String email);
    Optional<Usuario> findByRutHashAndTenant(String rutHash, String tenantId);
    long countByTenantId(String tenantId);
    Usuario save(Usuario usuario);
    boolean deleteById(Long id);
}
