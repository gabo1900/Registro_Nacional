package com.rnh.backend.domain.model;

import java.time.LocalDateTime;

public class ProhibicionIngreso {
    private Long id;
    private String tenantId;
    private String tenantNombre;
    private Long hinchaId;
    private String documentoHash;
    private String documentoMasked;
    private String nombreReferencia;
    private String codigoCausal;
    private String motivo;
    private String alcance; // NACIONAL, SOLO_TENANT
    private LocalDateTime fechaInicio;
    private LocalDateTime fechaFin;
    private boolean activa;
    private Long creadoPorUsuarioId;
    private LocalDateTime createdAt;

    public ProhibicionIngreso() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    public String getTenantNombre() { return tenantNombre; }
    public void setTenantNombre(String tenantNombre) { this.tenantNombre = tenantNombre; }
    public Long getHinchaId() { return hinchaId; }
    public void setHinchaId(Long hinchaId) { this.hinchaId = hinchaId; }
    public String getDocumentoHash() { return documentoHash; }
    public void setDocumentoHash(String documentoHash) { this.documentoHash = documentoHash; }
    public String getDocumentoMasked() { return documentoMasked; }
    public void setDocumentoMasked(String documentoMasked) { this.documentoMasked = documentoMasked; }
    public String getNombreReferencia() { return nombreReferencia; }
    public void setNombreReferencia(String nombreReferencia) { this.nombreReferencia = nombreReferencia; }
    public String getCodigoCausal() { return codigoCausal; }
    public void setCodigoCausal(String codigoCausal) { this.codigoCausal = codigoCausal; }
    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }
    public String getAlcance() { return alcance; }
    public void setAlcance(String alcance) { this.alcance = alcance; }
    public LocalDateTime getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(LocalDateTime fechaInicio) { this.fechaInicio = fechaInicio; }
    public LocalDateTime getFechaFin() { return fechaFin; }
    public void setFechaFin(LocalDateTime fechaFin) { this.fechaFin = fechaFin; }
    public boolean isActiva() { return activa; }
    public void setActiva(boolean activa) { this.activa = activa; }
    public Long getCreadoPorUsuarioId() { return creadoPorUsuarioId; }
    public void setCreadoPorUsuarioId(Long creadoPorUsuarioId) { this.creadoPorUsuarioId = creadoPorUsuarioId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
