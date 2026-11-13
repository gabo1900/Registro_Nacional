package com.rnh.backend.infrastructure.adapter.out.persistence;

import com.rnh.backend.domain.model.Consentimiento;
import com.rnh.backend.domain.model.Hincha;
import com.rnh.backend.domain.model.HuellaBiometrica;
import com.rnh.backend.domain.model.SolicitudArco;
import com.rnh.backend.domain.port.out.HinchaRepositoryPort;
import com.rnh.backend.infrastructure.security.CryptoService;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class HinchaPersistenceAdapter implements HinchaRepositoryPort {

    @Inject
    CryptoService cryptoService;

    @Override
    public Optional<Hincha> findByUsuarioId(Long usuarioId) {
        HinchaEntity entity = HinchaEntity.find("usuarioId", usuarioId).firstResult();
        return Optional.ofNullable(entity).map(this::toDomain);
    }

    @Override
    public Optional<Hincha> findByDocumentoHash(String documentoHash) {
        HinchaEntity entity = HinchaEntity.find("documentoHash", documentoHash).firstResult();
        return Optional.ofNullable(entity).map(this::toDomain);
    }

    @Override
    public Optional<Hincha> findById(Long id) {
        HinchaEntity entity = HinchaEntity.findById(id);
        return Optional.ofNullable(entity).map(this::toDomain);
    }

    @Override
    public List<Hincha> findByTenantId(String tenantId) {
        List<HinchaEntity> list = HinchaEntity.list("tenantId", Sort.by("id").descending(), tenantId);
        return list.stream().map(this::toDomain).toList();
    }

    @Override
    @Transactional
    public Hincha save(Hincha domain, String vectorCifrado) {
        HinchaEntity entity = domain.getId() != null
                ? HinchaEntity.findById(domain.getId())
                : HinchaEntity.find("usuarioId", domain.getUsuarioId()).firstResult();
        if (entity == null) {
            entity = new HinchaEntity();
        }
        entity.usuarioId = domain.getUsuarioId();
        entity.tenantId = domain.getTenantId();
        entity.tipoDocumento = domain.getTipoDocumento() != null ? domain.getTipoDocumento() : "CEDULA_CHILE";
        entity.documentoHash = domain.getDocumentoHash();
        entity.documentoEncrypted = cryptoService.encryptAesGcm(domain.getDocumentoDecrypted());
        entity.nombres = domain.getNombres();
        entity.apellidos = domain.getApellidos();
        entity.fechaNacimiento = domain.getFechaNacimiento();
        entity.nacionalidad = domain.getNacionalidad() != null ? domain.getNacionalidad() : "Chilena";
        if (domain.getBiometricTokenRef() != null) {
            entity.biometricTokenRefEncrypted = cryptoService.encryptAesGcm(domain.getBiometricTokenRef());
        }
        if (vectorCifrado != null) {
            entity.facialVectorEncrypted = cryptoService.encryptAesGcm(vectorCifrado);
        }
        entity.livenessPassed = domain.isLivenessPassed();
        entity.livenessScore = domain.getLivenessScore();
        entity.huellaRegistrada = domain.isHuellaRegistrada();
        entity.estadoEnrolamiento = domain.getEstadoEnrolamiento() != null ? domain.getEstadoEnrolamiento() : "COMPLETADO";
        if (domain.getFotoDocumentoBase64() != null) {
            entity.fotoDocumentoEncrypted = cryptoService.encryptAesGcm(domain.getFotoDocumentoBase64());
        }
        if (domain.getFotoRostroBase64() != null) {
            entity.fotoRostroEncrypted = cryptoService.encryptAesGcm(domain.getFotoRostroBase64());
        }
        if (domain.getResultadoCotejoDni() != null) {
            entity.resultadoCotejoDni = domain.getResultadoCotejoDni();
        }
        entity.persistAndFlush();
        return toDomain(entity);
    }

    @Override
    public Optional<String> findVectorCifradoByHinchaId(Long hinchaId) {
        HinchaEntity entity = HinchaEntity.findById(hinchaId);
        if (entity == null || entity.facialVectorEncrypted == null) {
            return Optional.empty();
        }
        return Optional.of(cryptoService.decryptAesGcm(entity.facialVectorEncrypted));
    }

    @Override
    @Transactional
    public Consentimiento saveConsentimiento(Consentimiento c) {
        ConsentimientoEntity entity = new ConsentimientoEntity();
        entity.hinchaId = c.getHinchaId();
        entity.usuarioId = c.getUsuarioId();
        entity.tenantId = c.getTenantId();
        entity.aceptaTerminosGenerales = c.isAceptaTerminosGenerales();
        entity.aceptaTratamientoBiometrico = c.isAceptaTratamientoBiometrico();
        entity.aceptaTransferenciaProcesamiento = c.isAceptaTransferenciaProcesamiento();
        entity.versionTerminos = c.getVersionTerminos() != null ? c.getVersionTerminos() : "ANFP-RNH-2026-v1.0";
        entity.ipOrigen = c.getIpOrigen();
        entity.hashDocumentoLegal = c.getHashDocumentoLegal();
        entity.persistAndFlush();
        return toDomainConsentimiento(entity);
    }

    @Override
    public Optional<Consentimiento> findLatestConsentimientoByUsuarioId(Long usuarioId) {
        ConsentimientoEntity entity = ConsentimientoEntity.find("usuarioId", Sort.by("id").descending(), usuarioId).firstResult();
        return Optional.ofNullable(entity).map(this::toDomainConsentimiento);
    }

    @Override
    @Transactional
    public HuellaBiometrica saveHuella(HuellaBiometrica h) {
        HuellaBiometricaEntity entity = HuellaBiometricaEntity.find("credentialId", h.getCredentialId()).firstResult();
        if (entity == null) {
            entity = new HuellaBiometricaEntity();
        }
        entity.hinchaId = h.getHinchaId();
        entity.usuarioId = h.getUsuarioId();
        entity.tenantId = h.getTenantId();
        entity.credentialId = h.getCredentialId();
        entity.publicKeyEncrypted = cryptoService.encryptAesGcm(h.getPublicKeyEncrypted());
        entity.huellaHash = h.getHuellaHash();
        entity.dispositivoTipo = h.getDispositivoTipo();
        entity.dedoIndice = h.getDedoIndice();
        entity.signCount = h.getSignCount();
        entity.activo = true;
        entity.persistAndFlush();
        return toDomainHuella(entity);
    }

    @Override
    public List<HuellaBiometrica> findHuellasByUsuarioId(Long usuarioId) {
        List<HuellaBiometricaEntity> list = HuellaBiometricaEntity.list("usuarioId", Sort.by("id").descending(), usuarioId);
        return list.stream().map(this::toDomainHuella).toList();
    }

    @Override
    public Optional<HuellaBiometrica> findHuellaByCredentialId(String credentialId) {
        if (credentialId == null || credentialId.isBlank()) return Optional.empty();
        HuellaBiometricaEntity entity = HuellaBiometricaEntity.find("credentialId = ?1 and activo = true", credentialId).firstResult();
        return Optional.ofNullable(entity).map(this::toDomainHuella);
    }

    @Override
    @Transactional
    public SolicitudArco saveSolicitudArco(SolicitudArco s) {
        SolicitudArcoEntity entity = new SolicitudArcoEntity();
        entity.usuarioId = s.getUsuarioId();
        entity.tenantId = s.getTenantId();
        entity.tipoDerecho = s.getTipoDerecho();
        entity.fundamento = s.getFundamento();
        entity.estado = s.getEstado() != null ? s.getEstado() : "EN_REVISION_DPO";
        entity.respuestaDpo = s.getRespuestaDpo();
        entity.persistAndFlush();
        return toDomainArco(entity);
    }

    @Override
    public List<SolicitudArco> findSolicitudesArcoByUsuarioId(Long usuarioId) {
        List<SolicitudArcoEntity> list = SolicitudArcoEntity.list("usuarioId", Sort.by("id").descending(), usuarioId);
        return list.stream().map(this::toDomainArco).toList();
    }

    @Override
    public List<SolicitudArco> findSolicitudesArcoByTenantId(String tenantId) {
        List<SolicitudArcoEntity> list = SolicitudArcoEntity.list("tenantId", Sort.by("id").descending(), tenantId);
        return list.stream().map(this::toDomainArco).toList();
    }

    private Hincha toDomain(HinchaEntity e) {
        Hincha h = new Hincha();
        h.setId(e.id);
        h.setUsuarioId(e.usuarioId);
        h.setTenantId(e.tenantId);
        h.setTipoDocumento(e.tipoDocumento);
        h.setDocumentoHash(e.documentoHash);
        h.setDocumentoDecrypted(cryptoService.decryptAesGcm(e.documentoEncrypted));
        h.setNombres(e.nombres);
        h.setApellidos(e.apellidos);
        h.setFechaNacimiento(e.fechaNacimiento);
        h.setNacionalidad(e.nacionalidad);
        h.setBiometricTokenRef(cryptoService.decryptAesGcm(e.biometricTokenRefEncrypted));
        h.setLivenessPassed(e.livenessPassed);
        h.setLivenessScore(e.livenessScore);
        h.setHuellaRegistrada(e.huellaRegistrada);
        h.setEstadoEnrolamiento(e.estadoEnrolamiento);
        if (e.fotoDocumentoEncrypted != null) {
            h.setFotoDocumentoBase64(cryptoService.decryptAesGcm(e.fotoDocumentoEncrypted));
        }
        if (e.fotoRostroEncrypted != null) {
            h.setFotoRostroBase64(cryptoService.decryptAesGcm(e.fotoRostroEncrypted));
        }
        h.setResultadoCotejoDni(e.resultadoCotejoDni != null ? e.resultadoCotejoDni : "VERIFICADO_COTEJO_OK");
        long prohibicionesCount = ProhibicionIngresoEntity.count("documentoHash = ?1 and activa = true", e.documentoHash);
        h.setTieneProhibicionActiva(prohibicionesCount > 0);
        h.setCreatedAt(e.createdAt);
        return h;
    }

    private Consentimiento toDomainConsentimiento(ConsentimientoEntity e) {
        Consentimiento c = new Consentimiento();
        c.setId(e.id);
        c.setHinchaId(e.hinchaId);
        c.setUsuarioId(e.usuarioId);
        c.setTenantId(e.tenantId);
        c.setAceptaTerminosGenerales(e.aceptaTerminosGenerales);
        c.setAceptaTratamientoBiometrico(e.aceptaTratamientoBiometrico);
        c.setAceptaTransferenciaProcesamiento(e.aceptaTransferenciaProcesamiento);
        c.setVersionTerminos(e.versionTerminos);
        c.setIpOrigen(e.ipOrigen);
        c.setHashDocumentoLegal(e.hashDocumentoLegal);
        c.setFechaAceptacion(e.fechaAceptacion);
        return c;
    }

    private HuellaBiometrica toDomainHuella(HuellaBiometricaEntity e) {
        HuellaBiometrica h = new HuellaBiometrica();
        h.setId(e.id);
        h.setHinchaId(e.hinchaId);
        h.setUsuarioId(e.usuarioId);
        h.setTenantId(e.tenantId);
        h.setCredentialId(e.credentialId);
        h.setPublicKeyEncrypted(e.publicKeyEncrypted); // Se mantiene cifrado al exponerse
        h.setHuellaHash(e.huellaHash);
        h.setDispositivoTipo(e.dispositivoTipo);
        h.setDedoIndice(e.dedoIndice);
        h.setSignCount(e.signCount);
        h.setActivo(e.activo);
        h.setCreatedAt(e.createdAt);
        return h;
    }

    private SolicitudArco toDomainArco(SolicitudArcoEntity e) {
        SolicitudArco s = new SolicitudArco();
        s.setId(e.id);
        s.setUsuarioId(e.usuarioId);
        UsuarioEntity u = UsuarioEntity.findById(e.usuarioId);
        if (u != null) s.setUsuarioEmail(u.email);
        s.setTenantId(e.tenantId);
        s.setTipoDerecho(e.tipoDerecho);
        s.setFundamento(e.fundamento);
        s.setEstado(e.estado);
        s.setRespuestaDpo(e.respuestaDpo);
        s.setCreatedAt(e.createdAt);
        return s;
    }
}
