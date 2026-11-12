package com.rnh.backend.infrastructure.adapter.out.persistence;

import com.rnh.backend.domain.model.Usuario;
import com.rnh.backend.domain.port.out.UsuarioRepositoryPort;
import com.rnh.backend.infrastructure.security.CryptoService;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class UsuarioPersistenceAdapter implements UsuarioRepositoryPort {

    @Inject
    CryptoService cryptoService;

    @Override
    public List<Usuario> findAll() {
        List<UsuarioEntity> list = UsuarioEntity.listAll(Sort.by("id"));
        return list.stream().map(this::toDomain).toList();
    }

    @Override
    public List<Usuario> findByTenantId(String tenantId) {
        List<UsuarioEntity> list = UsuarioEntity.list("tenantId", Sort.by("id"), tenantId);
        return list.stream().map(this::toDomain).toList();
    }

    @Override
    public Optional<Usuario> findById(Long id) {
        if (id == null) return Optional.empty();
        UsuarioEntity entity = UsuarioEntity.findById(id);
        return Optional.ofNullable(entity).map(this::toDomain);
    }

    @Override
    public Optional<Usuario> findByEmailAndTenant(String email, String tenantId) {
        if (email == null) return Optional.empty();
        UsuarioEntity entity;
        if (tenantId == null || tenantId.isBlank()) {
            entity = UsuarioEntity.find("LOWER(email) = LOWER(?1)", email.trim()).firstResult();
        } else {
            entity = UsuarioEntity.find("LOWER(email) = LOWER(?1) AND tenantId = ?2", email.trim(), tenantId).firstResult();
        }
        return Optional.ofNullable(entity).map(this::toDomain);
    }

    @Override
    public List<Usuario> findByEmail(String email) {
        if (email == null) return List.of();
        List<UsuarioEntity> list = UsuarioEntity.list("LOWER(email) = LOWER(?1)", email.trim());
        return list.stream().map(this::toDomain).toList();
    }

    @Override
    public Optional<Usuario> findByRutHashAndTenant(String rutHash, String tenantId) {
        if (rutHash == null) return Optional.empty();
        UsuarioEntity entity;
        if (tenantId == null || tenantId.isBlank()) {
            entity = UsuarioEntity.find("rutHash = ?1", rutHash).firstResult();
        } else {
            entity = UsuarioEntity.find("rutHash = ?1 AND tenantId = ?2", rutHash, tenantId).firstResult();
        }
        return Optional.ofNullable(entity).map(this::toDomain);
    }

    @Override
    public long countByTenantId(String tenantId) {
        return UsuarioEntity.count("tenantId", tenantId);
    }

    @Override
    @Transactional
    public Usuario save(Usuario domain) {
        UsuarioEntity entity = domain.getId() != null ? UsuarioEntity.findById(domain.getId()) : null;
        if (entity == null) {
            entity = new UsuarioEntity();
            entity.uuid = domain.getUuid() != null ? domain.getUuid() : UUID.randomUUID().toString();
        }
        entity.tenantId = domain.getTenantId();
        entity.nombreCompleto = domain.getNombreCompleto();
        entity.email = domain.getEmail().trim().toLowerCase();
        if (domain.getPasswordHash() != null && !domain.getPasswordHash().isBlank()) {
            entity.passwordHash = domain.getPasswordHash();
        }
        entity.rol = domain.getRol() != null ? domain.getRol() : "USUARIO";
        entity.estado = domain.getEstado() != null ? domain.getEstado() : "ACTIVE";
        entity.googleSub = domain.getGoogleSub();
        entity.avatarUrl = domain.getAvatarUrl();
        entity.rutHash = domain.getRutHash();
        if (domain.getRutDecrypted() != null && !domain.getRutDecrypted().isBlank()) {
            entity.rutEncrypted = cryptoService.encryptAesGcm(domain.getRutDecrypted());
        }
        if (domain.getTelefonoDecrypted() != null && !domain.getTelefonoDecrypted().isBlank()) {
            entity.telefonoEncrypted = cryptoService.encryptAesGcm(domain.getTelefonoDecrypted());
        }
        if (domain.getUltimoAcceso() != null) {
            entity.ultimoAcceso = domain.getUltimoAcceso();
        }
        entity.persistAndFlush();
        return toDomain(entity);
    }

    @Override
    @Transactional
    public boolean deleteById(Long id) {
        HinchaEntity.delete("usuarioId", id);
        HuellaBiometricaEntity.delete("usuarioId", id);
        ConsentimientoEntity.delete("usuarioId", id);
        SolicitudArcoEntity.delete("usuarioId", id);
        return UsuarioEntity.deleteById(id);
    }

    private Usuario toDomain(UsuarioEntity e) {
        Usuario u = new Usuario();
        u.setId(e.id);
        u.setUuid(e.uuid);
        u.setTenantId(e.tenantId);
        if (e.tenantId != null) {
            TenantEntity t = TenantEntity.findById(e.tenantId);
            if (t != null) {
                u.setTenantNombre(t.nombre);
                u.setTenantCodigo(t.codigo);
            }
        } else {
            u.setTenantNombre("Global (ANFP SuperAdmin)");
            u.setTenantCodigo("global");
        }
        u.setNombreCompleto(e.nombreCompleto);
        u.setEmail(e.email);
        u.setPasswordHash(e.passwordHash);
        u.setRol(e.rol);
        u.setEstado(e.estado);
        u.setGoogleSub(e.googleSub);
        u.setAvatarUrl(e.avatarUrl);
        u.setRutHash(e.rutHash);
        u.setRutDecrypted(cryptoService.decryptAesGcm(e.rutEncrypted));
        u.setTelefonoDecrypted(cryptoService.decryptAesGcm(e.telefonoEncrypted));
        u.setUltimoAcceso(e.ultimoAcceso);
        u.setCreatedAt(e.createdAt);
        return u;
    }
}
