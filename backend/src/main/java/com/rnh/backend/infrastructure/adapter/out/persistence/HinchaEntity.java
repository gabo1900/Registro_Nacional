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
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "hinchas")
public class HinchaEntity extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    public Long id;

    @Column(name = "usuario_id", nullable = false, unique = true)
    public Long usuarioId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", referencedColumnName = "id", insertable = false, updatable = false)
    public UsuarioEntity usuario;

    @Column(name = "tenant_id", length = 36, nullable = false)
    public String tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", referencedColumnName = "id", insertable = false, updatable = false)
    public TenantEntity tenant;

    @Column(name = "tipo_documento", length = 30, nullable = false)
    public String tipoDocumento = "CEDULA_CHILE";

    @Column(name = "documento_hash", length = 128, nullable = false)
    public String documentoHash;

    @Column(name = "documento_encrypted", columnDefinition = "TEXT", nullable = false)
    public String documentoEncrypted;

    @Column(name = "nombres", length = 100, nullable = false)
    public String nombres;

    @Column(name = "apellidos", length = 100, nullable = false)
    public String apellidos;

    @Column(name = "fecha_nacimiento")
    public LocalDate fechaNacimiento;

    @Column(name = "nacionalidad", length = 60)
    public String nacionalidad = "Chilena";

    @Column(name = "biometric_token_ref_encrypted", columnDefinition = "TEXT")
    public String biometricTokenRefEncrypted;

    @Column(name = "facial_vector_encrypted", columnDefinition = "TEXT")
    public String facialVectorEncrypted;

    @Column(name = "liveness_passed", nullable = false)
    public boolean livenessPassed = false;

    @Column(name = "liveness_score", nullable = false)
    public double livenessScore = 0.0;

    @Column(name = "huella_registrada", nullable = false)
    public boolean huellaRegistrada = false;

    @Column(name = "estado_enrolamiento", length = 30, nullable = false)
    public String estadoEnrolamiento = "COMPLETADO";

    @Column(name = "foto_documento_encrypted", columnDefinition = "TEXT")
    public String fotoDocumentoEncrypted;

    @Column(name = "foto_rostro_encrypted", columnDefinition = "TEXT")
    public String fotoRostroEncrypted;

    @Column(name = "resultado_cotejo_dni", length = 50)
    public String resultadoCotejoDni = "VERIFICADO_COTEJO_OK";

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
