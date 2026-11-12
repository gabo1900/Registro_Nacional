import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ScanFace,
  Fingerprint,
  FileCheck2,
  Scale,
  History,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { apiFetch } from '../services/api';
import FingerprintCapture from '../componente/FingerprintCapture';
import EnrolamientoHincha from '../registro/EnrolamientoHincha';
import { enmascararDocumento, enmascararCorreo } from '../registro/formato';

export default function Usuario({ currentUser, onOpenTerms, onLogout }) {
  const [portal, setPortal] = useState({
    usuario: currentUser,
    hincha: null,
    consentimiento: null,
    huellas: [],
    historialAccesos: [],
    solicitudesArco: [],
  });
  const [activeTab, setActiveTab] = useState('credencial');
  const [loading, setLoading] = useState(true);
  const [cargaInicial, setCargaInicial] = useState(true);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  // Soporte para agregar múltiples huellas (dedos alternativos)
  const [showAddHuella, setShowAddHuella] = useState(false);
  const [nuevaHuellaDedo, setNuevaHuellaDedo] = useState('INDICE_IZQUIERDO');
  const [huellaSaving, setHuellaSaving] = useState(false);

  // Form Derechos ARCO (Ley 19.628)
  const [arcoForm, setArcoForm] = useState({
    tipoDerecho: 'ACCESO',
    fundamento: '',
  });

  const cargarPortal = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/hincha/perfil');
      setPortal(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
      setCargaInicial(false);
    }
  };

  const handleGuardarNuevaHuella = async (fp) => {
    setHuellaSaving(true);
    setErr('');
    try {
      await apiFetch('/api/hincha/huella', {
        method: 'POST',
        body: JSON.stringify({
          credentialId: fp.credentialId,
          publicKey: fp.publicKey,
          dispositivoTipo: fp.dispositivoTipo,
          dedoIndice: nuevaHuellaDedo,
        }),
      });
      setMsg('Huella agregada.');
      setShowAddHuella(false);
      cargarPortal();
    } catch (e) {
      setErr(e.message);
    } finally {
      setHuellaSaving(false);
    }
  };

  useEffect(() => {
    cargarPortal();
  }, []);

  const handleEnviarArco = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      await apiFetch('/api/hincha/arco', {
        method: 'POST',
        body: JSON.stringify(arcoForm),
      });
      setMsg('Solicitud de Derecho ARCO enviada al DPO ANFP (ifierro@anfpchile.cl) conforme al Art. 12 Ley 19.628.');
      setArcoForm({ tipoDerecho: 'ACCESO', fundamento: '' });
      cargarPortal();
    } catch (e) {
      setErr(e.message);
    }
  };

  const hincha = portal.hincha;
  const isEnrolled = hincha && hincha.estadoEnrolamiento === 'COMPLETADO';

  if (cargaInicial) {
    return (
      <div className="grid min-h-[60vh] place-items-center" role="status">
        <Loader2 className="size-8 animate-spin text-blue-700 motion-reduce:animate-none" aria-hidden="true" />
        <span className="sr-only">Cargando tu cuenta…</span>
      </div>
    );
  }

  if (!isEnrolled && !err) {
    return (
      <EnrolamientoHincha
        usuario={portal.usuario || currentUser}
        onTerminado={cargarPortal}
        onOpenTerms={onOpenTerms}
        onCerrar={onLogout}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Alertas */}
      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-sm">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> {msg}
          </span>
          <button onClick={() => setMsg('')} className="font-bold text-emerald-700">✕</button>
        </div>
      )}
      {err && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-sm">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" /> {err}
          </span>
          <button onClick={() => setErr('')} className="font-bold text-red-700">✕</button>
        </div>
      )}


      {/* CASO B: USUARIO YA VERIFICADO Y ENROLADO (CREDENCIAL DIGITAL ACTIVA) */}
      {isEnrolled && (
        <>
          {/* Banner Credencial Digital RNH */}
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-sm font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Registro activo
                </span>
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-sm">
                  {portal.usuario?.tenantNombre || 'ANFP Central'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold">
                {portal.usuario?.nombreCompleto}
              </h1>
              <p className="text-sm text-slate-300 tabular-nums">
                {enmascararCorreo(portal.usuario?.email || '')}
                {' · '}
                <span className="text-white">
                  {enmascararDocumento(hincha?.documentoDecrypted || portal.usuario?.rutDecrypted || '')}
                </span>
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Registro</div>
                  <div className="text-sm font-semibold text-emerald-400 mt-0.5">Completo</div>
                </div>
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Foto de tu cara</div>
                  <div className="text-sm font-semibold text-white mt-0.5">
                    {hincha.livenessPassed ? 'Verificada' : 'Pendiente'}
                  </div>
                </div>
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Huellas</div>
                  <div className="text-sm font-semibold text-white mt-0.5">
                    {portal.huellas.length === 0 ? 'Ninguna' : portal.huellas.length}
                  </div>
                </div>
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Ingreso a estadios</div>
                  <div
                    className={`text-sm font-semibold mt-0.5 ${
                      hincha.tieneProhibicionActiva ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {hincha.tieneProhibicionActiva ? 'Con prohibición' : 'Habilitado'}
                  </div>
                </div>
              </div>
            </div>

            {/* Digital Pass Card */}
            <div className="lg:col-span-4 bg-slate-950/90 rounded-2xl p-5 border border-slate-800 text-center space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Pase Oficial Fútbol Chileno
              </div>
              <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 to-blue-600 flex items-center justify-center shadow-lg">
                <ScanFace className="w-14 h-14 text-white" />
              </div>
              <div className="text-sm font-semibold text-emerald-400">
                Mira a la cámara en la entrada
              </div>
              <button
                onClick={cargarPortal}
                className="text-[11px] text-slate-400 hover:text-white inline-flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Actualizar
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            <button
              onClick={() => setActiveTab('credencial')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === 'credencial'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              Mi Consentimiento y Estado Legal
            </button>

            <button
              onClick={() => setActiveTab('historial')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === 'historial'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              <History className="w-4 h-4" />
              Historial de Ingresos al Estadio ({portal.historialAccesos.length})
            </button>

            <button
              onClick={() => setActiveTab('huella')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === 'huella'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              <Fingerprint className="w-4 h-4" />
              Mis Huellas Digitales ({portal.huellas.length})
            </button>

            <button
              onClick={() => setActiveTab('arco')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === 'arco'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              <Scale className="w-4 h-4" />
              Derechos ARCO (Ley N° 19.628)
            </button>
          </div>

          {/* TAB 1: CERTIFICADO DE CONSENTIMIENTO */}
          {activeTab === 'credencial' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900">
                  Certificado de Consentimiento Informado y Protección de Datos (ANFP)
                </h3>
                <button
                  onClick={onOpenTerms}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Ver Texto Completo de Términos y Condiciones
                </button>
              </div>

              {portal.consentimiento ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block">Versión Términos Aceptada:</span>
                    <span className="font-bold text-slate-900">
                      {portal.consentimiento.versionTerminos}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block">Consentimiento Biométrico Expreso:</span>
                    <span className="font-bold text-emerald-700">
                      ACEPTADO (Art. 2.g Ley N° 19.628)
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block">Firma Hash de Integridad Legal:</span>
                    <span className="font-mono text-[11px] text-slate-700 break-all">
                      {portal.consentimiento.hashDocumentoLegal}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 2: HISTORIAL DE INGRESOS */}
          {activeTab === 'historial' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-slate-900">
                Mis Verificaciones en Puertas de Estadio y Ticketeras
              </h3>
              {portal.historialAccesos.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Aún no registras ingresos en puertas de estadio.
                </p>
              ) : (
                <div className="space-y-2 text-xs">
                  {portal.historialAccesos.map((a) => (
                    <div
                      key={a.id}
                      className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          {a.puertaAcceso} ({a.tipoOperacion})
                        </div>
                        <div className="text-slate-500">{a.detalleMensaje}</div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold ${
                          a.resultado === 'AUTORIZADO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {a.resultado}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HUELLAS DIGITALES (MÚLTIPLES DEDOS REGISTRABLES) */}
          {activeTab === 'huella' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Fingerprint className="w-5 h-5 text-blue-600" />
                    Mis Credenciales de Huella Digital Almacenadas ({portal.huellas.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Puedes tener registrados <strong>múltiples dedos</strong> (índice derecho, izquierdo, pulgares). Si un dedo sufre una lesión, podrás ingresar con tus otros dedos en el torniquete.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddHuella(!showAddHuella)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-md transition self-start sm:self-auto"
                >
                  <Fingerprint className="w-4 h-4" />
                  {showAddHuella ? 'Cerrar Enrolador' : '+ Enrolar Otro Dedo'}
                </button>
              </div>

              {/* SECCIÓN DESPLEGABLE: ENROLAR OTRA HUELLA */}
              {showAddHuella && (
                <div className="p-5 rounded-2xl bg-slate-50 border-2 border-blue-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      Agregar otra huella
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 text-xs mb-1">
                        Selecciona el dedo a registrar:
                      </label>
                      <select
                        value={nuevaHuellaDedo}
                        onChange={(e) => setNuevaHuellaDedo(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 bg-white text-xs font-semibold"
                      >
                        <option value="INDICE_DERECHO">Índice Mano Derecha</option>
                        <option value="INDICE_IZQUIERDO">Índice Mano Izquierda</option>
                        <option value="PULGAR_DERECHO">Pulgar Mano Derecha</option>
                        <option value="PULGAR_IZQUIERDO">Pulgar Mano Izquierda</option>
                        <option value="MEDIO_DERECHO">Dedo Medio Mano Derecha</option>
                        <option value="MEDIO_IZQUIERDO">Dedo Medio Mano Izquierda</option>
                      </select>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center">
                      Toca el botón de abajo y pon tu dedo en el lector de huella de tu celular.
                    </div>
                  </div>

                  <FingerprintCapture
                    onFingerprintCaptured={(fp) => handleGuardarNuevaHuella(fp)}
                  />
                  {huellaSaving && (
                    <div className="text-center text-xs text-blue-600 font-bold flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Guardando tu huella…
                    </div>
                  )}
                </div>
              )}

              {/* LISTA DE HUELLAS REGISTRADAS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {portal.huellas.length === 0 ? (
                  <div className="col-span-2 text-center py-8 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    No tienes huellas registradas aún. Haz clic en "+ Enrolar Otro Dedo" para agregar una.
                  </div>
                ) : (
                  portal.huellas.map((h) => (
                    <div
                      key={h.id}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 shadow-sm hover:border-blue-300 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          {h.dedoIndice ? h.dedoIndice.replace('_', ' ') : 'HUELLA REGISTRADA'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-xs">
                          Activa
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DERECHOS ARCO */}
          {activeTab === 'arco' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <form
                onSubmit={handleEnviarArco}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs"
              >
                <h3 className="text-base font-extrabold text-slate-900">
                  Ejercer Derechos ARCO (Cláusula 5.7 • Art. 12 Ley N° 19.628)
                </h3>
                <p className="text-slate-500">
                  Solicitud gratuita dirigida al Delegado de Protección de Datos (DPO) de la ANFP (
                  <code className="text-blue-600">ifierro@anfpchile.cl</code>).
                </p>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Derecho a Ejercer *</label>
                  <select
                    value={arcoForm.tipoDerecho}
                    onChange={(e) => setArcoForm({ ...arcoForm, tipoDerecho: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  >
                    <option value="ACCESO">Derecho de Acceso (Art. 12 Ley 19.628)</option>
                    <option value="RECTIFICACION">Derecho de Rectificación de Datos</option>
                    <option value="CANCELACION">Derecho de Cancelación / Eliminación (Máx. 60 días)</option>
                    <option value="OPOSICION">Derecho de Oposición al Tratamiento</option>
                    <option value="PORTABILIDAD">Derecho a la Portabilidad de Datos</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fundamento *</label>
                  <textarea
                    rows="3"
                    required
                    value={arcoForm.fundamento}
                    onChange={(e) => setArcoForm({ ...arcoForm, fundamento: e.target.value })}
                    placeholder="Describa el motivo de su solicitud..."
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow"
                >
                  Enviar Solicitud Formal al DPO
                </button>
              </form>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3 text-xs">
                <h3 className="text-base font-extrabold text-slate-900">
                  Mis Solicitudes ARCO Registradas ({portal.solicitudesArco.length})
                </h3>
                {portal.solicitudesArco.map((s) => (
                  <div key={s.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex justify-between font-bold">
                      <span>Derecho de {s.tipoDerecho}</span>
                      <span className="text-indigo-600">{s.estado}</span>
                    </div>
                    <p className="text-slate-600">{s.fundamento}</p>
                    <p className="text-[11px] text-emerald-700">{s.respuestaDpo}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
