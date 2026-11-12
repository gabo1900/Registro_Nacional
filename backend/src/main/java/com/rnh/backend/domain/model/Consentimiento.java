package com.rnh.backend.domain.model;

import java.time.LocalDateTime;

public class Consentimiento {
    private Long id;
    private Long hinchaId;
    private Long usuarioId;
    private String tenantId;
    private boolean aceptaTerminosGenerales;
    private boolean aceptaTratamientoBiometrico;
    private boolean aceptaTransferenciaProcesamiento;
    private String versionTerminos;
    private String ipOrigen;
    private String hashDocumentoLegal;
    private LocalDateTime fechaAceptacion;

    public Consentimiento() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getHinchaId() { return hinchaId; }
    public void setHinchaId(Long hinchaId) { this.hinchaId = hinchaId; }
    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    public boolean isAceptaTerminosGenerales() { return aceptaTerminosGenerales; }
    public void setAceptaTerminosGenerales(boolean aceptaTerminosGenerales) { this.aceptaTerminosGenerales = aceptaTerminosGenerales; }
    public boolean isAceptaTratamientoBiometrico() { return aceptaTratamientoBiometrico; }
    public void setAceptaTratamientoBiometrico(boolean aceptaTratamientoBiometrico) { this.aceptaTratamientoBiometrico = aceptaTratamientoBiometrico; }
    public boolean isAceptaTransferenciaProcesamiento() { return aceptaTransferenciaProcesamiento; }
    public void setAceptaTransferenciaProcesamiento(boolean aceptaTransferenciaProcesamiento) { this.aceptaTransferenciaProcesamiento = aceptaTransferenciaProcesamiento; }
    public String getVersionTerminos() { return versionTerminos; }
    public void setVersionTerminos(String versionTerminos) { this.versionTerminos = versionTerminos; }
    public String getIpOrigen() { return ipOrigen; }
    public void setIpOrigen(String ipOrigen) { this.ipOrigen = ipOrigen; }
    public String getHashDocumentoLegal() { return hashDocumentoLegal; }
    public void setHashDocumentoLegal(String hashDocumentoLegal) { this.hashDocumentoLegal = hashDocumentoLegal; }
    public LocalDateTime getFechaAceptacion() { return fechaAceptacion; }
    public void setFechaAceptacion(LocalDateTime fechaAceptacion) { this.fechaAceptacion = fechaAceptacion; }
}
