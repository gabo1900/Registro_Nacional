# Manual de Configuración y Despliegue: Registro Nacional de Hinchas (RNH Chile)

Este proyecto implementa la solución completa del **Registro Nacional de Hinchas (RNH)** bajo la normativa de la **ANFP (Asociación Nacional de Fútbol Profesional)**, la **Ley N° 19.327 (Estadio Seguro)** y la **Ley N° 19.628 (Protección de Datos Personales y Biométricos)**.

---

## 1. Estructura de Carpetas del Proyecto

```
/home/gabriel/proyectos/chile/registro_nacional/
├── iniciar_sistema.sh            # Script para levantar Backend y Frontend juntos
├── MANUAL_Y_CONFIGURACION.md     # Este manual técnico
│
├── backend/                      # Backend en Java 17 + Quarkus (Arquitectura Hexagonal Pura)
│   ├── database_schema.sql       # Script SQL DDL con todas las tablas, FKs e índices
│   ├── pom.xml                   # Dependencias Maven (Quarkus, Panache, Postgres, Jackson)
│   ├── run.sh                    # Script de inicio dev
│   └── src/main/java/com/rnh/backend/
│       ├── domain/               # NÚCLEO PURO DE DOMINIO (Sin dependencias de frameworks)
│       │   ├── model/            # Tenant, Usuario, Hincha, Consentimiento, HuellaBiometrica, etc.
│       │   ├── vo/               # RutDocumento, VectorBiometricoRef, NivelConfianza
│       │   ├── port/in/          # Casos de Uso: Auth, Tenant, Enrolar, Verificar
│       │   ├── port/out/         # Interfaces: Repositorios, Biometría, Google OAuth
│       │   └── exception/        # Reglas de negocio y aislamiento de Tenant
│       ├── application/service/  # Implementación de Casos de Uso
│       └── infrastructure/       # ADAPTADORES TECNOLÓGICOS
│           ├── adapter/in/rest/  # Controladores REST JAX-RS
│           ├── adapter/out/      # Persistencia PostgreSQL y Adaptador Biométrico/Google
│           └── security/         # Cifrado AES-256-GCM, HMAC-SHA256, PBKDF2 y JWT
│
└── frontend/                     # Frontend en React 18 + Vite + Tailwind CSS
    ├── package.json              # Dependencias NPM instaladas
    ├── vite.config.js            # Configuración del servidor de desarrollo
    └── src/
        ├── config/
        │   └── env.js            # CONTROL DE ENTORNO (USE_LOCAL: true/false)
        ├── data/
        │   └── terminosAnfp.js   # 8 Cláusulas íntegras de Términos y Condiciones ANFP
        ├── services/
        │   └── api.js            # Cliente HTTP con inyección automática de Bearer JWT
        ├── componente/           # COMPONENTES REUTILIZABLES COMPARTIDOS
        │   ├── Navbar.jsx        # Barra superior con selector de roles y logout
        │   ├── Header.jsx        # Banner publicitario y explicativo del RNH
        │   ├── Footer.jsx        # Canales legales, DPO ANFP y marco normativo
        │   ├── TermsModal.jsx    # Lector interactivo de las 8 cláusulas legales
        │   ├── BiometricCamera.jsx   # Cámara HTML5 + Detección de Prueba de Vida
        │   ├── FingerprintCapture.jsx# Captura de Huella con estándar WebAuthn FIDO2
        │   └── GoogleAuthButton.jsx  # Botón oficial de inicio de sesión con Google
        └── rol/                  # VISTAS SEPARADAS POR ROL
            ├── SuperAdministrador.jsx# Panel Global Multi-Tenant (idéntico a la captura)
            ├── Administrador.jsx     # Panel de Recinto / Estadio (gestión de usuarios y torniquetes)
            └── Usuario.jsx           # Portal del Hincha (credencial digital y derechos ARCO)
```

---

## 2. Dependencias NPM Instaladas (`frontend/package.json`)

Para implementar todas las funcionalidades requeridas, se instalaron y configuraron los siguientes paquetes:

1. **`@react-oauth/google`**:
   * **Para qué se usa:** Integra el SDK oficial de Google Identity Services en React.
   * Permite renderizar el botón oficial "Continuar con Google" y recibir el `id_token` firmado por Google para enviarlo al backend Quarkus.
2. **`lucide-react`**:
   * **Para qué se usa:** Iconos profesionales vectoriales para toda la interfaz (escudos de seguridad, escáner facial, huellas, candados, edificios, etc.).
3. **`@tailwindcss/vite` & `tailwindcss` (v4)**:
   * **Para qué se usa:** Motor moderno de estilos CSS que reproduce exactamente el diseño limpio del panel administrativo y la landing institucional.
