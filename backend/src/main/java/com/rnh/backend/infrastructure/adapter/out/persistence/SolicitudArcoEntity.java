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
@Table(name = "solicitudes_arco")
public class SolicitudArcoEntity extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    public Long id;

    @Column(name = "usuario_id", nullable = false)
    public Long usuarioId;

    @Column(name = "tenant_id", length = 36, nullable = false)
    public String tenantId;

    @Column(name = "tipo_derecho", length = 40, nullable = false)
    public String tipoDerecho;

    @Column(name = "fundamento", columnDefinition = "TEXT", nullable = false)
    public String fundamento;

    @Column(name = "estado", length = 30, nullable = false)
    public String estado = "EN_REVISION_DPO";

    @Column(name = "respuesta_dpo", columnDefinition = "TEXT")
    public String respuestaDpo;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
