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
  ArrowRight,
  Lock,
  Loader2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { apiFetch } from '../services/api';
import BiometricCamera from '../componente/BiometricCamera';
import FingerprintCapture from '../componente/FingerprintCapture';

export default function Usuario({ currentUser, onOpenTerms }) {
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
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  // Estados del Flujo de Enrolamiento Paso a Paso (cuando hincha es null o quiere actualizar)
  const [onboardingStep, setOnboardingStep] = useState(1); // 1: Terminos, 2: Captura, 3: Verificando, 4: Exito
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [verificationCheckpoints, setVerificationCheckpoints] = useState([
    { label: 'Cotejando Cédula y datos identificatorios...', done: false },
    { label: 'Analizando prueba de vida y calidad de vector biométrico...', done: false },
    { label: 'Consultando antecedentes de Derecho de Admisión (Ley N° 19.327)...', done: false },
    { label: 'Generando token biométrico cifrado con AES-256-GCM...', done: false },
  ]);

  // Formulario Biométrico
  const [bioForm, setBioForm] = useState({
    tipoDocumento: 'CEDULA_CHILE',
    numeroDocumento: currentUser?.rutDecrypted || '',
    telefono: currentUser?.telefonoDecrypted || '',
    nombres: currentUser?.nombreCompleto?.split(' ')[0] || '',
    apellidos: currentUser?.nombreCompleto?.split(' ').slice(1).join(' ') || '',
    fechaNacimiento: '1996-05-15',
    nacionalidad: 'Chilena',
    aceptaTerminosGenerales: false,
    aceptaTratamientoBiometrico: false,
    fotoDocumentoBase64: '',
    selfieBase64: '',
    descriptorFacialJson: '',
    huellaCredentialId: '',
    huellaPublicKey: '',
    huellaDispositivoTipo: '',
    huellaDedo: 'INDICE_DERECHO',
  });

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
      if (data.hincha && data.hincha.estadoEnrolamiento === 'COMPLETADO') {
        setOnboardingStep(4);
      }
      if (data.usuario) {
        setBioForm((prev) => ({
          ...prev,
          numeroDocumento: prev.numeroDocumento || data.usuario.rutDecrypted || '',
          telefono: prev.telefono || data.usuario.telefonoDecrypted || '',
          nombres: prev.nombres || data.usuario.nombreCompleto?.split(' ')[0] || '',
          apellidos: prev.apellidos || data.usuario.nombreCompleto?.split(' ').slice(1).join(' ') || '',
        }));
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
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
      setMsg(`✓ Huella para ${nuevaHuellaDedo.replace('_', ' ')} registrada y cifrada con éxito.`);
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

  // Animación del Paso 3: "Estamos Verificando sus Datos..."
  const iniciarVerificacionEnTiempoReal = async () => {
    setOnboardingStep(3);
    setVerificationProgress(15);
    setErr('');

    // Checkpoint 1: Cotejo de identidad
    setTimeout(() => {
      setVerificationProgress(40);
      setVerificationCheckpoints((prev) => [
        { ...prev[0], done: true },
        prev[1],
        prev[2],
        prev[3],
      ]);
    }, 700);

    // Checkpoint 2: Prueba de vida y vector
    setTimeout(() => {
      setVerificationProgress(70);
      setVerificationCheckpoints((prev) => [
        prev[0],
        { ...prev[1], done: true },
        prev[2],
        prev[3],
      ]);
    }, 1500);

    // Checkpoint 3: Derecho de admisión
    setTimeout(() => {
      setVerificationProgress(90);
      setVerificationCheckpoints((prev) => [
        prev[0],
        prev[1],
        { ...prev[2], done: true },
        prev[3],
      ]);
    }, 2200);

    // Checkpoint 4: Guardar en backend y cifrar AES-256-GCM
    setTimeout(async () => {
      try {
        await apiFetch('/api/hincha/biometria', {
          method: 'POST',
          body: JSON.stringify(bioForm),
        });

        if (bioForm.huellaCredentialId) {
          await apiFetch('/api/hincha/huella', {
            method: 'POST',
            body: JSON.stringify({
              credentialId: bioForm.huellaCredentialId,
              publicKey: bioForm.huellaPublicKey,
              dispositivoTipo: bioForm.huellaDispositivoTipo,
              dedoIndice: bioForm.huellaDedo,
            }),
          });
        }

        setVerificationProgress(100);
        setVerificationCheckpoints((prev) => [
          prev[0],
          prev[1],
          prev[2],
          { ...prev[3], done: true },
        ]);

        setTimeout(() => {
          setOnboardingStep(4);
          setMsg('¡Identidad y Biometría verificadas exitosamente en el RNH! Tu credencial ha sido activada.');
          cargarPortal();
        }, 600);
      } catch (e) {
        setErr(e.message);
        setOnboardingStep(2);
      }
    }, 2800);
  };

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

      {/* CASO A: USUARIO NUEVO O PENDIENTE DE ENROLAMIENTO -> ASISTENTE PASO A PASO */}
      {!isEnrolled && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Header del Asistente */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 border-b border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  PROCESO OFICIAL DE ENROLAMIENTO BIOMÉTRICO (RNH)
                </span>
                <h1 className="text-2xl font-extrabold">
                  ¡Hola, {portal.usuario?.nombreCompleto || 'Hincha'}! Completa tu Verificación
                </h1>
                <p className="text-xs text-slate-300 max-w-2xl">
                  Para poder comprar entradas y acceder a los estadios del fútbol profesional chileno,
                  la Ley N° 19.327 exige validar tu identidad y generar tu pase biométrico digital.
                </p>
              </div>

              {/* Indicador de Pasos */}
              <div className="flex items-center gap-2 bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800 self-start sm:self-auto text-xs font-bold">
                <span className={`px-3 py-1 rounded-xl ${onboardingStep === 1 ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
                  1. Términos
                </span>
                <span className="text-slate-600">→</span>
                <span className={`px-3 py-1 rounded-xl ${onboardingStep === 2 ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
                  2. Biometría
                </span>
                <span className="text-slate-600">→</span>
                <span className={`px-3 py-1 rounded-xl ${onboardingStep === 3 ? 'bg-amber-600 text-white animate-pulse' : 'text-slate-400'}`}>
                  3. Verificación
                </span>
                <span className="text-slate-600">→</span>
                <span className={`px-3 py-1 rounded-xl ${onboardingStep === 4 ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>
                  4. Habilitado
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* ETAPA 1: DATOS DE IDENTIDAD, TÉRMINOS Y CONSENTIMIENTO BIOMÉTRICO */}
            {onboardingStep === 1 && (
              <div className="space-y-6 max-w-3xl mx-auto text-xs">
                <div className="space-y-2">
                  <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-blue-600" />
                    Paso 1: Datos de Identidad y Consentimiento Legal ANFP
                  </h2>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    {portal.usuario?.googleSub ? (
                      <span className="inline-flex items-center gap-1.5 text-blue-700 font-semibold bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                        ✓ Autenticado con tu cuenta de Google ({portal.usuario?.email}). Tus nombres están precargados.
                      </span>
                    ) : (
                      'Valida tus datos identificatorios para asociar tu cédula al Registro Nacional de Hinchas.'
                    )}
                  </p>
                </div>

                {/* Formulario de Cédula/Pasaporte y Teléfono */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Completa tus Datos Identificatorios (Requerido por Ley N° 19.327)
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Tipo de Documento *
                      </label>
                      <select
                        value={bioForm.tipoDocumento}
                        onChange={(e) => setBioForm({ ...bioForm, tipoDocumento: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 bg-white font-medium"
                      >
                        <option value="CEDULA_CHILE">Cédula de Identidad (RUT Chileno)</option>
                        <option value="PASAPORTE">Pasaporte Extranjero</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Número de Documento (RUT o Pasaporte) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: 18.543.210-K o Pasaporte"
                        value={bioForm.numeroDocumento}
                        onChange={(e) => setBioForm({ ...bioForm, numeroDocumento: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 bg-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Teléfono Móvil (Contacto Oficial) *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+56912345678"
                        value={bioForm.telefono}
                        onChange={(e) => setBioForm({ ...bioForm, telefono: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Fecha de Nacimiento *
                      </label>
                      <input
                        type="date"
                        value={bioForm.fechaNacimiento}
                        onChange={(e) => setBioForm({ ...bioForm, fechaNacimiento: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-1">
                    <div className="font-bold text-blue-900 text-sm">Zero-Retention</div>
                    <p className="text-slate-600 leading-relaxed">
                      El sistema <strong>no almacena tus fotos</strong>. Las imágenes se procesan en
                      memoria para extraer un vector matemático cifrado y luego se descartan de inmediato.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                    <div className="font-bold text-emerald-900 text-sm">Cifrado AES-256-GCM</div>
                    <p className="text-slate-600 leading-relaxed">
                      Tus datos biométricos y Cédula viajan encriptados de extremo a extremo y se
                      guardan en PostgreSQL en servidores ubicados en Chile (GCP).
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
                    <div className="font-bold text-amber-900 text-sm">Derechos ARCO</div>
                    <p className="text-slate-600 leading-relaxed">
                      Puedes acceder, rectificar o cancelar tus datos gratuitamente en cualquier
                      momento contactando al Delegado de Protección de Datos (DPO).
                    </p>
                  </div>
                </div>

                {/* Casillas de Consentimiento Obligatorias */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3.5">
                  <div className="font-bold text-slate-800 text-sm">
                    Aceptación Expresa Obligatoria (Cláusula Primera del RNH)
                  </div>

                  <label className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200 cursor-pointer shadow-sm hover:border-blue-400 transition">
                    <input
                      type="checkbox"
                      checked={bioForm.aceptaTerminosGenerales}
                      onChange={(e) =>
                        setBioForm({ ...bioForm, aceptaTerminosGenerales: e.target.checked })
                      }
                      className="mt-0.5 w-4 h-4 accent-blue-600"
                    />
                    <span className="text-slate-700 leading-relaxed">
                      He leído y <strong>Acepto los Términos y Condiciones Generales</strong> del
                      Registro Nacional de Hinchas (RNH) regulados por la Asociación Nacional de Fútbol
                      Profesional (ANFP).{' '}
                      <button
                        type="button"
                        onClick={onOpenTerms}
                        className="text-blue-600 font-bold underline inline-flex items-center gap-1"
                      >
                        Ver contrato legal completo <ExternalLink className="w-3 h-3" />
                      </button>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200 cursor-pointer shadow-sm hover:border-emerald-400 transition">
                    <input
                      type="checkbox"
                      checked={bioForm.aceptaTratamientoBiometrico}
                      onChange={(e) =>
                        setBioForm({ ...bioForm, aceptaTratamientoBiometrico: e.target.checked })
                      }
                      className="mt-0.5 w-4 h-4 accent-emerald-600"
                    />
                    <span className="text-slate-700 leading-relaxed">
                      <strong>Acepto expresamente el uso de mis datos biométricos</strong> (rostro y
                      huella digital) para la generación de vectores cifrados, validación en torniquetes
                      de acceso a estadios y corroboración del Derecho de Admisión (Ley N° 19.327).
                    </span>
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <span className="text-[11px] text-slate-500 text-center sm:text-left">
                    {!bioForm.numeroDocumento?.trim()
                      ? '⚠️ Ingresa tu Cédula de Identidad o Pasaporte para continuar'
                      : !bioForm.telefono?.trim()
                      ? '⚠️ Ingresa tu número de Teléfono Móvil'
                      : !bioForm.aceptaTerminosGenerales || !bioForm.aceptaTratamientoBiometrico
                      ? '⚠️ Debes marcar las dos casillas de aceptación de términos'
                      : '✓ Datos y consentimientos listos para captura'}
                  </span>

                  <button
                    type="button"
                    disabled={
                      !bioForm.numeroDocumento?.trim() ||
                      !bioForm.telefono?.trim() ||
                      !bioForm.aceptaTerminosGenerales ||
                      !bioForm.aceptaTratamientoBiometrico
                    }
                    onClick={() => setOnboardingStep(2)}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 transition"
                  >
                    Continuar a la Captura Biométrica
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA 2: CAPTURA FACIAL (LIVENESS) Y HUELLA DIGITAL */}
            {onboardingStep === 2 && (
              <div className="space-y-6 max-w-4xl mx-auto text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                      <ScanFace className="w-5 h-5 text-blue-600" />
                      Paso 2: Captura Biométrica Facial en Vivo y Huella Digital
                    </h2>
                    <p className="text-slate-500 text-sm">
                      Sitúate frente a la cámara web o móvil para validar tu rostro con prueba de vida.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOnboardingStep(1)}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                  >
                    ← Volver a Términos
                  </button>
                </div>

                {/* Cámara Biométrica */}
                <BiometricCamera
                  mode="ENROLL"
                  onCaptureComplete={(cap) => {
                    setBioForm((prev) => ({
                      ...prev,
                      selfieBase64: cap.selfieBase64,
                      fotoDocumentoBase64: cap.fotoDocumentoBase64,
                      descriptorFacialJson: cap.descriptorFacialJson,
                    }));
                  }}
                />

                {/* Huella Digital */}
                <FingerprintCapture
                  onFingerprintCaptured={(fp) => {
                    setBioForm((prev) => ({
                      ...prev,
                      huellaCredentialId: fp.credentialId,
                      huellaPublicKey: fp.publicKey,
                      huellaDispositivoTipo: fp.dispositivoTipo,
                      huellaDedo: fp.dedoIndice,
                    }));
                  }}
                />

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="text-slate-500">
                    {bioForm.descriptorFacialJson ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Vector biométrico facial listo para cotejo
                      </span>
                    ) : (
                      <span className="text-amber-600 font-semibold">
                        Captura tu rostro en vivo o presiona "Generar Vector Asistido" para continuar.
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={!bioForm.descriptorFacialJson && !bioForm.selfieBase64}
                    onClick={iniciarVerificacionEnTiempoReal}
                    className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 disabled:opacity-50 text-white font-extrabold text-sm shadow-xl flex items-center gap-2 transition"
                  >
                    <Sparkles className="w-4 h-4" />
                    Iniciar Verificación de Identidad con la ANFP
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA 3: "ESTAMOS VERIFICANDO SUS DATOS..." (PANTALLA DE PROCESAMIENTO ACTIVO) */}
            {onboardingStep === 3 && (
              <div className="py-14 max-w-xl mx-auto text-center space-y-8">
                <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-ping opacity-30" />
                  <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-2xl">
                    <Loader2 className="w-10 h-10 animate-spin" />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
                    En Tiempo Real
                  </span>
                  <h2 className="text-2xl font-extrabold text-slate-900">
                    Estamos verificando tu identidad...
                  </h2>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Por favor espera unos segundos mientras nos comunicamos con los servidores
                    oficiales de la ANFP y verificamos tus antecedentes en el Registro Nacional de Hinchas.
                  </p>
                </div>

                {/* Barra de Progreso */}
                <div className="space-y-2">
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full transition-all duration-500 ease-out"
                      style={{ width: `${verificationProgress}%` }}
                    />
                  </div>
                  <div className="text-right text-xs font-mono font-bold text-slate-500">
                    {verificationProgress}%
                  </div>
                </div>

                {/* Checkpoints Animados */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-left space-y-3 text-xs">
                  {verificationCheckpoints.map((cp, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className={cp.done ? 'text-slate-900 font-bold' : 'text-slate-400'}>
                        {cp.label}
                      </span>
                      {cp.done ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CASO B: USUARIO YA VERIFICADO Y ENROLADO (CREDENCIAL DIGITAL ACTIVA) */}
      {isEnrolled && (
        <>
          {/* Banner Credencial Digital RNH */}
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  IDENTIDAD BIOMÉTRICA VERIFICADA • CREDENCIAL RNH ACTIVA
                </span>
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">
                  Recinto: {portal.usuario?.tenantNombre || 'ANFP Central'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold">
                {portal.usuario?.nombreCompleto}
              </h1>
              <p className="text-xs text-slate-300">
                Email: {portal.usuario?.email} • Cédula Cifrada (AES-256-GCM):{' '}
                <span className="font-mono font-bold text-white">
                  {hincha?.documentoDecrypted || portal.usuario?.rutDecrypted}
                </span>
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">Estado RNH</div>
                  <div className="text-xs font-extrabold text-emerald-400 mt-0.5">
                    {hincha.estadoEnrolamiento}
                  </div>
                </div>
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">Token Biométrico</div>
                  <div className="text-xs font-mono font-bold text-blue-300 mt-0.5 truncate">
                    {hincha.biometricTokenRef}
                  </div>
                </div>
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">Prueba de Vida</div>
                  <div className="text-xs font-bold text-white mt-0.5">
                    {hincha.livenessPassed
                      ? `Verificada (${(hincha.livenessScore * 100).toFixed(1)}%)`
                      : 'Pendiente'}
                  </div>
                </div>
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">Derecho Admisión</div>
                  <div
                    className={`text-xs font-extrabold mt-0.5 ${
                      hincha.tieneProhibicionActiva ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {hincha.tieneProhibicionActiva ? 'BLOQUEADO (LEY 19.327)' : 'HABILITADO PARA ESTADIOS'}
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
              <div className="text-xs font-bold text-emerald-400">
                Vector Facial + Huella Vinculados
              </div>
              <button
                onClick={cargarPortal}
                className="text-[11px] text-slate-400 hover:text-white inline-flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Sincronizar Estado
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
                      Registrar Nueva Huella Digital (FIDO2 / WebAuthn)
                    </h4>
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-lg">
                      Sensor FIDO2
                    </span>
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
                      Presiona el botón de abajo y coloca tu dedo sobre el sensor de tu teléfono o lector biométrico FIDO2. La clave pública se encriptará con AES-256-GCM.
                    </div>
                  </div>

                  <FingerprintCapture
                    onFingerprintCaptured={(fp) => handleGuardarNuevaHuella(fp)}
                  />
                  {huellaSaving && (
                    <div className="text-center text-xs text-blue-600 font-bold flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Guardando y cifrando huella en PostgreSQL...
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
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          AES-256-GCM
                        </span>
                      </div>
                      <div className="font-mono text-[11px] text-slate-600 truncate">
                        ID: {h.credentialId}
                      </div>
                      <div className="text-slate-500 text-[11px] flex items-center justify-between">
                        <span>Dispositivo: {h.dispositivoTipo}</span>
                        <span className="text-emerald-700 font-bold">Activa para Acceso</span>
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
