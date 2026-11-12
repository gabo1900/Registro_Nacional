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
@Table(name = "huellas_biometricas")
public class HuellaBiometricaEntity extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    public Long id;

    @Column(name = "hincha_id", nullable = false)
    public Long hinchaId;

    @Column(name = "usuario_id", nullable = false)
    public Long usuarioId;

    @Column(name = "tenant_id", length = 36, nullable = false)
    public String tenantId;

    @Column(name = "credential_id", length = 255, nullable = false, unique = true)
    public String credentialId;

    @Column(name = "public_key_encrypted", columnDefinition = "TEXT", nullable = false)
    public String publicKeyEncrypted;

    @Column(name = "huella_hash", length = 128, nullable = false)
    public String huellaHash;

    @Column(name = "dispositivo_tipo", length = 80, nullable = false)
    public String dispositivoTipo = "WEBAUTHN_FIDO2_SENSOR";

    @Column(name = "dedo_indice", length = 40, nullable = false)
    public String dedoIndice = "INDICE_DERECHO";

    @Column(name = "sign_count", nullable = false)
    public long signCount = 1L;

    @Column(name = "activo", nullable = false)
    public boolean activo = true;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
