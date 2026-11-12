package com.rnh.backend.infrastructure.adapter.out.persistence;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "prohibiciones_ingreso")
public class ProhibicionIngresoEntity extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    public Long id;

    @Column(name = "tenant_id", length = 36, nullable = false)
    public String tenantId;

    @Column(name = "hincha_id")
    public Long hinchaId;

    @Column(name = "documento_hash", length = 128, nullable = false)
    public String documentoHash;

    @Column(name = "documento_masked", length = 30)
    public String documentoMasked;

    @Column(name = "nombre_referencia", length = 150)
    public String nombreReferencia;

    @Column(name = "codigo_causal", length = 50, nullable = false)
    public String codigoCausal;

    @Column(name = "motivo", columnDefinition = "TEXT", nullable = false)
    public String motivo;

    @Column(name = "alcance", length = 30, nullable = false)
    public String alcance = "NACIONAL";

    @Column(name = "fecha_inicio", nullable = false)
    public LocalDateTime fechaInicio;

    @Column(name = "fecha_fin")
    public LocalDateTime fechaFin;

    @Column(name = "activa", nullable = false)
    public boolean activa = true;

    @Column(name = "creado_por_usuario_id")
    public Long creadoPorUsuarioId;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (this.fechaInicio == null) this.fechaInicio = now;
        if (this.createdAt == null) this.createdAt = now;
    }
}
