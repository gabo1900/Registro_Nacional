package com.rnh.backend.domain.model;

import java.time.LocalDateTime;

public class Tenant {
    private String id;
    private String codigo;
    private String nombre;
    private String rutEmpresa;
    private String tipoEntidad;
    private String estado;
    private int maxUsuarios;
    private int usuariosActuales;
    private double storageUsadoMb;
    private String modulosActivos;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Tenant() {}

    public Tenant(String id, String codigo, String nombre, String rutEmpresa, String tipoEntidad,
                  String estado, int maxUsuarios, int usuariosActuales, double storageUsadoMb,
                  String modulosActivos, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.codigo = codigo;
        this.nombre = nombre;
        this.rutEmpresa = rutEmpresa;
        this.tipoEntidad = tipoEntidad;
        this.estado = estado;
        this.maxUsuarios = maxUsuarios;
        this.usuariosActuales = usuariosActuales;
        this.storageUsadoMb = storageUsadoMb;
        this.modulosActivos = modulosActivos;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getRutEmpresa() { return rutEmpresa; }
    public void setRutEmpresa(String rutEmpresa) { this.rutEmpresa = rutEmpresa; }
    public String getTipoEntidad() { return tipoEntidad; }
    public void setTipoEntidad(String tipoEntidad) { this.tipoEntidad = tipoEntidad; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public int getMaxUsuarios() { return maxUsuarios; }
    public void setMaxUsuarios(int maxUsuarios) { this.maxUsuarios = maxUsuarios; }
    public int getUsuariosActuales() { return usuariosActuales; }
    public void setUsuariosActuales(int usuariosActuales) { this.usuariosActuales = usuariosActuales; }
    public double getStorageUsadoMb() { return storageUsadoMb; }
    public void setStorageUsadoMb(double storageUsadoMb) { this.storageUsadoMb = storageUsadoMb; }
    public String getModulosActivos() { return modulosActivos; }
    public void setModulosActivos(String modulosActivos) { this.modulosActivos = modulosActivos; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
