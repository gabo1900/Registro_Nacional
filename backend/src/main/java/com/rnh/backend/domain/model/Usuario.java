package com.rnh.backend.domain.model;

import java.time.LocalDateTime;

public class Usuario {
    private Long id;
    private String uuid;
    private String tenantId;
    private String tenantNombre;
    private String tenantCodigo;
    private String nombreCompleto;
    private String email;
    private String passwordHash;
    private String rol; // SUPER_ADMIN, ADMIN_TENANT, OPERADOR_ACCESO, USUARIO
    private String estado; // ACTIVE, INACTIVE, SUSPENDED
    private String googleSub;
    private String avatarUrl;
    private String rutHash;
    private String rutDecrypted;
    private String telefonoDecrypted;
    private LocalDateTime ultimoAcceso;
    private LocalDateTime createdAt;

    public Usuario() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUuid() { return uuid; }
    public void setUuid(String uuid) { this.uuid = uuid; }
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    public String getTenantNombre() { return tenantNombre; }
    public void setTenantNombre(String tenantNombre) { this.tenantNombre = tenantNombre; }
    public String getTenantCodigo() { return tenantCodigo; }
    public void setTenantCodigo(String tenantCodigo) { this.tenantCodigo = tenantCodigo; }
    public String getNombreCompleto() { return nombreCompleto; }
    public void setNombreCompleto(String nombreCompleto) { this.nombreCompleto = nombreCompleto; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public String getGoogleSub() { return googleSub; }
    public void setGoogleSub(String googleSub) { this.googleSub = googleSub; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public String getRutHash() { return rutHash; }
    public void setRutHash(String rutHash) { this.rutHash = rutHash; }
    public String getRutDecrypted() { return rutDecrypted; }
    public void setRutDecrypted(String rutDecrypted) { this.rutDecrypted = rutDecrypted; }
    public String getTelefonoDecrypted() { return telefonoDecrypted; }
    public void setTelefonoDecrypted(String telefonoDecrypted) { this.telefonoDecrypted = telefonoDecrypted; }
    public LocalDateTime getUltimoAcceso() { return ultimoAcceso; }
    public void setUltimoAcceso(LocalDateTime ultimoAcceso) { this.ultimoAcceso = ultimoAcceso; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
