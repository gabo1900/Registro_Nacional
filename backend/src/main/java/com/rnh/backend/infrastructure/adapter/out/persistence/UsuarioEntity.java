package com.rnh.backend.infrastructure.adapter.out.persistence;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "usuarios")
public class UsuarioEntity extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    public Long id;

    @Column(name = "uuid", length = 36, nullable = false, unique = true)
    public String uuid;

    @Column(name = "tenant_id", length = 36)
    public String tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", referencedColumnName = "id", insertable = false, updatable = false)
    public TenantEntity tenant;

    @Column(name = "nombre_completo", length = 150, nullable = false)
    public String nombreCompleto;

    @Column(name = "email", length = 150, nullable = false)
    public String email;

    @Column(name = "password_hash", length = 255, nullable = false)
    public String passwordHash;

    @Column(name = "rol", length = 30, nullable = false)
    public String rol = "USUARIO";

    @Column(name = "estado", length = 20, nullable = false)
    public String estado = "ACTIVE";

    @Column(name = "google_sub", length = 150)
    public String googleSub;

    @Column(name = "avatar_url", columnDefinition = "TEXT")
    public String avatarUrl;

    @Column(name = "rut_hash", length = 128)
    public String rutHash;

    @Column(name = "rut_encrypted", columnDefinition = "TEXT")
    public String rutEncrypted;

    @Column(name = "telefono_encrypted", columnDefinition = "TEXT")
    public String telefonoEncrypted;

    @Column(name = "ultimo_acceso")
    public LocalDateTime ultimoAcceso;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    public LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (this.uuid == null) this.uuid = UUID.randomUUID().toString();
        if (this.createdAt == null) this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
