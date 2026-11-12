package com.rnh.backend.domain.model;

import java.time.LocalDateTime;

public class AccesoLog {
    private Long id;
    private String tenantId;
    private String tenantNombre;
    private Long hinchaId;
    private String hinchaNombre;
    private Long operadorUsuarioId;
    private String tipoOperacion;
    private String puertaAcceso;
    private double similarityScore;
    private boolean livenessVerified;
    private String resultado;
    private String detalleMensaje;
    private LocalDateTime fechaEvento;

    public AccesoLog() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    public String getTenantNombre() { return tenantNombre; }
    public void setTenantNombre(String tenantNombre) { this.tenantNombre = tenantNombre; }
    public Long getHinchaId() { return hinchaId; }
    public void setHinchaId(Long hinchaId) { this.hinchaId = hinchaId; }
    public String getHinchaNombre() { return hinchaNombre; }
    public void setHinchaNombre(String hinchaNombre) { this.hinchaNombre = hinchaNombre; }
    public Long getOperadorUsuarioId() { return operadorUsuarioId; }
    public void setOperadorUsuarioId(Long operadorUsuarioId) { this.operadorUsuarioId = operadorUsuarioId; }
    public String getTipoOperacion() { return tipoOperacion; }
    public void setTipoOperacion(String tipoOperacion) { this.tipoOperacion = tipoOperacion; }
    public String getPuertaAcceso() { return puertaAcceso; }
    public void setPuertaAcceso(String puertaAcceso) { this.puertaAcceso = puertaAcceso; }
    public double getSimilarityScore() { return similarityScore; }
    public void setSimilarityScore(double similarityScore) { this.similarityScore = similarityScore; }
    public boolean isLivenessVerified() { return livenessVerified; }
    public void setLivenessVerified(boolean livenessVerified) { this.livenessVerified = livenessVerified; }
    public String getResultado() { return resultado; }
    public void setResultado(String resultado) { this.resultado = resultado; }
    public String getDetalleMensaje() { return detalleMensaje; }
    public void setDetalleMensaje(String detalleMensaje) { this.detalleMensaje = detalleMensaje; }
    public LocalDateTime getFechaEvento() { return fechaEvento; }
    public void setFechaEvento(LocalDateTime fechaEvento) { this.fechaEvento = fechaEvento; }
}
