package com.rnh.backend.domain.model;

import java.time.LocalDateTime;

public class HuellaBiometrica {
    private Long id;
    private Long hinchaId;
    private Long usuarioId;
    private String tenantId;
    private String credentialId;
    private String publicKeyEncrypted;
    private String huellaHash;
    private String dispositivoTipo;
    private String dedoIndice;
    private long signCount;
    private boolean activo;
    private LocalDateTime createdAt;

    public HuellaBiometrica() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getHinchaId() { return hinchaId; }
    public void setHinchaId(Long hinchaId) { this.hinchaId = hinchaId; }
    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    public String getCredentialId() { return credentialId; }
    public void setCredentialId(String credentialId) { this.credentialId = credentialId; }
    public String getPublicKeyEncrypted() { return publicKeyEncrypted; }
    public void setPublicKeyEncrypted(String publicKeyEncrypted) { this.publicKeyEncrypted = publicKeyEncrypted; }
    public String getHuellaHash() { return huellaHash; }
    public void setHuellaHash(String huellaHash) { this.huellaHash = huellaHash; }
    public String getDispositivoTipo() { return dispositivoTipo; }
    public void setDispositivoTipo(String dispositivoTipo) { this.dispositivoTipo = dispositivoTipo; }
    public String getDedoIndice() { return dedoIndice; }
    public void setDedoIndice(String dedoIndice) { this.dedoIndice = dedoIndice; }
    public long getSignCount() { return signCount; }
    public void setSignCount(long signCount) { this.signCount = signCount; }
    public boolean isActivo() { return activo; }
    public void setActivo(boolean activo) { this.activo = activo; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
