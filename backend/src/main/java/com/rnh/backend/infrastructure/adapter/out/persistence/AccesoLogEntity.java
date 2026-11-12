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
@Table(name = "accesos_log")
public class AccesoLogEntity extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    public Long id;

    @Column(name = "tenant_id", length = 36, nullable = false)
    public String tenantId;

    @Column(name = "hincha_id")
    public Long hinchaId;

    @Column(name = "operador_usuario_id")
    public Long operadorUsuarioId;

    @Column(name = "tipo_operacion", length = 40, nullable = false)
    public String tipoOperacion;

    @Column(name = "puerta_acceso", length = 80)
    public String puertaAcceso;

    @Column(name = "similarity_score")
    public double similarityScore = 0.0;

    @Column(name = "liveness_verified")
    public boolean livenessVerified = true;

    @Column(name = "resultado", length = 30, nullable = false)
    public String resultado;

    @Column(name = "detalle_mensaje", columnDefinition = "TEXT")
    public String detalleMensaje;

    @Column(name = "fecha_evento", nullable = false)
    public LocalDateTime fechaEvento;

    @PrePersist
    public void onCreate() {
        if (this.fechaEvento == null) {
            this.fechaEvento = LocalDateTime.now();
        }
    }
}
