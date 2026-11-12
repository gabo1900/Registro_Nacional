package com.rnh.backend.infrastructure.adapter.out.persistence;

import com.rnh.backend.domain.model.AccesoLog;
import com.rnh.backend.domain.model.ProhibicionIngreso;
import com.rnh.backend.domain.port.out.ProhibicionRepositoryPort;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.util.List;

@ApplicationScoped
public class ProhibicionPersistenceAdapter implements ProhibicionRepositoryPort {

    @Override
    public List<ProhibicionIngreso> findActivasByDocumentoHash(String documentoHash, String tenantId) {
        List<ProhibicionIngresoEntity> list = ProhibicionIngresoEntity.list(
                "documentoHash = ?1 and activa = true and (alcance = 'NACIONAL' or tenantId = ?2)",
                documentoHash, tenantId != null ? tenantId : ""
        );
        return list.stream().map(this::toDomain).toList();
    }

    @Override
    public List<ProhibicionIngreso> findAllByTenantOrNacional(String tenantId) {
        List<ProhibicionIngresoEntity> list = ProhibicionIngresoEntity.list(
                "tenantId = ?1 or alcance = 'NACIONAL'",
                Sort.by("id").descending(),
                tenantId
        );
        return list.stream().map(this::toDomain).toList();
    }

    @Override
    public List<ProhibicionIngreso> findAll() {
        List<ProhibicionIngresoEntity> list = ProhibicionIngresoEntity.listAll(Sort.by("id").descending());
        return list.stream().map(this::toDomain).toList();
    }

    @Override
    @Transactional
    public ProhibicionIngreso save(ProhibicionIngreso p) {
        ProhibicionIngresoEntity entity = new ProhibicionIngresoEntity();
        entity.tenantId = p.getTenantId();
        entity.hinchaId = p.getHinchaId();
        entity.documentoHash = p.getDocumentoHash();
        entity.documentoMasked = p.getDocumentoMasked();
        entity.nombreReferencia = p.getNombreReferencia();
        entity.codigoCausal = p.getCodigoCausal();
        entity.motivo = p.getMotivo();
        entity.alcance = p.getAlcance() != null ? p.getAlcance() : "NACIONAL";
        entity.activa = true;
        entity.creadoPorUsuarioId = p.getCreadoPorUsuarioId();
        entity.persistAndFlush();
        return toDomain(entity);
    }

    @Override
    @Transactional
    public boolean desactivar(Long id, String tenantId, boolean isSuperAdmin) {
        ProhibicionIngresoEntity entity = ProhibicionIngresoEntity.findById(id);
        if (entity == null) return false;
        if (!isSuperAdmin && !entity.tenantId.equals(tenantId)) {
            return false;
        }
        entity.activa = false;
        entity.persistAndFlush();
        return true;
    }

    @Override
    @Transactional
    public AccesoLog saveAccesoLog(AccesoLog log) {
        AccesoLogEntity entity = new AccesoLogEntity();
        entity.tenantId = log.getTenantId();
        entity.hinchaId = log.getHinchaId();
        entity.operadorUsuarioId = log.getOperadorUsuarioId();
        entity.tipoOperacion = log.getTipoOperacion();
        entity.puertaAcceso = log.getPuertaAcceso();
        entity.similarityScore = log.getSimilarityScore();
        entity.livenessVerified = log.isLivenessVerified();
        entity.resultado = log.getResultado();
        entity.detalleMensaje = log.getDetalleMensaje();
        entity.persistAndFlush();
        return toDomainLog(entity);
    }

    @Override
    public List<AccesoLog> findLogsByTenantId(String tenantId, int limit) {
        List<AccesoLogEntity> list = AccesoLogEntity.find("tenantId", Sort.by("id").descending(), tenantId)
                .page(0, Math.max(10, limit))
                .list();
        return list.stream().map(this::toDomainLog).toList();
    }

    @Override
    public List<AccesoLog> findLogsByHinchaId(Long hinchaId) {
        List<AccesoLogEntity> list = AccesoLogEntity.list("hinchaId", Sort.by("id").descending(), hinchaId);
        return list.stream().map(this::toDomainLog).toList();
    }

    @Override
    public List<AccesoLog> findAllLogs(int limit) {
        List<AccesoLogEntity> list = AccesoLogEntity.findAll(Sort.by("id").descending())
                .page(0, Math.max(10, limit))
                .list();
        return list.stream().map(this::toDomainLog).toList();
    }

    private ProhibicionIngreso toDomain(ProhibicionIngresoEntity e) {
        ProhibicionIngreso p = new ProhibicionIngreso();
        p.setId(e.id);
        p.setTenantId(e.tenantId);
        TenantEntity t = TenantEntity.findById(e.tenantId);
        if (t != null) p.setTenantNombre(t.nombre);
        p.setHinchaId(e.hinchaId);
        p.setDocumentoHash(e.documentoHash);
        p.setDocumentoMasked(e.documentoMasked);
        p.setNombreReferencia(e.nombreReferencia);
        p.setCodigoCausal(e.codigoCausal);
        p.setMotivo(e.motivo);
        p.setAlcance(e.alcance);
        p.setFechaInicio(e.fechaInicio);
        p.setFechaFin(e.fechaFin);
        p.setActiva(e.activa);
        p.setCreadoPorUsuarioId(e.creadoPorUsuarioId);
        p.setCreatedAt(e.createdAt);
        return p;
    }

    private AccesoLog toDomainLog(AccesoLogEntity e) {
        AccesoLog l = new AccesoLog();
        l.setId(e.id);
        l.setTenantId(e.tenantId);
        TenantEntity t = TenantEntity.findById(e.tenantId);
        if (t != null) l.setTenantNombre(t.nombre);
        l.setHinchaId(e.hinchaId);
        if (e.hinchaId != null) {
            HinchaEntity h = HinchaEntity.findById(e.hinchaId);
            if (h != null) l.setHinchaNombre(h.nombres + " " + h.apellidos);
        }
        l.setOperadorUsuarioId(e.operadorUsuarioId);
        l.setTipoOperacion(e.tipoOperacion);
        l.setPuertaAcceso(e.puertaAcceso);
        l.setSimilarityScore(e.similarityScore);
        l.setLivenessVerified(e.livenessVerified);
        l.setResultado(e.resultado);
        l.setDetalleMensaje(e.detalleMensaje);
        l.setFechaEvento(e.fechaEvento);
        return l;
    }
}
