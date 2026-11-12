package com.rnh.backend.infrastructure.adapter.out.persistence;

import com.rnh.backend.domain.model.Tenant;
import com.rnh.backend.domain.port.out.TenantRepositoryPort;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class TenantPersistenceAdapter implements TenantRepositoryPort {

    @Override
    public List<Tenant> findAll() {
        List<TenantEntity> entities = TenantEntity.listAll(Sort.by("createdAt"));
        return entities.stream().map(this::toDomain).toList();
    }

    @Override
    public Optional<Tenant> findById(String id) {
        if (id == null || id.isBlank()) return Optional.empty();
        TenantEntity entity = TenantEntity.findById(id);
        return Optional.ofNullable(entity).map(this::toDomain);
    }

    @Override
    public Optional<Tenant> findByCodigo(String codigo) {
        if (codigo == null || codigo.isBlank()) return Optional.empty();
        TenantEntity entity = TenantEntity.find("LOWER(codigo) = LOWER(?1)", codigo.trim()).firstResult();
        return Optional.ofNullable(entity).map(this::toDomain);
    }

    @Override
    @Transactional
    public Tenant save(Tenant domain) {
        TenantEntity entity = (domain.getId() != null && !domain.getId().isBlank())
                ? TenantEntity.findById(domain.getId())
                : null;
        if (entity == null) {
            entity = new TenantEntity();
            entity.id = (domain.getId() != null && !domain.getId().isBlank())
                    ? domain.getId()
                    : UUID.randomUUID().toString();
        }
        entity.codigo = domain.getCodigo().trim();
        entity.nombre = domain.getNombre().trim();
        entity.rutEmpresa = domain.getRutEmpresa();
        entity.tipoEntidad = domain.getTipoEntidad() != null ? domain.getTipoEntidad() : "ESTADIO_MUNICIPAL";
        entity.estado = domain.getEstado() != null ? domain.getEstado() : "ACTIVE";
        entity.maxUsuarios = domain.getMaxUsuarios() > 0 ? domain.getMaxUsuarios() : 10;
        entity.storageUsadoMb = domain.getStorageUsadoMb();
        entity.modulosActivos = domain.getModulosActivos() != null
                ? domain.getModulosActivos()
                : "BIOMETRIA_FACIAL,HUELLA_DIGITAL,DERECHO_ADMISION,TICKETERA,AUDITORIA";
        entity.persistAndFlush();
        return toDomain(entity);
    }

    @Override
    @Transactional
    public boolean deleteById(String id) {
        HinchaEntity.delete("tenantId", id);
        HuellaBiometricaEntity.delete("tenantId", id);
        ConsentimientoEntity.delete("tenantId", id);
        ProhibicionIngresoEntity.delete("tenantId", id);
        AccesoLogEntity.delete("tenantId", id);
        SolicitudArcoEntity.delete("tenantId", id);
        UsuarioEntity.delete("tenantId = ?1 and rol <> 'SUPER_ADMIN'", id);
        return TenantEntity.deleteById(id);
    }

    private Tenant toDomain(TenantEntity e) {
        long userCount = UsuarioEntity.count("tenantId", e.id);
        long hinchaCount = HinchaEntity.count("tenantId", e.id);
        double calculatedStorage = Math.round(((hinchaCount * 0.08) + (userCount * 0.01) + e.storageUsadoMb) * 100.0) / 100.0;
        return new Tenant(
                e.id,
                e.codigo,
                e.nombre,
                e.rutEmpresa,
                e.tipoEntidad,
                e.estado,
                e.maxUsuarios,
                (int) userCount,
                calculatedStorage,
                e.modulosActivos,
                e.createdAt,
                e.updatedAt
        );
    }
}
