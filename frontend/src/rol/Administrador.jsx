import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  ScanFace,
  ShieldAlert,
  Ticket,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Edit3,
  Trash2,
  Fingerprint,
  Activity,
  X,
} from 'lucide-react';
import { apiFetch } from '../services/api';
import BiometricCamera from '../componente/BiometricCamera';

export default function Administrador({ currentUser }) {
  const [activeTab, setActiveTab] = useState('usuarios');
  const [data, setData] = useState({
    tenant: null,
    usuarios: [],
    hinchasEnrolados: [],
    prohibiciones: [],
    accesosLog: [],
    solicitudesArco: [],
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal Crear / Editar Usuario del Tenant
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    nombreCompleto: '',
    email: '',
    password: '',
    rol: 'USUARIO',
    estado: 'ACTIVE',
    rut: '',
    telefono: '',
  });

  // Estado Terminal de Puerta Biométrico
  const [gateForm, setGateForm] = useState({
    documentoRut: '18.543.210-K',
    huellaCredentialId: '',
    modoVerificacion: 'CONTROL_PUERTA_FACIAL',
    puertaAcceso: 'Puerta Andes Norte - Torniquete Biométrico 01',
    capturaEnVivoBase64: '',
    descriptorCapturaJson: '',
  });
  const [gateResult, setGateResult] = useState(null);

  // Estado Ticketera
  const [ticketeraRut, setTicketeraRut] = useState('18.543.210-K');
  const [ticketeraResult, setTicketeraResult] = useState(null);

  // Estado Nueva Prohibición (Derecho de Admisión)
  const [prohibicionForm, setProhibicionForm] = useState({
    documentoRut: '',
    nombreReferencia: '',
    codigoCausal: 'LEY_19327_ART_10_DERECHO_ADMISION',
    motivo: '',
    alcance: 'NACIONAL',
  });

  const cargarDatosTenant = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const resp = await apiFetch('/api/tenant/dashboard');
      setData(resp);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatosTenant();
  }, []);

  const openNewUserModal = () => {
    setEditingUser(null);
    setUserForm({
      nombreCompleto: '',
      email: '',
      password: '',
      rol: 'USUARIO',
      estado: 'ACTIVE',
      rut: '',
      telefono: '',
    });
    setShowUserModal(true);
  };

  const openEditUserModal = (u) => {
    setEditingUser(u);
    setUserForm({
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
        await apiFetch(`/api/tenant/users/${editingUser.id}`, {
          method: 'PUT',
          body: JSON.stringify(userForm),
        });
        setSuccessMsg(`Usuario "${userForm.email}" actualizado en tu Tenant.`);
      } else {
        await apiFetch('/api/tenant/users', {
          method: 'POST',
          body: JSON.stringify(userForm),
        });
        setSuccessMsg(`Usuario "${userForm.email}" creado en tu recinto/estadio.`);
      }
      setShowUserModal(false);
      cargarDatosTenant();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`¿Eliminar al usuario "${u.nombreCompleto}" de este recinto?`)) return;
    try {
      await apiFetch(`/api/tenant/users/${u.id}`, { method: 'DELETE' });
      setSuccessMsg(`Usuario eliminado de tu Tenant.`);
      cargarDatosTenant();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleVerificarPuerta = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    try {
      const res = await apiFetch('/api/tenant/verificar-puerta', {
        method: 'POST',
        body: JSON.stringify(gateForm),
      });
      setGateResult(res);
      cargarDatosTenant();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleVerificarTicketera = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await apiFetch('/api/tenant/verificar-ticketera', {
        method: 'POST',
        body: JSON.stringify({ documentoRut: ticketeraRut }),
      });
      setTicketeraResult(res);
      cargarDatosTenant();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleCrearProhibicion = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await apiFetch('/api/tenant/prohibiciones', {
        method: 'POST',
        body: JSON.stringify(prohibicionForm),
      });
      setSuccessMsg('Prohibición de ingreso (Derecho de Admisión) registrada con Blind Index HMAC-SHA256.');
      setProhibicionForm({
        documentoRut: '',
        nombreReferencia: '',
        codigoCausal: 'LEY_19327_ART_10_DERECHO_ADMISION',
        motivo: '',
        alcance: 'NACIONAL',
      });
      cargarDatosTenant();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleLevantarProhibicion = async (id) => {
    try {
      await apiFetch(`/api/tenant/prohibiciones/${id}`, { method: 'DELETE' });
      setSuccessMsg('Prohibición levantada.');
      cargarDatosTenant();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header del Tenant */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            <Building2 className="w-3.5 h-3.5" />
            SEGMENTO DE BASE DE DATOS AISLADO POR TENANT
          </div>
          <h1 className="text-2xl font-extrabold">
            {data.tenant ? data.tenant.nombre : currentUser.tenantNombre || 'Panel de Recinto / Estadio'}
          </h1>
          <p className="text-xs text-slate-300">
            Código Tenant: <span className="font-mono font-bold text-blue-300">{data.tenant?.codigo}</span> •
            Administrador: <span className="font-semibold">{currentUser.nombreCompleto}</span> ({currentUser.email})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800 text-center">
            <div className="text-[11px] text-slate-400">Capacidad Usuarios</div>
            <div className="text-lg font-extrabold text-white">
              {data.usuarios.length} / {data.tenant?.maxUsuarios || 15}
            </div>
          </div>
          <div className="bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800 text-center">
            <div className="text-[11px] text-slate-400">Hinchas Enrolados</div>
            <div className="text-lg font-extrabold text-emerald-400">
              {data.hinchasEnrolados.length}
            </div>
          </div>
          <button
            onClick={cargarDatosTenant}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-xs font-semibold flex justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')}>✕</button>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-semibold flex justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')}>✕</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === 'usuarios'
              ? 'bg-slate-900 text-white shadow'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Usuarios de Mi Estadio ({data.usuarios.length})
        </button>

        <button
          onClick={() => setActiveTab('puerta')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === 'puerta'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ScanFace className="w-4 h-4" />
          Terminal Biométrico en Puerta (Rostro / Huella)
        </button>

        <button
          onClick={() => setActiveTab('ticketera')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === 'ticketera'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Ticket className="w-4 h-4" />
          Validador Compra de Entradas (Ticketera)
        </button>

        <button
          onClick={() => setActiveTab('prohibiciones')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === 'prohibiciones'
              ? 'bg-red-600 text-white shadow'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Derecho de Admisión (Ley N° 19.327)
        </button>

        <button
          onClick={() => setActiveTab('bitacora')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === 'bitacora'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          Bitácora de Accesos ({data.accesosLog.length})
        </button>
      </div>

      {/* TAB 1: GESTIÓN DE USUARIOS DEL TENANT */}
      {activeTab === 'usuarios' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Usuarios y Roles de {data.tenant?.nombre}
              </h2>
              <p className="text-xs text-slate-500">
                Crea administradores de tu estadio, operadores de torniquete o usuarios normales dentro de tu capacidad contratada.
              </p>
            </div>
            <button
              onClick={openNewUserModal}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              Crear Usuario en Mi Estadio
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400 bg-slate-50">
                  <th className="py-3.5 px-6">NOMBRE</th>
                  <th className="py-3.5 px-4">EMAIL</th>
                  <th className="py-3.5 px-4">RUT (CIFRADO AES-256)</th>
                  <th className="py-3.5 px-4">ROL</th>
                  <th className="py-3.5 px-4">ESTADO</th>
                  <th className="py-3.5 px-6">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {data.usuarios.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-4 px-6 font-bold text-slate-900">{u.nombreCompleto}</td>
                    <td className="py-4 px-4 text-xs text-slate-600">{u.email}</td>
                    <td className="py-4 px-4 text-xs font-mono text-slate-600">
                      {u.rutDecrypted || 'N/A'}
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {u.rol}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700">
                        {u.estado}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditUserModal(u)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Editar
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TERMINAL BIOMÉTRICO EN PUERTA DE ESTADIO */}
      {activeTab === 'puerta' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Terminal de Control de Acceso Biométrico en Puerta (Cláusula 2.2 RNH)
              </h3>
              <p className="text-xs text-slate-500">
                Verifica identidad por Rostro en Vivo (vector biométrico), Huella Digital FIDO2 o Cédula, y comprueba Prohibiciones de Ingreso en milisegundos.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Modo de Control en Puerta
                </label>
                <select
                  value={gateForm.modoVerificacion}
                  onChange={(e) =>
                    setGateForm({ ...gateForm, modoVerificacion: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                >
                  <option value="CONTROL_PUERTA_FACIAL">
                    Reconocimiento Biométrico Facial + Liveness
                  </option>
                  <option value="CONTROL_PUERTA_HUELLA">
                    Lector de Huella Digital (WebAuthn FIDO2)
                  </option>
                  <option value="CONTROL_CEDULA_FALLBACK">
                    Contingencia Cédula de Identidad (Cláusula 2.2)
                  </option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Torniquete / Puerta del Recinto
                </label>
                <input
                  type="text"
                  value={gateForm.puertaAcceso}
                  onChange={(e) => setGateForm({ ...gateForm, puertaAcceso: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  RUT / Documento del Asistente
                </label>
                <input
                  type="text"
                  value={gateForm.documentoRut}
                  onChange={(e) => setGateForm({ ...gateForm, documentoRut: e.target.value })}
                  placeholder="Ej: 18.543.210-K"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Credential ID Huella (Opcional)
                </label>
                <input
                  type="text"
                  value={gateForm.huellaCredentialId}
                  onChange={(e) =>
                    setGateForm({ ...gateForm, huellaCredentialId: e.target.value })
                  }
                  placeholder="FIDO2-CRED-ESTADIO-18543210K"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono"
                />
              </div>
            </div>

            {gateForm.modoVerificacion === 'CONTROL_PUERTA_FACIAL' && (
              <BiometricCamera
                mode="VERIFY"
                onCaptureComplete={(cap) => {
                  setGateForm((prev) => ({
                    ...prev,
                    capturaEnVivoBase64: cap.selfieBase64,
                    descriptorCapturaJson: cap.descriptorFacialJson,
                  }));
                }}
              />
            )}

            <button
              onClick={handleVerificarPuerta}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 transition"
            >
              <ScanFace className="w-5 h-5" />
              Ejecutar Verificación Biométrica y Derecho de Admisión en Puerta
            </button>
          </div>

          {/* Resultado del Torniquete */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 h-full flex flex-col justify-between space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  Respuesta en Tiempo Real del Torniquete
                </span>
                <h4 className="text-lg font-extrabold mt-1">Estado de Autorización de Paso</h4>
              </div>

              {!gateResult ? (
                <div className="text-center py-12 text-slate-400 text-xs space-y-2">
                  <Fingerprint className="w-12 h-12 mx-auto text-slate-600" />
                  <p>Ejecute una verificación para ver el dictamen biométrico y legal.</p>
                </div>
              ) : (
                <div
                  className={`rounded-2xl p-5 border-2 space-y-3 ${
                    gateResult.autorizado
                      ? 'bg-emerald-950/50 border-emerald-500 text-emerald-100'
                      : 'bg-red-950/60 border-red-500 text-red-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {gateResult.autorizado ? (
                      <CheckCircle2 className="w-10 h-10 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-10 h-10 text-red-400 shrink-0" />
                    )}
                    <div>
                      <div className="text-lg font-extrabold">{gateResult.estadoAcceso}</div>
                      <div className="text-xs opacity-90">{gateResult.mensaje}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10 text-xs">
                    <div>
                      <span className="text-slate-400 block">Asistente:</span>
                      <span className="font-bold">{gateResult.hinchaNombre}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Documento Enmascarado:</span>
                      <span className="font-mono font-bold">{gateResult.documentoEnmascarado}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Score Biométrico:</span>
                      <span className="font-mono font-bold">
                        {(gateResult.similarityScore * 100).toFixed(1)}% (Umbral 88%)
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Token Biometría:</span>
                      <span className="font-mono font-bold">
                        {gateResult.biometricTokenRef || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-3">
                Conforme a la sección 5.6 de los Términos y Condiciones ANFP, el terminal valida
                la probabilidad de acierto sin exponer ni almacenar fotografías en crudo.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VALIDADOR DE COMPRA DE ENTRADAS (TICKETERA) */}
      {activeTab === 'ticketera' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm max-w-2xl space-y-5">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Consulta de Habilitación RNH para Venta de Entradas (Ticketera)
            </h3>
            <p className="text-xs text-slate-500">
              Simula la consulta automática que realiza la ticketera al momento de comprar una entrada (Cláusula 2.2 y 4.1).
            </p>
          </div>

          <form onSubmit={handleVerificarTicketera} className="flex gap-3">
            <input
              type="text"
              required
              value={ticketeraRut}
              onChange={(e) => setTicketeraRut(e.target.value)}
              placeholder="Ingrese RUT a consultar (ej: 18.543.210-K o 20.111.222-3)"
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-mono"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
            >
              Validar Compra
            </button>
          </form>

          {ticketeraResult && (
            <div
              className={`p-4 rounded-xl border text-xs space-y-1 ${
                ticketeraResult.autorizado
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-red-50 border-red-300 text-red-900'
              }`}
            >
              <div className="font-extrabold text-sm">{ticketeraResult.estadoAcceso}</div>
              <p>{ticketeraResult.mensaje}</p>
              <div className="text-[11px] font-mono pt-1">
                Asistente: {ticketeraResult.hinchaNombre} • RUT: {ticketeraResult.documentoEnmascarado}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PROHIBICIONES DE INGRESO (DERECHO DE ADMISIÓN) */}
      {activeTab === 'prohibiciones' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">
              Aplicar Derecho de Admisión (Ley N° 19.327)
            </h3>
            <p className="text-xs text-slate-500">
              El RUT se almacena como Blind Index irreversible HMAC-SHA256 para bloquear compras y accesos.
            </p>
            <form onSubmit={handleCrearProhibicion} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">RUT Sancionado *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 21.333.444-5"
                  value={prohibicionForm.documentoRut}
                  onChange={(e) =>
                    setProhibicionForm({ ...prohibicionForm, documentoRut: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre Referencial *</label>
                <input
                  type="text"
                  required
                  value={prohibicionForm.nombreReferencia}
                  onChange={(e) =>
                    setProhibicionForm({ ...prohibicionForm, nombreReferencia: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Causal Legal *</label>
                <select
                  value={prohibicionForm.codigoCausal}
                  onChange={(e) =>
                    setProhibicionForm({ ...prohibicionForm, codigoCausal: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                >
                  <option value="LEY_19327_ART_10_DERECHO_ADMISION">
                    Código 101 - Derecho de Admisión ANFP (Ley N° 19.327)
                  </option>
                  <option value="PROHIBICION_JUDICIAL_ESTADIO_SEGURO">
                    Prohibición Judicial Estadio Seguro
                  </option>
                  <option value="INCUMPLIMIENTO_CONDICIONES_RNH">
                    Violación Condiciones de Uso RNH (Cláusula Sexta)
                  </option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Motivo Detallado *</label>
                <textarea
                  rows="2"
                  required
                  value={prohibicionForm.motivo}
                  onChange={(e) =>
                    setProhibicionForm({ ...prohibicionForm, motivo: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow"
              >
                Registrar Prohibición de Ingreso
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">
              Prohibiciones Vigentes ({data.prohibiciones.length})
            </h3>
            <div className="space-y-3">
              {data.prohibiciones.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{p.nombreReferencia}</span>
                      <span className="font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {p.documentoMasked}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          p.activa ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {p.activa ? 'PROHIBICIÓN ACTIVA' : 'LEVANTADA'}
                      </span>
                    </div>
                    <p className="text-slate-600">
                      <strong>{p.codigoCausal}:</strong> {p.motivo}
                    </p>
                  </div>
                  {p.activa && (
                    <button
                      onClick={() => handleLevantarProhibicion(p.id)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 font-semibold shrink-0"
                    >
                      Levantar
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: BITÁCORA DE ACCESOS */}
      {activeTab === 'bitacora' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900">
              Bitácora de Verificaciones Biométricas y Accesos del Recinto
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 font-bold text-slate-400 uppercase">
                  <th className="py-3 px-6">FECHA</th>
                  <th className="py-3 px-4">OPERACIÓN</th>
                  <th className="py-3 px-4">PUERTA / CANAL</th>
                  <th className="py-3 px-4">HINCHA</th>
                  <th className="py-3 px-4">SCORE</th>
                  <th className="py-3 px-6">RESULTADO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.accesosLog.map((l) => (
                  <tr key={l.id}>
                    <td className="py-3 px-6 font-mono text-slate-500">
                      {l.fechaEvento ? l.fechaEvento.replace('T', ' ').substring(0, 19) : ''}
                    </td>
                    <td className="py-3 px-4 font-bold">{l.tipoOperacion}</td>
                    <td className="py-3 px-4">{l.puertaAcceso}</td>
                    <td className="py-3 px-4">{l.hinchaNombre || 'Consulta por RUT'}</td>
                    <td className="py-3 px-4 font-mono">
                      {(Number(l.similarityScore || 0) * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-6">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          l.resultado === 'AUTORIZADO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {l.resultado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR USUARIO DEL TENANT */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingUser
                  ? 'Editar Usuario de Mi Estadio'
                  : `Nuevo Usuario en ${data.tenant?.nombre}`}
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={userForm.nombreCompleto}
                  onChange={(e) => setUserForm({ ...userForm, nombreCompleto: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {editingUser ? 'Nueva Clave (opcional)' : 'Contraseña *'}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rol en el Estadio *</label>
                  <select
                    value={userForm.rol}
                    onChange={(e) => setUserForm({ ...userForm, rol: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  >
                    <option value="USUARIO">USUARIO (Hincha / Asistente)</option>
                    <option value="OPERADOR_ACCESO">OPERADOR_ACCESO (Control Puertas)</option>
                    <option value="ADMIN_TENANT">ADMIN_TENANT (Co-Administrador Estadio)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">RUT / Documento</label>
                  <input
                    type="text"
                    value={userForm.rut}
                    onChange={(e) => setUserForm({ ...userForm, rut: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
