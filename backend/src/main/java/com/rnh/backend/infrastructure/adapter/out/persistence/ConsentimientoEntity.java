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
@Table(name = "consentimientos_legales")
public class ConsentimientoEntity extends PanacheEntityBase {

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

    @Column(name = "acepta_terminos_generales", nullable = false)
    public boolean aceptaTerminosGenerales;

    @Column(name = "acepta_tratamiento_biometrico", nullable = false)
    public boolean aceptaTratamientoBiometrico;

    @Column(name = "acepta_transferencia_procesamiento", nullable = false)
    public boolean aceptaTransferenciaProcesamiento = true;

    @Column(name = "version_terminos", length = 40, nullable = false)
    public String versionTerminos = "ANFP-RNH-2026-v1.0";

    @Column(name = "ip_origen", length = 64)
    public String ipOrigen;

    @Column(name = "hash_documento_legal", length = 128, nullable = false)
    public String hashDocumentoLegal;

    @Column(name = "fecha_aceptacion", nullable = false)
    public LocalDateTime fechaAceptacion;

    @PrePersist
    public void onCreate() {
        if (this.fechaAceptacion == null) {
            this.fechaAceptacion = LocalDateTime.now();
        }
    }
}
