package com.rnh.backend.domain.port.out;

import com.rnh.backend.domain.model.AccesoLog;
import com.rnh.backend.domain.model.ProhibicionIngreso;

import java.util.List;

public interface ProhibicionRepositoryPort {
    List<ProhibicionIngreso> findActivasByDocumentoHash(String documentoHash, String tenantId);
    List<ProhibicionIngreso> findAllByTenantOrNacional(String tenantId);
    List<ProhibicionIngreso> findAll();
    ProhibicionIngreso save(ProhibicionIngreso prohibicion);
    boolean desactivar(Long id, String tenantId, boolean isSuperAdmin);

    AccesoLog saveAccesoLog(AccesoLog log);
    List<AccesoLog> findLogsByTenantId(String tenantId, int limit);
    List<AccesoLog> findLogsByHinchaId(Long hinchaId);
    List<AccesoLog> findAllLogs(int limit);
}
