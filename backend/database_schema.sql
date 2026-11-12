-- =====================================================================================
-- NOMBRE OFICIAL DE LA BASE DE DATOS: rnh_db (Registro Nacional de Hinchas)
-- MOTOR: PostgreSQL 14+
-- ARQUITECTURA: Single-Database Multi-Tenant con Aislamiento Lógico, Foreign Keys,
--               Cifrado en Reposo (AES-256-GCM), Blind Index (HMAC-SHA256) y PBKDF2.
-- =====================================================================================

-- PASO 1: CREAR LA BASE DE DATOS (Ejecutar conectado a PostgreSQL como superusuario)
CREATE DATABASE rnh_db WITH ENCODING 'UTF8';

-- PASO 2: CONECTARSE A LA BASE DE DATOS 'rnh_db'
\connect rnh_db;

-- =====================================================================================
-- TABLA 1: TENANTS (Empresas, Estadios Municipales, Clubes y Entidad Rectora ANFP)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(36) PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    rut_empresa VARCHAR(30),
    tipo_entidad VARCHAR(50) NOT NULL DEFAULT 'ESTADIO_MUNICIPAL',
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    max_usuarios INTEGER NOT NULL DEFAULT 10,
    storage_usado_mb DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    modulos_activos TEXT NOT NULL DEFAULT 'BIOMETRIA_FACIAL,HUELLA_DIGITAL,DERECHO_ADMISION,TICKETERA,AUDITORIA',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenants_codigo ON tenants(codigo);
CREATE INDEX IF NOT EXISTS idx_tenants_estado ON tenants(estado);

-- =====================================================================================
-- TABLA 2: USUARIOS (SuperAdmin Global, Administradores de Estadio, Operadores e Hinchas)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id BIGSERIAL PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    tenant_id VARCHAR(36) REFERENCES tenants(id) ON DELETE CASCADE,
    nombre_completo VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(30) NOT NULL DEFAULT 'USUARIO',
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    google_sub VARCHAR(150),
    avatar_url TEXT,
    rut_hash VARCHAR(128),
    rut_encrypted TEXT,
    telefono_encrypted TEXT,
    ultimo_acceso TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_usuario_email_tenant UNIQUE (email, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_usuarios_tenant_id ON usuarios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rut_hash ON usuarios(rut_hash);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);