4. **Cámara y Biometría Facial (Nativa sin paquetes pesados):**
   * Se utiliza la API oficial de HTML5 `navigator.mediaDevices.getUserMedia` en el componente `BiometricCamera.jsx`. Esto permite acceder a la cámara frontal del hincha en computadores, tablets y celulares sin forzar la instalación de apps nativas.
5. **Huella Digital (Nativa con W3C WebAuthn):**
   * Se utiliza la API oficial `navigator.credentials.create` (estándar FIDO2/WebAuthn) en `FingerprintCapture.jsx`. Esto se conecta directamente al lector de huellas biométrico del dispositivo (TouchID en Mac/iOS, Windows Hello en PC, lector de huella en Android o llaves de seguridad USB).

---

## 3. ¿Cómo se Capturan y Guardan el Rostro y la Huella en la Base de Datos?

### Biometría Facial (Zero-Retention):
1. **Captura:** La cámara web o del celular toma el rostro del usuario dentro del óvalo guía.
2. **Prueba de Vida (Liveness):** El sistema exige un gesto en vivo (parpadeo o centrado) para impedir fotos impresas o pantallas de celular.
3. **Vector Matemático:** Se extrae un vector numérico (descriptores faciales).
4. **Cifrado en Reposo:** En PostgreSQL **NUNCA se guardan fotografías en crudo** (cumpliendo estrictamente la política Zero-Retention y el artículo 2.g de la Ley N° 19.628). Únicamente se guarda el vector matemático cifrado con **AES-256-GCM** y una referencia de token única en la tabla `hinchas`.

### Huella Digital (FIDO2 / WebAuthn):
1. **Captura:** El usuario toca su lector de huella físico (TouchID, sensor de laptop o lector USB).
2. **Token Criptográfico:** El hardware biométrico genera una clave pública (`publicKey`) y un identificador único de credencial (`credentialId`).
3. **Almacenamiento Seguro:** En la tabla `huellas_biometricas` se almacena la clave pública cifrada con **AES-256-GCM** y un hash **HMAC-SHA256** para auditoría.

---

## 4. Configuración Paso a Paso en Google Cloud Console

Para activar la verificación real con Google OAuth 2.0:

