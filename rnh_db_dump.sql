-- ==============================================================================
-- DUMP OFICIAL BASE DE DATOS: rnh_db (Registro Nacional de Hinchas - Chile)
-- ARCHIVO EXPORTABLE LISTO PARA IMPORTAR EN CUALQUIER MÁQUINA O SERVIDOR
-- ==============================================================================
--
-- CÓMO IMPORTAR EN OTRA MÁQUINA:
--
-- Opción A: Por consola / terminal (Linux / macOS / Windows):
--   1. Crear la base de datos (si aún no existe):
--      psql -U postgres -c "CREATE DATABASE rnh_db;"
--   2. Importar este archivo:
--      psql -U postgres -d rnh_db -f rnh_db_dump.sql
--
-- Opción B: En pgAdmin 4 / DBeaver:
--   1. Crear base de datos vacía llamada 'rnh_db'.
--   2. Abrir la herramienta 'Query Tool' / 'Editor SQL' conectada a 'rnh_db'.
--   3. Abrir o pegar el contenido de este archivo 'rnh_db_dump.sql' y presionar Ejecutar (F5).
--
-- Opción C: Con Docker:
--   docker exec -i postgres_container psql -U postgres -d rnh_db < rnh_db_dump.sql
--
-- USUARIO SUPER ADMINISTRADOR PRECONFIGURADO:
--   - Correo: yanezgabriel787@gmail.com
--   - Contraseña: 1234
--   - Rol: SUPER_ADMIN
-- ==============================================================================

--
-- PostgreSQL database dump
--