-- =====================================================================================
-- TABLA 3: HINCHAS (Enrolamiento Biométrico Facial + Prueba de Vida + Cédula Cifrada)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS hinchas (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    tenant_id VARCHAR(36) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    tipo_documento VARCHAR(30) NOT NULL DEFAULT 'CEDULA_CHILE',
    documento_hash VARCHAR(128) NOT NULL,
    documento_encrypted TEXT NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE,
    nacionalidad VARCHAR(60) DEFAULT 'Chilena',
    biometric_token_ref_encrypted TEXT,
    facial_vector_encrypted TEXT,
    liveness_passed BOOLEAN NOT NULL DEFAULT FALSE,
    liveness_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    huella_registrada BOOLEAN NOT NULL DEFAULT FALSE,
    estado_enrolamiento VARCHAR(30) NOT NULL DEFAULT 'COMPLETADO',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hinchas_tenant_id ON hinchas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hinchas_documento_hash ON hinchas(documento_hash);
CREATE INDEX IF NOT EXISTS idx_hinchas_usuario_id ON hinchas(usuario_id);

-- =====================================================================================
-- TABLA 4: HUELLAS_BIOMETRICAS (Almacenamiento Cifrado WebAuthn FIDO2 / Sensor Huella)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS huellas_biometricas (
    id BIGSERIAL PRIMARY KEY,
    hincha_id BIGINT NOT NULL REFERENCES hinchas(id) ON DELETE CASCADE,
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tenant_id VARCHAR(36) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    credential_id VARCHAR(255) NOT NULL UNIQUE,
    public_key_encrypted TEXT NOT NULL,
    huella_hash VARCHAR(128) NOT NULL,
    dispositivo_tipo VARCHAR(80) NOT NULL DEFAULT 'WEBAUTHN_FIDO2_SENSOR',
    dedo_indice VARCHAR(40) NOT NULL DEFAULT 'INDICE_DERECHO',
    sign_count BIGINT NOT NULL DEFAULT 1,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_huellas_usuario_id ON huellas_biometricas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_huellas_hincha_id ON huellas_biometricas(hincha_id);
CREATE INDEX IF NOT EXISTS idx_huellas_tenant_id ON huellas_biometricas(tenant_id);

-- =====================================================================================
-- TABLA 5: CONSENTIMIENTOS_LEGALES (Evidencia Auditable T&C ANFP y Ley N° 19.628)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS consentimientos_legales (
    id BIGSERIAL PRIMARY KEY,
    hincha_id BIGINT NOT NULL REFERENCES hinchas(id) ON DELETE CASCADE,
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tenant_id VARCHAR(36) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    acepta_terminos_generales BOOLEAN NOT NULL,
    acepta_tratamiento_biometrico BOOLEAN NOT NULL,
    acepta_transferencia_procesamiento BOOLEAN NOT NULL DEFAULT TRUE,
    version_terminos VARCHAR(40) NOT NULL DEFAULT 'ANFP-RNH-2026-v1.0',
    ip_origen VARCHAR(64),
    hash_documento_legal VARCHAR(128) NOT NULL,
    fecha_aceptacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consentimientos_usuario_id ON consentimientos_legales(usuario_id);
CREATE INDEX IF NOT EXISTS idx_consentimientos_tenant_id ON consentimientos_legales(tenant_id);

-- =====================================================================================
-- TABLA 6: PROHIBICIONES_INGRESO (Derecho de Admisión / Código 101 Ley N° 19.327)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS prohibiciones_ingreso (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    hincha_id BIGINT REFERENCES hinchas(id) ON DELETE SET NULL,
    documento_hash VARCHAR(128) NOT NULL,
    documento_masked VARCHAR(30),
    nombre_referencia VARCHAR(150),
    codigo_causal VARCHAR(50) NOT NULL,
    motivo TEXT NOT NULL,
    alcance VARCHAR(30) NOT NULL DEFAULT 'NACIONAL',
    fecha_inicio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    creado_por_usuario_id BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prohibiciones_documento_hash ON prohibiciones_ingreso(documento_hash);
CREATE INDEX IF NOT EXISTS idx_prohibiciones_tenant_id ON prohibiciones_ingreso(tenant_id);

-- =====================================================================================
-- TABLA 7: ACCESOS_LOG (Bitácora de Verificación Biométrica en Puerta y Ticketera)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS accesos_log (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    hincha_id BIGINT REFERENCES hinchas(id) ON DELETE SET NULL,
    operador_usuario_id BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
    tipo_operacion VARCHAR(40) NOT NULL,
    puerta_acceso VARCHAR(80),
    similarity_score DOUBLE PRECISION DEFAULT 0.0,
    liveness_verified BOOLEAN DEFAULT TRUE,
    resultado VARCHAR(30) NOT NULL,
    detalle_mensaje TEXT,
    fecha_evento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_accesos_log_tenant_id ON accesos_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_accesos_log_hincha_id ON accesos_log(hincha_id);

-- =====================================================================================
-- TABLA 8: SOLICITUDES_ARCO (Ejercicio de Derechos ARCO Ley N° 19.628 ante DPO ANFP)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS solicitudes_arco (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tenant_id VARCHAR(36) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    tipo_derecho VARCHAR(40) NOT NULL,
    fundamento TEXT NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'EN_REVISION_DPO',
    respuesta_dpo TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_arco_usuario_id ON solicitudes_arco(usuario_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_arco_tenant_id ON solicitudes_arco(tenant_id);


-- =====================================================================================
-- DATOS INICIALES (TENANTS + SUPER ADMINISTRADOR yanezgabriel787@gmail.com CLAVE 1234)
-- =====================================================================================
INSERT INTO tenants (id, codigo, nombre, rut_empresa, tipo_entidad, estado, max_usuarios, storage_usado_mb, modulos_activos)
VALUES
  ('02da80fb-f3b3-4c93-a90c-ec7dcc3d6462', 'anfp-central', 'ANFP Central Chile (Entidad Rectora)', '70.015.400-7', 'ENTIDAD_RECTORA', 'ACTIVE', 25, 0.12, 'BIOMETRIA_FACIAL,HUELLA_DIGITAL,DERECHO_ADMISION,TICKETERA,AUDITORIA'),
  ('9691b2ce-d442-4be3-8c62-0eb17abbe2c5', 'estadio-municipal', 'Estadio Municipal Ester Roa', '69.150.200-K', 'ESTADIO_MUNICIPAL', 'ACTIVE', 15, 0.12, 'BIOMETRIA_FACIAL,HUELLA_DIGITAL,DERECHO_ADMISION,TICKETERA,AUDITORIA'),
  ('2981ed7d-984b-497c-9a37-598904bc92fa', 'estadio-nacional', 'Estadio Nacional Julio Martínez', '61.979.400-1', 'ESTADIO_MUNICIPAL', 'ACTIVE', 20, 0.12, 'BIOMETRIA_FACIAL,HUELLA_DIGITAL,DERECHO_ADMISION,TICKETERA,AUDITORIA'),
  ('14efa5c0-4c0a-4452-a67e-b77288bc1237', 'monumental', 'Estadio Monumental (Blanco y Negro S.A.)', '99.586.320-4', 'CLUB_DEPORTIVO', 'ACTIVE', 15, 0.12, 'BIOMETRIA_FACIAL,HUELLA_DIGITAL,DERECHO_ADMISION,TICKETERA,AUDITORIA'),
  ('9f4cc3ca-f250-4257-9a8a-7c1df3d3f049', 'santa-laura', 'Estadio Santa Laura U-SEK', '96.814.510-2', 'ESTADIO_MUNICIPAL', 'ACTIVE', 10, 0.12, 'BIOMETRIA_FACIAL,HUELLA_DIGITAL,DERECHO_ADMISION,TICKETERA,AUDITORIA')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO usuarios (uuid, tenant_id, nombre_completo, email, password_hash, rol, estado)
VALUES
  ('a0000001-0000-4000-8000-000000000001', '02da80fb-f3b3-4c93-a90c-ec7dcc3d6462', 'Gabriel Yáñez (Super Administrador RNH)', 'yanezgabriel787@gmail.com', 'PBKDF2$65536$K7stGWaAGDdwgEy4v3n1yw==$t5pG0GF30C8geNFTlzi6gtEKI9eBSGrhlxa1CHh8NQk=', 'SUPER_ADMIN', 'ACTIVE'),
  ('a0000002-0000-4000-8000-000000000002', '9691b2ce-d442-4be3-8c62-0eb17abbe2c5', 'Administrador Estadio Municipal', 'admin@estadiomunicipal.cl', 'PBKDF2$65536$K7stGWaAGDdwgEy4v3n1yw==$t5pG0GF30C8geNFTlzi6gtEKI9eBSGrhlxa1CHh8NQk=', 'ADMIN_TENANT', 'ACTIVE')
ON CONFLICT (email, tenant_id) DO NOTHING;
