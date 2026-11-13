import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Plus,
  Building2,
  Users,
  CheckCircle2,
  X,
  Edit3,
  Trash2,
  Layers,
  ShieldAlert,
  Activity,
  Fingerprint,
  IdCard,
} from 'lucide-react';
import { apiFetch } from '../services/api';

export default function SuperAdministrador() {
  const [dashboard, setDashboard] = useState({
    kpis: {
      totalTenants: 0,
      tenantsActivos: 0,
      totalUsuarios: 0,
      usuariosActivos: 0,
      usuariosVisibles: 0,
      filtroActual: 'TODOS',
    },
    tenants: [],
    usuarios: [],
    logsRecientes: [],
    prohibiciones: [],
  });
  const [filtroTenantId, setFiltroTenantId] = useState('TODOS');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal Crear / Editar Tenant
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [tenantForm, setTenantForm] = useState({
    nombre: '',
    codigo: '',
    rutEmpresa: '',
    tipoEntidad: 'ESTADIO_MUNICIPAL',
    estado: 'ACTIVE',
    maxUsuarios: 10,
    modulosActivos: 'BIOMETRIA_FACIAL,HUELLA_DIGITAL,DERECHO_ADMISION,TICKETERA,AUDITORIA',
    adminNombre: '',
    adminEmail: '',
    adminPassword: '',
  });

  // Modal Módulos de un Tenant
  const [modulesModalTenant, setModulesModalTenant] = useState(null);

  // Modal Crear / Editar Usuario
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    tenantId: '',
    nombreCompleto: '',
    email: '',
    password: '',
    rol: 'ADMIN_TENANT',
    estado: 'ACTIVE',
    rut: '',
    telefono: '',
  });

  // Estado Enrolamiento Biométrico y Búsqueda
  const [buscarRutHincha, setBuscarRutHincha] = useState('');
  const [hinchaEncontrado, setHinchaEncontrado] = useState(null);
  const [enrolandoHuella, setEnrolandoHuella] = useState(false);
  const [dedoSlot1, setDedoSlot1] = useState('INDICE_DERECHO');
  const [dedoSlot2, setDedoSlot2] = useState('PULGAR_DERECHO');

  const cargarDashboard = async (tenantFilter = filtroTenantId) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const query =
        tenantFilter && tenantFilter !== 'TODOS'
          ? `?tenantId=${encodeURIComponent(tenantFilter)}`
          : '';
      const data = await apiFetch(`/api/superadmin/dashboard${query}`);
      setDashboard(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDashboard(filtroTenantId);
  }, [filtroTenantId]);

  const openNewTenantModal = () => {
    setEditingTenant(null);
    setTenantForm({
      nombre: '',
      codigo: '',
      rutEmpresa: '',
      tipoEntidad: 'ESTADIO_MUNICIPAL',
      estado: 'ACTIVE',
      maxUsuarios: 10,
      modulosActivos: 'BIOMETRIA_FACIAL,HUELLA_DIGITAL,DERECHO_ADMISION,TICKETERA,AUDITORIA',
      adminNombre: '',
      adminEmail: '',
      adminPassword: '',
    });
    setShowTenantModal(true);
  };

  const openEditTenantModal = (t) => {
    setEditingTenant(t);
    setTenantForm({
      nombre: t.nombre,
      codigo: t.codigo,
      rutEmpresa: t.rutEmpresa || '',
      tipoEntidad: t.tipoEntidad || 'ESTADIO_MUNICIPAL',
      estado: t.estado || 'ACTIVE',
      maxUsuarios: t.maxUsuarios || 10,
      modulosActivos:
        t.modulosActivos || 'BIOMETRIA_FACIAL,HUELLA_DIGITAL,DERECHO_ADMISION,TICKETERA,AUDITORIA',
      adminNombre: '',
      adminEmail: '',
      adminPassword: '',
    });
    setShowTenantModal(true);
  };

  const handleSaveTenant = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (editingTenant) {
        await apiFetch(`/api/superadmin/tenants/${editingTenant.id}`, {
          method: 'PUT',
          body: JSON.stringify(tenantForm),
        });
        setSuccessMsg(`Tenant "${tenantForm.nombre}" actualizado correctamente.`);
      } else {
        await apiFetch('/api/superadmin/tenants', {
          method: 'POST',
          body: JSON.stringify(tenantForm),
        });
        setSuccessMsg(
          `Tenant "${tenantForm.nombre}" creado con éxito en la base de datos Multi-Tenant.`
        );
      }
      setShowTenantModal(false);
      cargarDashboard(filtroTenantId);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteTenant = async (t) => {
    if (
      !window.confirm(
        `¿Seguro que deseas eliminar el Tenant "${t.nombre}" (${t.codigo}) y todos sus registros asociados?`
      )
    )
      return;
    try {
      await apiFetch(`/api/superadmin/tenants/${t.id}`, { method: 'DELETE' });
      setSuccessMsg(`Tenant "${t.nombre}" eliminado.`);
      if (filtroTenantId === t.id) setFiltroTenantId('TODOS');
      else cargarDashboard(filtroTenantId);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const openNewUserModal = (defaultTenantId = '') => {
    setEditingUser(null);
    const firstTenant =
      defaultTenantId ||
      (filtroTenantId !== 'TODOS' ? filtroTenantId : dashboard.tenants[0]?.id || '');
    setUserForm({
      tenantId: firstTenant,
      nombreCompleto: '',
      email: '',
      password: '',
      rol: 'ADMIN_TENANT',
      estado: 'ACTIVE',
      rut: '',
      telefono: '',
    });
    setShowUserModal(true);
  };

  const openEditUserModal = (u) => {
    setEditingUser(u);
    setUserForm({
      tenantId: u.tenantId || dashboard.tenants[0]?.id || '',
      nombreCompleto: u.nombreCompleto || '',
      email: u.email || '',
      password: '',
      rol: u.rol || 'USUARIO',
      estado: u.estado || 'ACTIVE',
      rut: u.rutDecrypted || '',
      telefono: u.telefonoDecrypted || '',
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (editingUser) {
        await apiFetch(`/api/superadmin/users/${editingUser.id}`, {
          method: 'PUT',
          body: JSON.stringify(userForm),
        });
        setSuccessMsg(`Usuario "${userForm.email}" actualizado.`);
      } else {
        await apiFetch('/api/superadmin/users', {
          method: 'POST',
          body: JSON.stringify(userForm),
        });
        setSuccessMsg(
          `Usuario "${userForm.email}" creado con contraseña cifrada (PBKDF2-HMAC-SHA256).`
        );
      }
      setShowUserModal(false);
      cargarDashboard(filtroTenantId);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`¿Eliminar al usuario "${u.nombreCompleto}" (${u.email})?`)) return;
    try {
      await apiFetch(`/api/superadmin/users/${u.id}`, { method: 'DELETE' });
      setSuccessMsg(`Usuario "${u.email}" eliminado.`);
      cargarDashboard(filtroTenantId);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleBuscarHincha = async (rutABuscar, limpiarMensajes = true) => {
    const rut = typeof rutABuscar === 'string' ? rutABuscar : buscarRutHincha;
    if (!rut) return;
    if (limpiarMensajes) {
      setErrorMsg('');
      setSuccessMsg('');
    }
    try {
      const resp = await apiFetch(`/api/tenant/hinchas/buscar?rut=${encodeURIComponent(rut.trim())}`);
      setHinchaEncontrado(resp);
      const primeraHuella = resp?.huellas?.[0];
      if (primeraHuella && primeraHuella.dedoIndice === 'PULGAR_DERECHO') {
        setDedoSlot2('INDICE_DERECHO');
      }
    } catch (err) {
      if (limpiarMensajes) setSuccessMsg('');
      setErrorMsg(err.message || 'No se encontró hincha con ese RUT.');
      setHinchaEncontrado(null);
    }
  };

  const handleEnrolarHuellaAfis = async (e, dedoParam = 'INDICE_DERECHO') => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!hinchaEncontrado?.hincha) {
      setSuccessMsg('');
      return setErrorMsg('Primero busca un hincha por RUT para enrolarle la huella.');
    }
    const huellas = hinchaEncontrado.huellas || [];
    if (huellas.length >= 2) {
      setSuccessMsg('');
      return setErrorMsg('El hincha ya tiene el límite máximo de 2 huellas enroladas. Elimina una de las huellas para registrar otra.');
    }
    setErrorMsg('');
    setSuccessMsg('');
    setEnrolandoHuella(true);
    try {
      const b64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.onerror = () => reject(new Error('No se pudo leer la imagen capturada por el lector biométrico.'));
        reader.readAsDataURL(file);
      });

      await apiFetch('/api/tenant/hinchas/enrolar-huella', {
        method: 'POST',
        body: JSON.stringify({
          rut: hinchaEncontrado.rutNormalizado,
          hinchaId: hinchaEncontrado.hincha.id,
          credentialId: `AFIS-${hinchaEncontrado.rutNormalizado}-${dedoParam}-${Date.now()}`,
          publicKey: b64,
          dispositivoTipo: 'Lector Físico AFIS / SuperAdmin Master',
          dedoIndice: dedoParam,
        }),
      });

      setSuccessMsg(`¡Huella biométrica AFIS (${dedoParam}) extraída y guardada con éxito para ${hinchaEncontrado.hincha.nombres}!`);
      await handleBuscarHincha(hinchaEncontrado.rutNormalizado, false);
    } catch (err) {
      setSuccessMsg('');
      setErrorMsg(err.message || 'Error procesando las minucias biométricas de la huella.');
    } finally {
      setEnrolandoHuella(false);
    }
  };

  const handleEnrolarHuella = async (dedoParam = 'INDICE_DERECHO') => {
    if (!hinchaEncontrado?.hincha) {
      setSuccessMsg('');
      return setErrorMsg('Primero busca un hincha por RUT para enrolarle la huella.');
    }
    const huellas = hinchaEncontrado.huellas || [];
    if (huellas.length >= 2) {
      setSuccessMsg('');
      return setErrorMsg('El hincha ya tiene el límite máximo de 2 huellas enroladas. Elimina una de las huellas para registrar otra.');
    }
    setErrorMsg('');
    setSuccessMsg('');
    setEnrolandoHuella(true);
    try {
      if (!window.PublicKeyCredential || !navigator.credentials?.create) {
        throw new Error('Este dispositivo no cuenta con sensor biométrico nativo compatible.');
      }

      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const userId = crypto.getRandomValues(new Uint8Array(16));
      const cred = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'Registro Nacional de Hinchas ANFP', id: window.location.hostname },
          user: {
            id: userId,
            name: `${hinchaEncontrado.rutNormalizado}-${dedoParam}`,
            displayName: `${hinchaEncontrado.hincha.nombres} (${dedoParam})`.trim(),
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },
            { alg: -257, type: 'public-key' },
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            residentKey: 'discouraged',
            requireResidentKey: false,
            userVerification: 'preferred',
          },
          timeout: 60000,
        },
      });

      if (!cred) throw new Error('Lectura biométrica cancelada.');

      const aBase64 = (buf) =>
        btoa(String.fromCharCode(...new Uint8Array(buf)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

      const credId = cred.id || aBase64(cred.rawId);
      const pubKey = cred.response?.attestationObject
        ? aBase64(cred.response.attestationObject)
        : `FIDO2_PUBKEY_${Date.now()}`;

      await apiFetch('/api/tenant/hinchas/enrolar-huella', {
        method: 'POST',
        body: JSON.stringify({
          rut: hinchaEncontrado.rutNormalizado,
          hinchaId: hinchaEncontrado.hincha.id,
          credentialId: `FIDO2-${credId.substring(0, 30)}`,
          publicKey: pubKey,
          dispositivoTipo: 'Sensor Biométrico FIDO2 / SuperAdmin Master',
          dedoIndice: dedoParam,
        }),
      });

      setSuccessMsg(`¡Huella biométrica (${dedoParam}) enrolada exitosamente para ${hinchaEncontrado.hincha.nombres}!`);
      await handleBuscarHincha(hinchaEncontrado.rutNormalizado, false);
    } catch (err) {
      setSuccessMsg('');
      const rawMsg = err?.message || '';
      if (err?.name === 'NotAllowedError' || rawMsg.toLowerCase().includes('timed out') || rawMsg.toLowerCase().includes('not allowed')) {
        setErrorMsg('El navegador canceló o expiró la lectura nativa (WebAuthn). Recuerda que en Linux/PC sin lector USB integrado o al cancelar el prompt, debes usar "Lector Físico / AFIS".');
      } else {
        setErrorMsg(rawMsg || 'Error al capturar la huella biométrica.');
      }
    } finally {
      setEnrolandoHuella(false);
    }
  };

  const handleEliminarHuella = async (huellaId, etiquetaHuella) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la ${etiquetaHuella}? El hincha no podrá ingresar usando este dedo.`)) {
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await apiFetch(`/api/tenant/hinchas/huellas/${huellaId}`, {
        method: 'DELETE',
      });
      setSuccessMsg(`¡${etiquetaHuella} eliminada con éxito!`);
      await handleBuscarHincha(hinchaEncontrado.rutNormalizado, false);
    } catch (err) {
      setSuccessMsg('');
      setErrorMsg(err.message || 'Error al eliminar la huella.');
    }
  };

  const getTenantFiltroNombre = () => {
    if (filtroTenantId === 'TODOS') return 'TODOS';
    const found = dashboard.tenants.find((t) => t.id === filtroTenantId);
    return found ? found.codigo.toUpperCase() : 'TODOS';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Bar matching Screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Panel de Administración Global (SuperAdmin)
          </h1>
          <p className="text-sm text-slate-500">
            Bienvenido al panel de administración global Multi-Tenant del Registro Nacional de Hinchas.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => cargarDashboard(filtroTenantId)}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={openNewTenantModal}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow transition"
          >
            <Plus className="w-4 h-4" />
            Nuevo tenant
          </button>
        </div>
      </div>

      {/* Feedback Alerts */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-red-600 font-bold">
            ✕
          </button>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {successMsg}
          </span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* 4 KPI Cards matching the User's Screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Tenants</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {dashboard.kpis.totalTenants}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {dashboard.kpis.tenantsActivos} activos
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Usuarios</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {dashboard.kpis.totalUsuarios}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {dashboard.kpis.usuariosActivos} activos
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Usuarios visibles</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {dashboard.kpis.usuariosVisibles}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {filtroTenantId === 'TODOS' ? 'Todos' : 'Filtrados por Tenant'}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Filtro tenant</span>
            {filtroTenantId !== 'TODOS' && (
              <button
                onClick={() => setFiltroTenantId('TODOS')}
                className="text-[11px] text-blue-600 hover:underline font-semibold"
              >
                Ver Todos
              </button>
            )}
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2 truncate">
            {getTenantFiltroNombre()}
          </div>
          <div className="text-xs text-slate-400 mt-1">Actual</div>
        </div>
      </div>

      {/* SECCIÓN BIOMÉTRICA CENTRAL: BÚSQUEDA POR RUT, VERIFICACIÓN DE CÉDULA Y ENROLAMIENTO DE HUELLA */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-purple-600" />
              Módulo de Enrolamiento y Cotejo de Cédula (DNI) / Huella Digital
            </h2>
            <p className="text-xs text-slate-500">
              Consulta la ficha biométrica de cualquier hincha, revisa su cédula de identidad y enciende el sensor biométrico del dispositivo para enrolar su huella.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={buscarRutHincha}
              onChange={(e) => setBuscarRutHincha(e.target.value)}
              placeholder="RUT del hincha (ej: 18.543.210-K)"
              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono w-48 sm:w-56"
            />
            <button
              onClick={() => handleBuscarHincha()}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow transition"
            >
              Consultar
            </button>
          </div>
        </div>

        {hinchaEncontrado ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Nombre del Hincha:</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  {hinchaEncontrado.hincha?.nombres} {hinchaEncontrado.hincha?.apellidos}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">RUT / Documento:</span>
                <span className="font-extrabold font-mono text-purple-800 text-sm">
                  {hinchaEncontrado.rutEnmascarado} ({hinchaEncontrado.rutNormalizado})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Huellas Enroladas:</span>
                <span className="inline-flex items-center gap-1 font-bold text-purple-700">
                  <Fingerprint className="w-3.5 h-3.5" />
                  {hinchaEncontrado.huellas?.length || 0} credencial(es) activa(s)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
                <span className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
                  <IdCard className="w-4 h-4 text-blue-600" />
                  Foto Cédula de Identidad (DNI):
                </span>
                {hinchaEncontrado.fotoDocumentoBase64 ? (
                  <img
                    src={hinchaEncontrado.fotoDocumentoBase64}
                    alt="Cédula"
                    className="w-full h-36 object-contain rounded-lg border border-slate-200 bg-slate-900"
                  />
                ) : (
                  <div className="w-full h-36 rounded-lg bg-slate-100 border border-dashed border-slate-300 grid place-items-center text-xs text-slate-400">
                    Sin foto física de cédula registrada
                  </div>
                )}
              </div>

              <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
                <span className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  Selfie Facial Registrada:
                </span>
                {hinchaEncontrado.fotoRostroBase64 ? (
                  <img
                    src={hinchaEncontrado.fotoRostroBase64}
                    alt="Rostro"
                    className="w-full h-36 object-contain rounded-lg border border-slate-200 bg-slate-900 -scale-x-100"
                  />
                ) : (
                  <div className="w-full h-36 rounded-lg bg-slate-100 border border-dashed border-slate-300 grid place-items-center text-xs text-slate-400">
                    Sin selfie registrada
                  </div>
                )}
              </div>
            </div>

            {/* Sección de 2 Huellas Biométricas (Límite Máximo: 2) */}
            <div className="pt-3 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-200/70 pb-3">
                <div>
                  <h4 className="font-extrabold text-sm text-purple-950 flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-purple-700" />
                    Enrolamiento de Huellas Biométricas (Máx. 2)
                  </h4>
                  <p className="text-xs text-purple-800">
                    Permite registrar hasta 2 huellas por RUT (Dedo Principal y Dedo de Respaldo).
                  </p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold self-start sm:self-auto ${
                  (hinchaEncontrado.huellas?.length || 0) >= 2
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-purple-100 text-purple-900'
                }`}>
                  {hinchaEncontrado.huellas?.length || 0} / 2 huellas
                </span>
              </div>

              {/* Grid 2 Slots */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* SLOT 1 */}
                <div className="bg-purple-50/60 rounded-xl p-3.5 border border-purple-200 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">Huella 1 (Principal)</span>
                      {hinchaEncontrado.huellas?.[0] ? (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ENROLADA
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          DISPONIBLE
                        </span>
                      )}
                    </div>

                    {hinchaEncontrado.huellas?.[0] ? (
                      <div className="mt-2 space-y-0.5">
                        <p className="text-xs font-extrabold text-slate-900">
                          {hinchaEncontrado.huellas[0].dedoIndice?.replace('_', ' ') || 'Dedo Principal'}
                        </p>
                        <p className="text-[10px] font-mono text-slate-500 truncate" title={hinchaEncontrado.huellas[0].credentialId}>
                          ID: {hinchaEncontrado.huellas[0].credentialId}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-2 space-y-1">
                        <label className="text-[11px] font-semibold text-slate-700 block">Dedo a registrar:</label>
                        <select
                          value={dedoSlot1}
                          onChange={(e) => setDedoSlot1(e.target.value)}
                          className="w-full text-xs border border-slate-300 rounded-lg p-1.5 bg-white"
                        >
                          <option value="INDICE_DERECHO">Índice Derecho (Recomendado)</option>
                          <option value="PULGAR_DERECHO">Pulgar Derecho</option>
                          <option value="INDICE_IZQUIERDO">Índice Izquierdo</option>
                          <option value="PULGAR_IZQUIERDO">Pulgar Izquierdo</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="pt-1 space-y-1.5">
                    {hinchaEncontrado.huellas?.[0] ? (
                      <button
                        type="button"
                        onClick={() => handleEliminarHuella(hinchaEncontrado.huellas[0].id, 'Huella 1')}
                        className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-lg flex items-center justify-center gap-1 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                        Eliminar Huella 1
                      </button>
                    ) : (
                      <>
                        <label className={`w-full py-2 px-2 bg-purple-700 hover:bg-purple-800 ${enrolandoHuella ? 'opacity-60 pointer-events-none' : 'cursor-pointer'} text-white font-bold text-xs rounded-lg shadow flex items-center justify-center gap-1.5 transition`}>
                          <Fingerprint className={`w-3.5 h-3.5 ${enrolandoHuella ? 'animate-pulse' : ''}`} />
                          {enrolandoHuella ? 'Extrayendo…' : 'Lector Físico / AFIS (Huella 1)'}
                          <input
                            type="file"
                            accept="image/*,.bmp,.wsq,.bin"
                            disabled={enrolandoHuella}
                            onChange={(e) => handleEnrolarHuellaAfis(e, dedoSlot1)}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          disabled={enrolandoHuella}
                          onClick={() => handleEnrolarHuella(dedoSlot1)}
                          className="w-full py-1.5 bg-white hover:bg-purple-50 disabled:opacity-50 text-purple-700 border border-purple-300 font-bold text-[11px] rounded-lg flex items-center justify-center gap-1.5 transition"
                        >
                          <Fingerprint className="w-3 h-3" />
                          Sensor Nativo (WebAuthn)
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* SLOT 2 */}
                <div className="bg-purple-50/60 rounded-xl p-3.5 border border-purple-200 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">Huella 2 (Respaldo)</span>
                      {hinchaEncontrado.huellas?.[1] ? (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ENROLADA
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          DISPONIBLE
                        </span>
                      )}
                    </div>

                    {hinchaEncontrado.huellas?.[1] ? (
                      <div className="mt-2 space-y-0.5">
                        <p className="text-xs font-extrabold text-slate-900">
                          {hinchaEncontrado.huellas[1].dedoIndice?.replace('_', ' ') || 'Dedo Respaldo'}
                        </p>
                        <p className="text-[10px] font-mono text-slate-500 truncate" title={hinchaEncontrado.huellas[1].credentialId}>
                          ID: {hinchaEncontrado.huellas[1].credentialId}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-2 space-y-1">
                        <label className="text-[11px] font-semibold text-slate-700 block">Dedo a registrar:</label>
                        <select
                          value={dedoSlot2}
                          onChange={(e) => setDedoSlot2(e.target.value)}
                          className="w-full text-xs border border-slate-300 rounded-lg p-1.5 bg-white"
                        >
                          <option value="PULGAR_DERECHO">Pulgar Derecho (Recomendado)</option>
                          <option value="INDICE_IZQUIERDO">Índice Izquierdo</option>
                          <option value="PULGAR_IZQUIERDO">Pulgar Izquierdo</option>
                          <option value="INDICE_DERECHO">Índice Derecho</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="pt-1 space-y-1.5">
                    {hinchaEncontrado.huellas?.[1] ? (
                      <button
                        type="button"
                        onClick={() => handleEliminarHuella(hinchaEncontrado.huellas[1].id, 'Huella 2')}
                        className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-lg flex items-center justify-center gap-1 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                        Eliminar Huella 2
                      </button>
                    ) : (
                      <>
                        <label className={`w-full py-2 px-2 bg-purple-700 hover:bg-purple-800 ${enrolandoHuella ? 'opacity-60 pointer-events-none' : 'cursor-pointer'} text-white font-bold text-xs rounded-lg shadow flex items-center justify-center gap-1.5 transition`}>
                          <Fingerprint className={`w-3.5 h-3.5 ${enrolandoHuella ? 'animate-pulse' : ''}`} />
                          {enrolandoHuella ? 'Extrayendo…' : 'Lector Físico / AFIS (Huella 2)'}
                          <input
                            type="file"
                            accept="image/*,.bmp,.wsq,.bin"
                            disabled={enrolandoHuella}
                            onChange={(e) => handleEnrolarHuellaAfis(e, dedoSlot2)}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          disabled={enrolandoHuella}
                          onClick={() => handleEnrolarHuella(dedoSlot2)}
                          className="w-full py-1.5 bg-white hover:bg-purple-50 disabled:opacity-50 text-purple-700 border border-purple-300 font-bold text-[11px] rounded-lg flex items-center justify-center gap-1.5 transition"
                        >
                          <Fingerprint className="w-3 h-3" />
                          Sensor Nativo (WebAuthn)
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* TENANTS TABLE SECTION (Matching Screenshot) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Tenants</h2>
            <p className="text-xs text-slate-500">
              Empresas, estadios municipales, clubes y módulos contratados (aislamiento en una sola DB).
            </p>
          </div>
          <button
            onClick={openNewTenantModal}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Crear tenant
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                <th className="py-3.5 px-6">EMPRESA / ESTADIO</th>
                <th className="py-3.5 px-4">CÓDIGO</th>
                <th className="py-3.5 px-4">ESTADO</th>
                <th className="py-3.5 px-4">USUARIOS</th>
                <th className="py-3.5 px-4">CAPACIDAD</th>
                <th className="py-3.5 px-4">STORAGE</th>
                <th className="py-3.5 px-6">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {dashboard.tenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-900">{t.nombre}</div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">{t.id}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs font-bold border border-slate-200">
                      {t.codigo}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        t.estado === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          t.estado === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                      {t.estado}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-bold text-slate-900">{t.usuariosActuales}</td>
                  <td className="py-4 px-4 text-xs text-slate-600 font-semibold">
                    {t.usuariosActuales} / {t.maxUsuarios}
                  </td>
                  <td className="py-4 px-4 text-xs text-slate-500">
                    {Number(t.storageUsadoMb || 0).toFixed(2)} MB
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => setModulesModalTenant(t)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
                      >
                        Módulos
                      </button>
                      <button
                        onClick={() =>
                          setFiltroTenantId(filtroTenantId === t.id ? 'TODOS' : t.id)
                        }
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition ${
                          filtroTenantId === t.id
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        Usuarios
                      </button>
                      <button
                        onClick={() => openEditTenantModal(t)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteTenant(t)}
                        className="px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50/50 hover:bg-red-100 text-xs font-semibold text-red-600 transition"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* USUARIOS TABLE SECTION (Matching Screenshot) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Usuarios</h2>
            <p className="text-xs text-slate-500">
              {filtroTenantId === 'TODOS'
                ? 'Todos los usuarios del sistema (claves protegidas con PBKDF2-HMAC-SHA256)'
                : `Mostrando usuarios del Tenant seleccionado (${getTenantFiltroNombre()})`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filtroTenantId}
              onChange={(e) => setFiltroTenantId(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50"
            >
              <option value="TODOS">Filtrar: TODOS LOS TENANTS</option>
              {dashboard.tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre} ({t.codigo})
                </option>
              ))}
            </select>
            <button
              onClick={() => openNewUserModal()}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Crear usuario
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                <th className="py-3.5 px-6">USUARIO</th>
                <th className="py-3.5 px-4">EMAIL</th>
                <th className="py-3.5 px-4">TENANT</th>
                <th className="py-3.5 px-4">ROL</th>
                <th className="py-3.5 px-4">ESTADO</th>
                <th className="py-3.5 px-6">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {dashboard.usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-900">{u.nombreCompleto}</div>
                    <div className="text-[11px] font-mono text-slate-400">
                      RUT: {u.rutDecrypted || 'No reg.'} • Clave: [HASH_PBKDF2_OCULTO]
                    </div>
                  </td>
                  <td className="py-4 px-4 text-xs font-medium text-slate-700">{u.email}</td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                      {u.tenantNombre || 'Global'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        u.rol === 'SUPER_ADMIN'
                          ? 'bg-indigo-100 text-indigo-800'
                          : u.rol === 'ADMIN_TENANT'
                          ? 'bg-blue-100 text-blue-800'
                          : u.rol === 'OPERADOR_ACCESO'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {u.rol}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        u.estado === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          u.estado === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                      />
                      {u.estado}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditUserModal(u)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Editar
                      </button>
                      {u.rol !== 'SUPER_ADMIN' && (
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50/50 hover:bg-red-100 text-xs font-semibold text-red-600 flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CREAR / EDITAR TENANT */}
      {showTenantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingTenant
                    ? `Editar Tenant: ${editingTenant.nombre}`
                    : 'Crear Nuevo Tenant (Estadio / Club / Empresa)'}
                </h3>
              </div>
              <button
                onClick={() => setShowTenantModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTenant} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nombre Empresa / Estadio *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Estadio Municipal de La Cisterna"
                    value={tenantForm.nombre}
                    onChange={(e) => setTenantForm({ ...tenantForm, nombre: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Código Único del Tenant *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: estadio-cisterna"
                    value={tenantForm.codigo}
                    onChange={(e) => setTenantForm({ ...tenantForm, codigo: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">RUT Entidad</label>
                  <input
                    type="text"
                    placeholder="69.120.300-1"
                    value={tenantForm.rutEmpresa}
                    onChange={(e) => setTenantForm({ ...tenantForm, rutEmpresa: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Capacidad Usuarios</label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={tenantForm.maxUsuarios}
                    onChange={(e) =>
                      setTenantForm({ ...tenantForm, maxUsuarios: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estado</label>
                  <select
                    value={tenantForm.estado}
                    onChange={(e) => setTenantForm({ ...tenantForm, estado: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>

              {!editingTenant && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="font-bold text-slate-800">
                    Administrador Inicial para este Tenant (Opcional)
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Este administrador podrá entrar a su propio panel y crear los usuarios y
                    operadores de su estadio sin ver los de otros tenants.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Nombre Admin"
                      value={tenantForm.adminNombre}
                      onChange={(e) =>
                        setTenantForm({ ...tenantForm, adminNombre: e.target.value })
                      }
                      className="rounded-xl border border-slate-300 px-3 py-2 bg-white"
                    />
                    <input
                      type="email"
                      placeholder="admin@estadio.cl"
                      value={tenantForm.adminEmail}
                      onChange={(e) =>
                        setTenantForm({ ...tenantForm, adminEmail: e.target.value })
                      }
                      className="rounded-xl border border-slate-300 px-3 py-2 bg-white"
                    />
                    <input
                      type="password"
                      placeholder="Contraseña inicial"
                      value={tenantForm.adminPassword}
                      onChange={(e) =>
                        setTenantForm({ ...tenantForm, adminPassword: e.target.value })
                      }
                      className="rounded-xl border border-slate-300 px-3 py-2 bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTenantModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold"
                >
                  {editingTenant ? 'Guardar Cambios' : 'Crear Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MÓDULOS DEL TENANT */}
      {modulesModalTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Módulos Contratados: {modulesModalTenant.nombre}
                </h3>
              </div>
              <button
                onClick={() => setModulesModalTenant(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              {(modulesModalTenant.modulosActivos || '').split(',').map((m) => (
                <div
                  key={m}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <span className="font-bold text-slate-800">{m.trim()}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    ACTIVO
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setModulesModalTenant(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR USUARIO */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario en Tenant'}
                </h3>
              </div>
              <button
                onClick={() => setShowUserModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tenant / Estadio Asignado *
                </label>
                <select
                  required
                  value={userForm.tenantId}
                  onChange={(e) => setUserForm({ ...userForm, tenantId: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                >
                  {dashboard.tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre} ({t.codigo}) - Capacidad: {t.usuariosActuales}/{t.maxUsuarios}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={userForm.nombreCompleto}
                    onChange={(e) =>
                      setUserForm({ ...userForm, nombreCompleto: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {editingUser ? 'Nueva Clave (opcional)' : 'Contraseña *'}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    placeholder="Se cifrará con PBKDF2"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rol en el Sistema *</label>
                  <select
                    value={userForm.rol}
                    onChange={(e) => setUserForm({ ...userForm, rol: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  >
                    <option value="ADMIN_TENANT">ADMIN_TENANT (Admin Estadio)</option>
                    <option value="OPERADOR_ACCESO">OPERADOR_ACCESO (Torniquete)</option>
                    <option value="USUARIO">USUARIO (Hincha)</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estado</label>
                  <select
                    value={userForm.estado}
                    onChange={(e) => setUserForm({ ...userForm, estado: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    RUT / Documento (Cifrado AES-256)
                  </label>
                  <input
                    type="text"
                    placeholder="18.543.210-K"
                    value={userForm.rut}
                    onChange={(e) => setUserForm({ ...userForm, rut: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Teléfono (Cifrado AES-256)
                  </label>
                  <input
                    type="text"
                    placeholder="+56912345678"
                    value={userForm.telefono}
                    onChange={(e) => setUserForm({ ...userForm, telefono: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold"
                >
                  {editingUser ? 'Actualizar Usuario' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