-- Dumped from database version 14.24 (Ubuntu 14.24-1.pgdg22.04+2)
-- Dumped by pg_dump version 14.24 (Ubuntu 14.24-0ubuntu0.22.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.usuarios DROP CONSTRAINT IF EXISTS usuarios_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.solicitudes_arco DROP CONSTRAINT IF EXISTS solicitudes_arco_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.solicitudes_arco DROP CONSTRAINT IF EXISTS solicitudes_arco_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.prohibiciones_ingreso DROP CONSTRAINT IF EXISTS prohibiciones_ingreso_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.prohibiciones_ingreso DROP CONSTRAINT IF EXISTS prohibiciones_ingreso_hincha_id_fkey;
ALTER TABLE IF EXISTS ONLY public.prohibiciones_ingreso DROP CONSTRAINT IF EXISTS prohibiciones_ingreso_creado_por_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.huellas_biometricas DROP CONSTRAINT IF EXISTS huellas_biometricas_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.huellas_biometricas DROP CONSTRAINT IF EXISTS huellas_biometricas_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.huellas_biometricas DROP CONSTRAINT IF EXISTS huellas_biometricas_hincha_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hinchas DROP CONSTRAINT IF EXISTS hinchas_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hinchas DROP CONSTRAINT IF EXISTS hinchas_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.consentimientos_legales DROP CONSTRAINT IF EXISTS consentimientos_legales_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.consentimientos_legales DROP CONSTRAINT IF EXISTS consentimientos_legales_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.consentimientos_legales DROP CONSTRAINT IF EXISTS consentimientos_legales_hincha_id_fkey;
ALTER TABLE IF EXISTS ONLY public.accesos_log DROP CONSTRAINT IF EXISTS accesos_log_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.accesos_log DROP CONSTRAINT IF EXISTS accesos_log_operador_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.accesos_log DROP CONSTRAINT IF EXISTS accesos_log_hincha_id_fkey;
DROP INDEX IF EXISTS public.idx_usuarios_tenant_id;
DROP INDEX IF EXISTS public.idx_usuarios_rut_hash;
DROP INDEX IF EXISTS public.idx_usuarios_rol;
DROP INDEX IF EXISTS public.idx_usuarios_email;
DROP INDEX IF EXISTS public.idx_tenants_estado;
DROP INDEX IF EXISTS public.idx_tenants_codigo;
DROP INDEX IF EXISTS public.idx_solicitudes_arco_usuario_id;
DROP INDEX IF EXISTS public.idx_solicitudes_arco_tenant_id;
DROP INDEX IF EXISTS public.idx_prohibiciones_tenant_id;
DROP INDEX IF EXISTS public.idx_prohibiciones_documento_hash;
DROP INDEX IF EXISTS public.idx_huellas_usuario_id;
DROP INDEX IF EXISTS public.idx_huellas_tenant_id;
DROP INDEX IF EXISTS public.idx_huellas_hincha_id;
DROP INDEX IF EXISTS public.idx_hinchas_usuario_id;
DROP INDEX IF EXISTS public.idx_hinchas_tenant_id;
DROP INDEX IF EXISTS public.idx_hinchas_documento_hash;
DROP INDEX IF EXISTS public.idx_consentimientos_usuario_id;
DROP INDEX IF EXISTS public.idx_consentimientos_tenant_id;
DROP INDEX IF EXISTS public.idx_accesos_log_tenant_id;
DROP INDEX IF EXISTS public.idx_accesos_log_hincha_id;
ALTER TABLE IF EXISTS ONLY public.usuarios DROP CONSTRAINT IF EXISTS usuarios_uuid_key;
ALTER TABLE IF EXISTS ONLY public.usuarios DROP CONSTRAINT IF EXISTS usuarios_pkey;
ALTER TABLE IF EXISTS ONLY public.usuarios DROP CONSTRAINT IF EXISTS uk_usuario_email_tenant;
ALTER TABLE IF EXISTS ONLY public.tenants DROP CONSTRAINT IF EXISTS tenants_pkey;
ALTER TABLE IF EXISTS ONLY public.tenants DROP CONSTRAINT IF EXISTS tenants_codigo_key;
ALTER TABLE IF EXISTS ONLY public.solicitudes_arco DROP CONSTRAINT IF EXISTS solicitudes_arco_pkey;
ALTER TABLE IF EXISTS ONLY public.prohibiciones_ingreso DROP CONSTRAINT IF EXISTS prohibiciones_ingreso_pkey;
ALTER TABLE IF EXISTS ONLY public.huellas_biometricas DROP CONSTRAINT IF EXISTS huellas_biometricas_pkey;
ALTER TABLE IF EXISTS ONLY public.huellas_biometricas DROP CONSTRAINT IF EXISTS huellas_biometricas_credential_id_key;
ALTER TABLE IF EXISTS ONLY public.hinchas DROP CONSTRAINT IF EXISTS hinchas_usuario_id_key;
ALTER TABLE IF EXISTS ONLY public.hinchas DROP CONSTRAINT IF EXISTS hinchas_pkey;
ALTER TABLE IF EXISTS ONLY public.consentimientos_legales DROP CONSTRAINT IF EXISTS consentimientos_legales_pkey;
ALTER TABLE IF EXISTS ONLY public.accesos_log DROP CONSTRAINT IF EXISTS accesos_log_pkey;
ALTER TABLE IF EXISTS public.usuarios ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.solicitudes_arco ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.prohibiciones_ingreso ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.huellas_biometricas ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.hinchas ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.consentimientos_legales ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.accesos_log ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.usuarios_id_seq;
DROP TABLE IF EXISTS public.usuarios;
DROP TABLE IF EXISTS public.tenants;
DROP SEQUENCE IF EXISTS public.solicitudes_arco_id_seq;
DROP TABLE IF EXISTS public.solicitudes_arco;
DROP SEQUENCE IF EXISTS public.prohibiciones_ingreso_id_seq;
DROP TABLE IF EXISTS public.prohibiciones_ingreso;
DROP SEQUENCE IF EXISTS public.huellas_biometricas_id_seq;
DROP TABLE IF EXISTS public.huellas_biometricas;
DROP SEQUENCE IF EXISTS public.hinchas_id_seq;
DROP TABLE IF EXISTS public.hinchas;
DROP SEQUENCE IF EXISTS public.consentimientos_legales_id_seq;
DROP TABLE IF EXISTS public.consentimientos_legales;
DROP SEQUENCE IF EXISTS public.accesos_log_id_seq;
DROP TABLE IF EXISTS public.accesos_log;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accesos_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accesos_log (
    id bigint NOT NULL,
    tenant_id character varying(36) NOT NULL,
    hincha_id bigint,
    operador_usuario_id bigint,
    tipo_operacion character varying(40) NOT NULL,
    puerta_acceso character varying(80),
    similarity_score double precision DEFAULT 0.0,
    liveness_verified boolean DEFAULT true,
    resultado character varying(30) NOT NULL,
    detalle_mensaje text,
    fecha_evento timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: accesos_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.accesos_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: accesos_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.accesos_log_id_seq OWNED BY public.accesos_log.id;


--
-- Name: consentimientos_legales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consentimientos_legales (
    id bigint NOT NULL,
    hincha_id bigint NOT NULL,
    usuario_id bigint NOT NULL,
    tenant_id character varying(36) NOT NULL,
    acepta_terminos_generales boolean NOT NULL,
    acepta_tratamiento_biometrico boolean NOT NULL,
    acepta_transferencia_procesamiento boolean DEFAULT true NOT NULL,
    version_terminos character varying(40) DEFAULT 'ANFP-RNH-2026-v1.0'::character varying NOT NULL,
    ip_origen character varying(64),
    hash_documento_legal character varying(128) NOT NULL,
    fecha_aceptacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: consentimientos_legales_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.consentimientos_legales_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: consentimientos_legales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.consentimientos_legales_id_seq OWNED BY public.consentimientos_legales.id;


--
-- Name: hinchas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hinchas (
    id bigint NOT NULL,
    usuario_id bigint NOT NULL,
    tenant_id character varying(36) NOT NULL,
    tipo_documento character varying(30) DEFAULT 'CEDULA_CHILE'::character varying NOT NULL,
    documento_hash character varying(128) NOT NULL,
    documento_encrypted text NOT NULL,
    nombres character varying(100) NOT NULL,
    apellidos character varying(100) NOT NULL,
    fecha_nacimiento date,
    nacionalidad character varying(60) DEFAULT 'Chilena'::character varying,
    biometric_token_ref_encrypted text,
    facial_vector_encrypted text,
    liveness_passed boolean DEFAULT false NOT NULL,
    liveness_score double precision DEFAULT 0.0 NOT NULL,
    huella_registrada boolean DEFAULT false NOT NULL,
    estado_enrolamiento character varying(30) DEFAULT 'COMPLETADO'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: hinchas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hinchas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hinchas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.hinchas_id_seq OWNED BY public.hinchas.id;


--
-- Name: huellas_biometricas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.huellas_biometricas (
    id bigint NOT NULL,
    hincha_id bigint NOT NULL,
    usuario_id bigint NOT NULL,
    tenant_id character varying(36) NOT NULL,
    credential_id character varying(255) NOT NULL,
    public_key_encrypted text NOT NULL,
    huella_hash character varying(128) NOT NULL,
    dispositivo_tipo character varying(80) DEFAULT 'WEBAUTHN_FIDO2_SENSOR'::character varying NOT NULL,
    dedo_indice character varying(40) DEFAULT 'INDICE_DERECHO'::character varying NOT NULL,
    sign_count bigint DEFAULT 1 NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: huellas_biometricas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.huellas_biometricas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: huellas_biometricas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.huellas_biometricas_id_seq OWNED BY public.huellas_biometricas.id;


--
-- Name: prohibiciones_ingreso; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prohibiciones_ingreso (
    id bigint NOT NULL,
    tenant_id character varying(36) NOT NULL,
    hincha_id bigint,
    documento_hash character varying(128) NOT NULL,
    documento_masked character varying(30),
    nombre_referencia character varying(150),
    codigo_causal character varying(50) NOT NULL,
    motivo text NOT NULL,
    alcance character varying(30) DEFAULT 'NACIONAL'::character varying NOT NULL,
    fecha_inicio timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_fin timestamp without time zone,
    activa boolean DEFAULT true NOT NULL,
    creado_por_usuario_id bigint,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: prohibiciones_ingreso_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.prohibiciones_ingreso_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: prohibiciones_ingreso_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.prohibiciones_ingreso_id_seq OWNED BY public.prohibiciones_ingreso.id;


--
-- Name: solicitudes_arco; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solicitudes_arco (
    id bigint NOT NULL,
    usuario_id bigint NOT NULL,
    tenant_id character varying(36) NOT NULL,
    tipo_derecho character varying(40) NOT NULL,
    fundamento text NOT NULL,
    estado character varying(30) DEFAULT 'EN_REVISION_DPO'::character varying NOT NULL,
    respuesta_dpo text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: solicitudes_arco_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.solicitudes_arco_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: solicitudes_arco_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.solicitudes_arco_id_seq OWNED BY public.solicitudes_arco.id;


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenants (
    id character varying(36) NOT NULL,
    codigo character varying(50) NOT NULL,
    nombre character varying(150) NOT NULL,
    rut_empresa character varying(30),
    tipo_entidad character varying(50) DEFAULT 'ESTADIO_MUNICIPAL'::character varying NOT NULL,
    estado character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    max_usuarios integer DEFAULT 10 NOT NULL,
    storage_usado_mb double precision DEFAULT 0.00 NOT NULL,
    modulos_activos text DEFAULT 'BIOMETRIA_FACIAL,HUELLA_DIGITAL,DERECHO_ADMISION,TICKETERA,AUDITORIA'::text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id bigint NOT NULL,
    uuid character varying(36) NOT NULL,
    tenant_id character varying(36),
    nombre_completo character varying(150) NOT NULL,
    email character varying(150) NOT NULL,
    password_hash character varying(255) NOT NULL,
    rol character varying(30) DEFAULT 'USUARIO'::character varying NOT NULL,
    estado character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    google_sub character varying(150),
    avatar_url text,
    rut_hash character varying(128),
    rut_encrypted text,
    telefono_encrypted text,
    ultimo_acceso timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usuarios_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: accesos_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accesos_log ALTER COLUMN id SET DEFAULT nextval('public.accesos_log_id_seq'::regclass);


--
-- Name: consentimientos_legales id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consentimientos_legales ALTER COLUMN id SET DEFAULT nextval('public.consentimientos_legales_id_seq'::regclass);


--
-- Name: hinchas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hinchas ALTER COLUMN id SET DEFAULT nextval('public.hinchas_id_seq'::regclass);


--
-- Name: huellas_biometricas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.huellas_biometricas ALTER COLUMN id SET DEFAULT nextval('public.huellas_biometricas_id_seq'::regclass);


--
-- Name: prohibiciones_ingreso id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prohibiciones_ingreso ALTER COLUMN id SET DEFAULT nextval('public.prohibiciones_ingreso_id_seq'::regclass);


--
-- Name: solicitudes_arco id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_arco ALTER COLUMN id SET DEFAULT nextval('public.solicitudes_arco_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Data for Name: accesos_log; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: consentimientos_legales; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.consentimientos_legales VALUES (1, 1, 4, '9691b2ce-d442-4be3-8c62-0eb17abbe2c5', true, true, true, 'ANFP-RNH-2026-v1.0', '127.0.0.1', 'be1cfb3a544a8e9c367386aae6594c04bdb59223131d16791966e3ed1e71f9d6', '2026-11-12 10:57:21.418337');


--
-- Data for Name: hinchas; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.hinchas VALUES (1, 4, '9691b2ce-d442-4be3-8c62-0eb17abbe2c5', 'CEDULA_CHILE', '63952359e57b30c5c9805f751a5aed694192f071e7a7942da85944230b0928d0', 'AES256GCM$lDSRm6KnDOgUgPku$ADC82LSBlS1DDav2dfgOUR0WxMb7SsftOA==', 'Matías', 'Fernández', '1996-05-14', 'Chilena', 'AES256GCM$vbH6cuGE4L9HJ9oC$yyt5/r+gJpKeFhpUx7OdrhZ0Zs6hnbr0ASDDEqmUus4=', 'AES256GCM$h1L2b6uZgJLdcxWO$hJ9Fjx8SgrfI7DqNCEpb1gviiz63BD3tUfP8dmhx6cvbmxb2sIrHwDVBoAS9nsP+LuH3Na5gfSXmg06erehR5g3yRg==', true, 0.991, true, 'COMPLETADO', '2026-11-12 10:57:21.401422', '2026-11-12 10:57:21.401422');


--
-- Data for Name: huellas_biometricas; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.huellas_biometricas VALUES (1, 1, 4, '9691b2ce-d442-4be3-8c62-0eb17abbe2c5', 'FIDO2-CRED-ESTADIO-18543210K', 'AES256GCM$S1hV8EF/576x2V7y$yvJdvRlHAE5CKsnw2CfZZ/MBjSYvAlikGDDAXqEG7DRmgGEGaWe9/DgD0WAI', '3f0c9f42852103d4f59eca374ccaa89ec2b415cf187b30c48e9102f43abc5381', 'TouchID / Sensor Biométrico FIDO2', 'INDICE_DERECHO', 1, true, '2026-11-12 10:57:21.426532');


--
-- Data for Name: prohibiciones_ingreso; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.prohibiciones_ingreso VALUES (1, '14efa5c0-4c0a-4452-a67e-b77288bc1237', NULL, 'be63604e45e426e2e0404f3128653d53c4e1ae70f163db1b123c5ba1aa1df360', '201.***-3', 'Individuo Sancionado (Código 101)', 'LEY_19327_ART_10_DERECHO_ADMISION', 'Prohibición nacional de ingreso a estadios por infracción grave a la Ley N° 19.327 (Estadio Seguro).', 'NACIONAL', '2026-11-12 10:57:21.492705', NULL, true, NULL, '2026-11-12 10:57:21.492705');


--
-- Data for Name: solicitudes_arco; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tenants VALUES ('02da80fb-f3b3-4c93-a90c-ec7dcc3d6462', 'anfp-central', 'ANFP Central Chile (Entidad Rectora)', '70.015.400-7', 'ENTIDAD_RECTORA', 'ACTIVE', 25, 0.12, 'BIOMETRIA_FACIAL,HUELLA_DIGITAL,DERECHO_ADMISION,TICKETERA,AUDITORIA', '2026-11-12 10:57:20.926323', '2026-11-12 10:57:20.926323');
INSERT INTO public.tenants VALUES ('9691b2ce-d442-4be3-8c62-0eb17abbe2c5', 'estadio-municipal', 'Estadio Municipal Ester Roa', '69.150.200-K', 'ESTADIO_MUNICIPAL', 'ACTIVE', 15, 0.12, 'BIOMETRIA_FACIAL,HUELLA_DIGITAL,DERECHO_ADMISION,TICKETERA,AUDITORIA', '2026-11-12 10:57:20.984728', '2026-11-12 10:57:20.984728');
INSERT INTO public.tenants VALUES ('2981ed7d-984b-497c-9a37-598904bc92fa', 'estadio-nacional', 'Estadio Nacional Julio Martínez', '61.979.400-1', 'ESTADIO_MUNICIPAL', 'ACTIVE', 20, 0.12, 'BIOMETRIA_FACIAL,HUELLA_DIGITAL,DERECHO_ADMISION,TICKETERA,AUDITORIA', '2026-11-12 10:57:21.001514', '2026-11-12 10:57:21.001514');
INSERT INTO public.tenants VALUES ('14efa5c0-4c0a-4452-a67e-b77288bc1237', 'monumental', 'Estadio Monumental (Blanco y Negro S.A.)', '99.586.320-4', 'CLUB_DEPORTIVO', 'ACTIVE', 15, 0.12, 'BIOMETRIA_FACIAL,HUELLA_DIGITAL,DERECHO_ADMISION,TICKETERA,AUDITORIA', '2026-11-12 10:57:21.010954', '2026-11-12 10:57:21.010954');
INSERT INTO public.tenants VALUES ('9f4cc3ca-f250-4257-9a8a-7c1df3d3f049', 'santa-laura', 'Estadio Santa Laura U-SEK', '96.814.510-2', 'ESTADIO_MUNICIPAL', 'ACTIVE', 10, 0.12, 'BIOMETRIA_FACIAL,HUELLA_DIGITAL,DERECHO_ADMISION,TICKETERA,AUDITORIA', '2026-11-12 10:57:21.018773', '2026-11-12 10:57:21.018773');


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.usuarios VALUES (3, '76b62f54-419b-491c-9687-10e4b5d63623', '2981ed7d-984b-497c-9a37-598904bc92fa', 'Operador Torniquete Norte', 'operador@estadionacional.cl', 'PBKDF2$65536$5PHbxkU/2obb8HL05YiVtw==$lNuDg93aqju8W3GK0zOLVtbsV68ib4C9MWGaofYhomA=', 'OPERADOR_ACCESO', 'ACTIVE', NULL, NULL, NULL, NULL, NULL, NULL, '2026-11-12 10:57:21.322777', '2026-11-12 10:57:21.322777');
INSERT INTO public.usuarios VALUES (4, 'd801a8ee-fd58-4ee2-814a-baaee26f17a7', '9691b2ce-d442-4be3-8c62-0eb17abbe2c5', 'Matías Fernández Hincha', 'hincha@estadiomunicipal.cl', 'PBKDF2$65536$ha0tSJvy5m3xSEet38xClQ==$oGs2O3NIaglRQ/wjEtAD30n9U5XLtceJ6txjnVxIlCc=', 'USUARIO', 'ACTIVE', NULL, NULL, '63952359e57b30c5c9805f751a5aed694192f071e7a7942da85944230b0928d0', 'AES256GCM$9AJlMb3VO58Im00T$dH2YyBF8/GUh7e75PUCBPhQc0nViYfrzsw==', 'AES256GCM$cP0FjdxWGAHYc/Nx$1DRDldCRYpNrzzcznVPV2blhxNQTEgmD1GkzIg==', NULL, '2026-11-12 10:57:21.391213', '2026-11-12 10:57:21.391213');
INSERT INTO public.usuarios VALUES (1, '3877b11a-252f-4192-a4ec-0b5f79f4d637', '02da80fb-f3b3-4c93-a90c-ec7dcc3d6462', 'Gabriel Yáñez (Super Administrador RNH)', 'yanezgabriel787@gmail.com', 'PBKDF2$65536$K7stGWaAGDdwgEy4v3n1yw==$t5pG0GF30C8geNFTlzi6gtEKI9eBSGrhlxa1CHh8NQk=', 'SUPER_ADMIN', 'ACTIVE', NULL, NULL, '31da4ca8707ce4b03406d467879171703b693dc32373506bb68f3b8cefea186b', 'AES256GCM$5G9KAXzPKN6wyr9Z$//3HkYm0Hz0D7eWOGOSGn2Wg5Ub6yRObsw==', 'AES256GCM$u+XCLj7hWnWGOgta$QSIOTAG23t7QnkZGMNBaxw81vnzh7oKz5Yj0BQ==', '2026-11-12 12:07:04.738882', '2026-11-12 10:57:21.177678', '2026-11-12 12:07:04.740393');
INSERT INTO public.usuarios VALUES (2, '2f99d197-d2b0-41d3-8458-77ed2e2a9482', '9691b2ce-d442-4be3-8c62-0eb17abbe2c5', 'Administrador Estadio Municipal', 'admin@estadiomunicipal.cl', 'PBKDF2$65536$re6Yzed5FvtHtnVvO96D0Q==$PBKI6ww/fOHazvDpwPfzQ6fTkR0fbH8HErQYOow6QtI=', 'ADMIN_TENANT', 'ACTIVE', NULL, NULL, '7940c40b49bb8311bf6121b58ee2b205e478e392f1ef30a03e7fee97371bb28c', 'AES256GCM$0Bh8LTdpBmH1WaoM$TF2lyydvnPwqn2A8JfM5MlCs8w5jae3ZkA==', 'AES256GCM$ajL9jUCTGm7aIMR/$9bLbEJuhEbMns+eLZ6vgiK3sK0Bz/A4r4+LxCQ==', '2026-11-12 12:14:05.416809', '2026-11-12 10:57:21.253659', '2026-11-12 12:14:05.417408');


--
-- Name: accesos_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.accesos_log_id_seq', 1, false);


--
-- Name: consentimientos_legales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.consentimientos_legales_id_seq', 1, true);


--
-- Name: hinchas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.hinchas_id_seq', 1, true);


--
-- Name: huellas_biometricas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.huellas_biometricas_id_seq', 1, true);


--
-- Name: prohibiciones_ingreso_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.prohibiciones_ingreso_id_seq', 1, true);


--
-- Name: solicitudes_arco_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.solicitudes_arco_id_seq', 1, false);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 6, true);


--
-- Name: accesos_log accesos_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accesos_log
    ADD CONSTRAINT accesos_log_pkey PRIMARY KEY (id);


--
-- Name: consentimientos_legales consentimientos_legales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consentimientos_legales
    ADD CONSTRAINT consentimientos_legales_pkey PRIMARY KEY (id);


--
-- Name: hinchas hinchas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hinchas
    ADD CONSTRAINT hinchas_pkey PRIMARY KEY (id);


--
-- Name: hinchas hinchas_usuario_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hinchas
    ADD CONSTRAINT hinchas_usuario_id_key UNIQUE (usuario_id);


--
-- Name: huellas_biometricas huellas_biometricas_credential_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.huellas_biometricas
    ADD CONSTRAINT huellas_biometricas_credential_id_key UNIQUE (credential_id);


--
-- Name: huellas_biometricas huellas_biometricas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.huellas_biometricas
    ADD CONSTRAINT huellas_biometricas_pkey PRIMARY KEY (id);


--
-- Name: prohibiciones_ingreso prohibiciones_ingreso_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prohibiciones_ingreso
    ADD CONSTRAINT prohibiciones_ingreso_pkey PRIMARY KEY (id);


--
-- Name: solicitudes_arco solicitudes_arco_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_arco
    ADD CONSTRAINT solicitudes_arco_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_codigo_key UNIQUE (codigo);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: usuarios uk_usuario_email_tenant; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT uk_usuario_email_tenant UNIQUE (email, tenant_id);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_uuid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_uuid_key UNIQUE (uuid);


--
-- Name: idx_accesos_log_hincha_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_accesos_log_hincha_id ON public.accesos_log USING btree (hincha_id);


--
-- Name: idx_accesos_log_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_accesos_log_tenant_id ON public.accesos_log USING btree (tenant_id);


--
-- Name: idx_consentimientos_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_consentimientos_tenant_id ON public.consentimientos_legales USING btree (tenant_id);


--
-- Name: idx_consentimientos_usuario_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_consentimientos_usuario_id ON public.consentimientos_legales USING btree (usuario_id);


--
-- Name: idx_hinchas_documento_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hinchas_documento_hash ON public.hinchas USING btree (documento_hash);


--
-- Name: idx_hinchas_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hinchas_tenant_id ON public.hinchas USING btree (tenant_id);


--
-- Name: idx_hinchas_usuario_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hinchas_usuario_id ON public.hinchas USING btree (usuario_id);


--
-- Name: idx_huellas_hincha_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_huellas_hincha_id ON public.huellas_biometricas USING btree (hincha_id);


--
-- Name: idx_huellas_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_huellas_tenant_id ON public.huellas_biometricas USING btree (tenant_id);


--
-- Name: idx_huellas_usuario_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_huellas_usuario_id ON public.huellas_biometricas USING btree (usuario_id);


--
-- Name: idx_prohibiciones_documento_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prohibiciones_documento_hash ON public.prohibiciones_ingreso USING btree (documento_hash);


--
-- Name: idx_prohibiciones_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prohibiciones_tenant_id ON public.prohibiciones_ingreso USING btree (tenant_id);


--
-- Name: idx_solicitudes_arco_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_solicitudes_arco_tenant_id ON public.solicitudes_arco USING btree (tenant_id);


--
-- Name: idx_solicitudes_arco_usuario_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_solicitudes_arco_usuario_id ON public.solicitudes_arco USING btree (usuario_id);


--
-- Name: idx_tenants_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tenants_codigo ON public.tenants USING btree (codigo);


--
-- Name: idx_tenants_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tenants_estado ON public.tenants USING btree (estado);


--
-- Name: idx_usuarios_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuarios_email ON public.usuarios USING btree (email);


--
-- Name: idx_usuarios_rol; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuarios_rol ON public.usuarios USING btree (rol);


--
-- Name: idx_usuarios_rut_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuarios_rut_hash ON public.usuarios USING btree (rut_hash);


--
-- Name: idx_usuarios_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuarios_tenant_id ON public.usuarios USING btree (tenant_id);


--
-- Name: accesos_log accesos_log_hincha_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accesos_log
    ADD CONSTRAINT accesos_log_hincha_id_fkey FOREIGN KEY (hincha_id) REFERENCES public.hinchas(id) ON DELETE SET NULL;


--
-- Name: accesos_log accesos_log_operador_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accesos_log
    ADD CONSTRAINT accesos_log_operador_usuario_id_fkey FOREIGN KEY (operador_usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: accesos_log accesos_log_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accesos_log
    ADD CONSTRAINT accesos_log_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: consentimientos_legales consentimientos_legales_hincha_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consentimientos_legales
    ADD CONSTRAINT consentimientos_legales_hincha_id_fkey FOREIGN KEY (hincha_id) REFERENCES public.hinchas(id) ON DELETE CASCADE;


--
-- Name: consentimientos_legales consentimientos_legales_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consentimientos_legales
    ADD CONSTRAINT consentimientos_legales_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: consentimientos_legales consentimientos_legales_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consentimientos_legales
    ADD CONSTRAINT consentimientos_legales_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: hinchas hinchas_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hinchas
    ADD CONSTRAINT hinchas_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: hinchas hinchas_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hinchas
    ADD CONSTRAINT hinchas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: huellas_biometricas huellas_biometricas_hincha_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.huellas_biometricas
    ADD CONSTRAINT huellas_biometricas_hincha_id_fkey FOREIGN KEY (hincha_id) REFERENCES public.hinchas(id) ON DELETE CASCADE;


--
-- Name: huellas_biometricas huellas_biometricas_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.huellas_biometricas
    ADD CONSTRAINT huellas_biometricas_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: huellas_biometricas huellas_biometricas_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.huellas_biometricas
    ADD CONSTRAINT huellas_biometricas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: prohibiciones_ingreso prohibiciones_ingreso_creado_por_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prohibiciones_ingreso
    ADD CONSTRAINT prohibiciones_ingreso_creado_por_usuario_id_fkey FOREIGN KEY (creado_por_usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: prohibiciones_ingreso prohibiciones_ingreso_hincha_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prohibiciones_ingreso
    ADD CONSTRAINT prohibiciones_ingreso_hincha_id_fkey FOREIGN KEY (hincha_id) REFERENCES public.hinchas(id) ON DELETE SET NULL;


--
-- Name: prohibiciones_ingreso prohibiciones_ingreso_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prohibiciones_ingreso
    ADD CONSTRAINT prohibiciones_ingreso_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: solicitudes_arco solicitudes_arco_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_arco
    ADD CONSTRAINT solicitudes_arco_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: solicitudes_arco solicitudes_arco_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_arco
    ADD CONSTRAINT solicitudes_arco_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: usuarios usuarios_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


