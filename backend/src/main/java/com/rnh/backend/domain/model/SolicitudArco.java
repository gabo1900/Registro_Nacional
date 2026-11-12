package com.rnh.backend.domain.model;

import java.time.LocalDateTime;

public class SolicitudArco {
    private Long id;
    private Long usuarioId;
    private String usuarioEmail;
    private String tenantId;
    private String tipoDerecho;
    private String fundamento;
    private String estado;
    private String respuestaDpo;
    private LocalDateTime createdAt;

    public SolicitudArco() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }
    public String getUsuarioEmail() { return usuarioEmail; }
    public void setUsuarioEmail(String usuarioEmail) { this.usuarioEmail = usuarioEmail; }
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    public String getTipoDerecho() { return tipoDerecho; }
    public void setTipoDerecho(String tipoDerecho) { this.tipoDerecho = tipoDerecho; }
    public String getFundamento() { return fundamento; }
    public void setFundamento(String fundamento) { this.fundamento = fundamento; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public String getRespuestaDpo() { return respuestaDpo; }
    public void setRespuestaDpo(String respuestaDpo) { this.respuestaDpo = respuestaDpo; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
