package com.rnh.backend.infrastructure.adapter.out.persistence;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "tenants")
public class TenantEntity extends PanacheEntityBase {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    public String id;

    @Column(name = "codigo", length = 50, nullable = false, unique = true)
    public String codigo;

    @Column(name = "nombre", length = 150, nullable = false)
    public String nombre;

    @Column(name = "rut_empresa", length = 30)
    public String rutEmpresa;

    @Column(name = "tipo_entidad", length = 50, nullable = false)
    public String tipoEntidad = "ESTADIO_MUNICIPAL";

    @Column(name = "estado", length = 20, nullable = false)
    public String estado = "ACTIVE";

    @Column(name = "max_usuarios", nullable = false)
    public int maxUsuarios = 10;

    @Column(name = "storage_usado_mb", nullable = false)
    public double storageUsadoMb = 0.00;

    @Column(name = "modulos_activos", columnDefinition = "TEXT", nullable = false)
    public String modulosActivos = "BIOMETRIA_FACIAL,HUELLA_DIGITAL,DERECHO_ADMISION,TICKETERA,AUDITORIA";

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    public LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (this.createdAt == null) this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
