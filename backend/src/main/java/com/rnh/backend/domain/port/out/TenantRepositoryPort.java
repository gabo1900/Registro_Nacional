package com.rnh.backend.domain.port.out;

import com.rnh.backend.domain.model.Tenant;
import java.util.List;
import java.util.Optional;

public interface TenantRepositoryPort {
    List<Tenant> findAll();
    Optional<Tenant> findById(String id);
    Optional<Tenant> findByCodigo(String codigo);
    Tenant save(Tenant tenant);
    boolean deleteById(String id);
}
