package com.rnh.backend.domain.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class Hincha {
    private Long id;
    private Long usuarioId;
    private String tenantId;
    private String tipoDocumento;
    private String documentoHash;
    private String documentoDecrypted;
    private String nombres;
    private String apellidos;
    private LocalDate fechaNacimiento;
    private String nacionalidad;
    private String biometricTokenRef;
    private boolean livenessPassed;
    private double livenessScore;
    private boolean huellaRegistrada;
    private String estadoEnrolamiento;
    private boolean tieneProhibicionActiva;
    private LocalDateTime createdAt;

    public Hincha() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    public String getTipoDocumento() { return tipoDocumento; }
    public void setTipoDocumento(String tipoDocumento) { this.tipoDocumento = tipoDocumento; }
    public String getDocumentoHash() { return documentoHash; }
    public void setDocumentoHash(String documentoHash) { this.documentoHash = documentoHash; }
    public String getDocumentoDecrypted() { return documentoDecrypted; }
    public void setDocumentoDecrypted(String documentoDecrypted) { this.documentoDecrypted = documentoDecrypted; }
    public String getNombres() { return nombres; }
    public void setNombres(String nombres) { this.nombres = nombres; }
    public String getApellidos() { return apellidos; }
    public void setApellidos(String apellidos) { this.apellidos = apellidos; }
    public LocalDate getFechaNacimiento() { return fechaNacimiento; }
    public void setFechaNacimiento(LocalDate fechaNacimiento) { this.fechaNacimiento = fechaNacimiento; }
    public String getNacionalidad() { return nacionalidad; }
    public void setNacionalidad(String nacionalidad) { this.nacionalidad = nacionalidad; }
    public String getBiometricTokenRef() { return biometricTokenRef; }
    public void setBiometricTokenRef(String biometricTokenRef) { this.biometricTokenRef = biometricTokenRef; }
    public boolean isLivenessPassed() { return livenessPassed; }
    public void setLivenessPassed(boolean livenessPassed) { this.livenessPassed = livenessPassed; }
    public double getLivenessScore() { return livenessScore; }
    public void setLivenessScore(double livenessScore) { this.livenessScore = livenessScore; }
    public boolean isHuellaRegistrada() { return huellaRegistrada; }
    public void setHuellaRegistrada(boolean huellaRegistrada) { this.huellaRegistrada = huellaRegistrada; }
    public String getEstadoEnrolamiento() { return estadoEnrolamiento; }
    public void setEstadoEnrolamiento(String estadoEnrolamiento) { this.estadoEnrolamiento = estadoEnrolamiento; }
    public boolean isTieneProhibicionActiva() { return tieneProhibicionActiva; }
    public void setTieneProhibicionActiva(boolean tieneProhibicionActiva) { this.tieneProhibicionActiva = tieneProhibicionActiva; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