### Paso 1: Crear el proyecto y las credenciales
1. Entra a [Google Cloud Console](https://console.cloud.google.com/).
2. Haz clic en el selector de proyectos (arriba a la izquierda) y presiona **"Nuevo proyecto"** (nombre sugerido: `Registro Nacional de Hinchas`).
3. Ve a **APIs y servicios > Pantalla de consentimiento de OAuth**.
4. Selecciona **Externo** y presiona **Crear**.
5. Llena los campos obligatorios:
   * **Nombre de la app:** `Registro Nacional de Hinchas (RNH)`
   * **Correo de soporte:** tu correo
   * **Correo de contacto del desarrollador:** tu correo
6. Guarda y continúa hasta finalizar.

### Paso 2: Crear el ID de cliente de OAuth
1. En el menú de la izquierda, entra a **Credenciales**.
2. Haz clic arriba en **+ Crear credenciales > ID de cliente de OAuth**.
3. En **Tipo de aplicación**, selecciona **Aplicación web**.
4. Llena exactamente las siguientes URLs:

#### **Orígenes de JavaScript autorizados:**
* Para pruebas locales:
  * `http://localhost:3005`
* Para producción:
  * `https://hinchas.yanitia.com`
  * `https://www.hinchas.yanitia.com`

#### **URIs de redirección autorizados:**
* Para pruebas locales:
  * `http://localhost:3005`
  * `http://localhost:3005/auth/google/callback`
  * `http://localhost:9995/api/auth/google`
* Para producción:
  * `https://hinchas.yanitia.com`
  * `https://hinchas.yanitia.com/auth/google/callback`
  * `https://www.hinchas.yanitia.com`
  * `https://www.hinchas.yanitia.com/auth/google/callback`

### Paso 3: Pegar el Client ID en el proyecto
Se han creado y preconfigurado los archivos `.env` tanto en el Frontend como en el Backend con tu Secreto de Cliente:
* **Frontend:** `frontend/.env` (propiedad `VITE_GOOGLE_CLIENT_SECRET=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`)
* **Backend:** `backend/.env` y `application.properties` (propiedad `rnh.google.oauth.client-secret`)

Solo debes pegar tu **ID de cliente** (termina en `.apps.googleusercontent.com`) en:
* `frontend/.env` en `VITE_GOOGLE_CLIENT_ID`
* `backend/.env` en `GOOGLE_CLIENT_ID`

---

## 4.1 ¿Qué son los Derechos ARCO? (Ley N° 19.628 de Chile)

En la pantalla del Hincha se incluye la pestaña oficial de **Derechos ARCO**, requerida por la normativa de protección de datos personales de Chile:

* **A - Acceso (Art. 12 Ley N° 19.628):** El hincha tiene derecho a solicitar y conocer qué datos personales y biométricos suyos mantiene la ANFP y los estadios (ej. saber qué fotos, huellas cifradas, RUT o asistencias están registradas).
* **R - Rectificación:** Modificar cualquier dato que esté erróneo, incompleto o desactualizado (ej. corrección de teléfono, apellido o documento).
* **C - Cancelación / Supresión:** Solicitar la eliminación o borrado definitivo de sus datos de la base de datos si ya no desea formar parte del Registro Nacional de Hinchas.
* **O - Oposición:** Oponerse a que sus datos se utilicen para fines secundarios distintos a la seguridad en estadios (ej. impedir que se cedan datos para publicidad o mercadeo de clubes).

---

## 4.2 Múltiples Huellas Digitales por Hincha

El sistema **no limita al usuario a una sola huella**:
* La tabla `huellas_biometricas` mantiene una relación 1 a N (`hincha_id` -> múltiples registros).
* En su portal privado, el hincha puede pulsar **`+ Enrolar Otro Dedo`** y agregar huellas de repuesto (Índice Derecho, Índice Izquierdo, Pulgar Derecho, etc.).
* Esto garantiza que si el hincha sufre una herida, corte o vendaje en una mano, pueda pasar por los torniquetes biométricos del estadio con cualquiera de sus otros dedos enrolados.

---

## 5. Archivo de Cambio Local vs Producción (`frontend/src/config/env.js`)

En el frontend tienes el archivo centralizado [`frontend/src/config/env.js`](file:///home/gabriel/proyectos/chile/registro_nacional/frontend/src/config/env.js):

* **En tu máquina local:**
  ```javascript
  export const USE_LOCAL = true;
  ```
  *Rutas automáticas:*
  * Frontend: `http://localhost:3005`
  * Backend API: `http://localhost:9995`

* **Cuando lo subas al servidor (Producción):**
  Solo cambias esa línea a:
  ```javascript
  export const USE_LOCAL = false;
  ```
  *Rutas automáticas de Producción:*
  * Frontend Oficial: `https://hinchas.yanitia.com` y `https://www.hinchas.yanitia.com`
  * Backend API: `https://hinchas.yanitia.com/api`
  * WebAuthn / Biometría RP: `hinchas.yanitia.com`

---

## 6. Base de Datos Multi-Tenant en una Sola DB (`backend/database_schema.sql`)

El script crea las siguientes tablas con llaves foráneas (`FOREIGN KEY`) y aislamiento lógico:

1. `tenants`: Cada empresa o estadio (ej. Estadio Municipal Ester Roa, Estadio Nacional, etc.) con su código único, cupo máximo de usuarios y módulos contratados.
2. `usuarios`: Cada usuario tiene su `tenant_id`. La contraseña está hasheada con **PBKDF2-HMAC-SHA256 (65,536 iteraciones)** y el RUT está cifrado con **AES-256-GCM**.
3. `hinchas`: Registro del asistente vinculado al usuario y al tenant, con su vector biométrico cifrado y resultado de prueba de vida.
4. `huellas_biometricas`: Credenciales FIDO2 públicas asociadas a cada hincha.
5. `consentimientos_legales`: Auditoría inmutable de aceptación de términos y uso biométrico (Ley N° 19.628).
6. `prohibiciones_ingreso`: Derecho de admisión bajo la Ley N° 19.327 con búsqueda instantánea mediante Blind Index (**HMAC-SHA256**).
7. `accesos_log`: Bitácora inmutable de eventos de acceso en torniquetes y validaciones de compra de entradas.
8. `solicitudes_arco`: Gestión formal de derechos ARCO ante el DPO de la ANFP.

---

## 7. Usuarios y Credenciales del Sistema

| Rol | Correo | Contraseña | Alcance |
| :--- | :--- | :--- | :--- |
| **Super Administrador Global** | `yanezgabriel787@gmail.com` | `1234` | Panel global idéntico a la foto: crea y administra tenants, módulos, límites y usuarios globales. |
| **Administrador de Tenant** | `admin@estadiomunicipal.cl` | `1234` | Panel exclusivo del Estadio Municipal: solo administra los usuarios, operadores y torniquetes de su recinto. |
| **Hincha / Usuario Normal** | `hincha@estadiomunicipal.cl` | `1234` | Portal del hincha: credencial digital RNH, registro de huella y solicitudes ARCO. |

---

## 8. Cómo Iniciar Todo el Sistema

En la raíz del proyecto ejecuta el script unificado:
```bash
cd /home/gabriel/proyectos/chile/registro_nacional
./iniciar_sistema.sh
```

El script verificará PostgreSQL, iniciará el backend Quarkus en el puerto `9999` y levantará el frontend Vite en `http://localhost:5173`.
