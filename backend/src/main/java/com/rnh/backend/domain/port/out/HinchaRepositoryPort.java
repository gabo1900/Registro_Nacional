package com.rnh.backend.domain.port.out;

import com.rnh.backend.domain.model.Consentimiento;
import com.rnh.backend.domain.model.Hincha;
import com.rnh.backend.domain.model.HuellaBiometrica;
import com.rnh.backend.domain.model.SolicitudArco;

import java.util.List;
import java.util.Optional;

public interface HinchaRepositoryPort {
    Optional<Hincha> findByUsuarioId(Long usuarioId);
    Optional<Hincha> findByDocumentoHash(String documentoHash);
    Optional<Hincha> findById(Long id);
    List<Hincha> findByTenantId(String tenantId);
    Hincha save(Hincha hincha, String vectorCifrado);
    Optional<String> findVectorCifradoByHinchaId(Long hinchaId);

    Consentimiento saveConsentimiento(Consentimiento consentimiento);
    Optional<Consentimiento> findLatestConsentimientoByUsuarioId(Long usuarioId);

    HuellaBiometrica saveHuella(HuellaBiometrica huella);
    List<HuellaBiometrica> findHuellasByUsuarioId(Long usuarioId);
    Optional<HuellaBiometrica> findHuellaByCredentialId(String credentialId);
    boolean deleteHuellaById(Long huellaId, Long usuarioId, String tenantId, boolean isSuperAdmin);

    SolicitudArco saveSolicitudArco(SolicitudArco solicitud);
    List<SolicitudArco> findSolicitudesArcoByUsuarioId(Long usuarioId);
    List<SolicitudArco> findSolicitudesArcoByTenantId(String tenantId);
}
