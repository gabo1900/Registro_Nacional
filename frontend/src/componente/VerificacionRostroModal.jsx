import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  X,
  ScanFace,
  UserPlus,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Fingerprint,
  Building2,
  AlertTriangle,
} from 'lucide-react';
import CapturaFacial from '../registro/CapturaFacial';
import { Boton } from './ui';
import { apiFetch } from '../services/api';

const CONFETTI_PIECES = [
  { left: '8%', delay: '0s', color: 'bg-emerald-400', size: 'w-2.5 h-2.5' },
  { left: '18%', delay: '0.25s', color: 'bg-marca-600', size: 'w-2 h-3' },
  { left: '29%', delay: '0.1s', color: 'bg-amber-400', size: 'w-2.5 h-2.5' },
  { left: '42%', delay: '0.4s', color: 'bg-sky-400', size: 'w-2 h-2' },
  { left: '55%', delay: '0.15s', color: 'bg-emerald-500', size: 'w-2 h-3' },
  { left: '68%', delay: '0.35s', color: 'bg-amber-300', size: 'w-2.5 h-2.5' },
  { left: '80%', delay: '0.05s', color: 'bg-marca-700', size: 'w-2 h-3' },
  { left: '90%', delay: '0.3s', color: 'bg-emerald-400', size: 'w-2.5 h-2.5' },
];

async function compactarSelfieRapida(dataUrl, maxAncho = 480) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const escala = Math.min(1, maxAncho / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * escala));
        canvas.height = Math.max(1, Math.round(img.height * escala));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Flujo público "¿Cómo lo sé?":
 * 1) Abre la cámara con prueba de vida facial.
 * 2) Envía una captura ligera al servidor para cotejar rasgos faciales 1:N.
 * 3) Muestra una ventana emergente dinámica (lista para screenshot) indicando si es hincha o debe registrarse.
 */
export default function VerificacionRostroModal({ abierta, onCerrar, onGoRegister, onGoLogin }) {
  const [etapa, setEtapa] = useState('camara'); // 'camara' | 'analizando' | 'resultado' | 'error'
  const [selfieCapturada, setSelfieCapturada] = useState('');
  const [segundos, setSegundos] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!abierta) {
      setEtapa('camara');
      setSelfieCapturada('');
      setResultado(null);
      setErrorMsg('');
      setSegundos(0);
    }
  }, [abierta]);

  useEffect(() => {
    if (!abierta || etapa !== 'analizando') return;
    setSegundos(0);
    const id = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [abierta, etapa]);

  if (!abierta) return null;

  const manejarFotoCapturada = async (datos) => {
    const rawSelfie = datos?.selfieBase64 || '';
    setSelfieCapturada(rawSelfie);
    setErrorMsg('');
    setResultado(null);
    setEtapa('analizando');

    try {
      const selfieCompacta = await compactarSelfieRapida(rawSelfie, 480);
      const resp = await apiFetch('/api/public/identificar-rostro', {
        method: 'POST',
        timeoutMs: 25000,
        body: JSON.stringify({
          selfieBase64: selfieCompacta,
          descriptorFacialJson: datos?.descriptorFacialJson || '',
        }),
      });
      setResultado(resp);
      setEtapa('resultado');
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo completar la verificación facial. Revisa tu conexión.');
      setEtapa('error');
    }
  };

  if (etapa === 'camara') {
    return (
      <CapturaFacial
        onCapturada={manejarFotoCapturada}
        onCancelar={onCerrar}
      />
    );
  }

  const esHinchaRegistrado = etapa === 'resultado' && resultado?.encontrado && resultado?.rostroValido;
  const sinRostroClaro = etapa === 'resultado' && !resultado?.rostroValido;
  const horaVerificacion = new Date().toLocaleString('es-CL', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Resultado de verificación facial"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-linea bg-superficie shadow-2xl anim-celebrar-pop">
        {/* Botón superior cerrar */}
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar ventana"
          className="absolute right-4 top-4 z-20 grid size-9 place-items-center rounded-full bg-fondo/90 text-tinta-suave hover:bg-linea transition"
        >
          <X className="size-5" />
        </button>

        {/* ETAPA ANALIZANDO */}
        {etapa === 'analizando' && (
          <div className="p-7 text-center space-y-5">
            <div className="relative mx-auto size-40 overflow-hidden rounded-full border-4 border-marca-700/30 shadow-lg bg-slate-900">
              {selfieCapturada && (
                <img
                  src={selfieCapturada}
                  alt="Rostro capturado"
                  className="size-full object-cover -scale-x-100 opacity-90"
                />
              )}
              <div className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] anim-scan-rostro" />
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 rounded-full bg-marca-50 px-3 py-1 text-xs font-bold text-marca-800">
                <ScanFace className="size-4 animate-pulse" />
                Buscando coincidencias faciales… {segundos}s
              </div>
              <h3 className="text-xl font-extrabold text-tinta">Verificando tu registro en vivo</h3>
              <p className="text-sm text-tinta-tenue">
                Estamos comparando tus rasgos faciales contra los registros de Fanpass.
              </p>
            </div>
          </div>
        )}

        {/* ETAPA RESULTADO POSITIVO: ¡ES HINCHA! (Animado y listo para screenshot) */}
        {esHinchaRegistrado && (
          <div className="relative overflow-hidden">
            {/* Confetti animado */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-44 overflow-hidden" aria-hidden="true">
              {CONFETTI_PIECES.map((c, idx) => (
                <span
                  key={idx}
                  style={{ left: c.left, animationDelay: c.delay }}
                  className={`absolute top-0 rounded-sm ${c.color} ${c.size} anim-confetti`}
                />
              ))}
            </div>

            <div className="relative z-10 bg-gradient-to-br from-emerald-600 via-emerald-700 to-marca-900 px-6 pb-6 pt-7 text-white text-center">
              <div className="mx-auto mb-3 relative size-24 rounded-full p-1 bg-white/25 shadow-lg">
                {selfieCapturada ? (
                  <img
                    src={selfieCapturada}
                    alt={resultado.nombreCompleto}
                    className="size-full rounded-full object-cover -scale-x-100 border-2 border-white"
                  />
                ) : (
                  <div className="grid size-full place-items-center rounded-full bg-emerald-800">
                    <CheckCircle2 className="size-10 text-white" />
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full bg-white text-emerald-700 shadow-md">
                  <CheckCircle2 className="size-5" />
                </span>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wider">
                <Sparkles className="size-3.5 text-amber-300" />
                ¡Felicidades, eres hincha registrado!
              </span>
              <h3 className="mt-2 text-2xl font-extrabold leading-tight">
                {resultado.nombreCompleto}
              </h3>
              <p className="mt-1 text-xs text-emerald-100">
                Tus datos faciales están cargados y activos en Fanpass
              </p>
            </div>

            {/* Tarjeta de pase listo para screenshot */}
            <div className="p-6 space-y-4 bg-superficie">
              {resultado.tieneProhibicion ? (
                <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-rose-900">
                  <ShieldAlert className="size-5 shrink-0 text-rose-600 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-extrabold">Registro encontrado con restricción vigente</p>
                    <p>Presentas una restricción de Derecho de Admisión activa en este recinto.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3">
                  <span className="text-xs font-extrabold text-emerald-900 uppercase tracking-wide">
                    Estado del Pase
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-extrabold text-white">
                    <CheckCircle2 className="size-3.5" /> HABILITADO
                  </span>
                </div>
              )}

              <dl className="grid grid-cols-2 gap-3 rounded-2xl border border-linea bg-fondo/70 p-4 text-sm">
                <div>
                  <dt className="text-[11px] font-semibold text-tinta-tenue">RUT</dt>
                  <dd className="font-extrabold text-tinta tabular-nums">{resultado.rutEnmascarado}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold text-tinta-tenue">Similitud Facial</dt>
                  <dd className="font-extrabold text-emerald-700 tabular-nums">
                    {Math.round((resultado.confianza || 0.9) * 100)}% Verificado
                  </dd>
                </div>
                <div className="col-span-2 flex items-center gap-2 pt-1 border-t border-linea">
                  <Building2 className="size-4 text-marca-700 shrink-0" />
                  <span className="text-xs font-bold text-tinta-suave truncate">
                    {resultado.estadioPrincipal}
                  </span>
                </div>
                <div className="col-span-2 flex items-center justify-between text-[11px] text-tinta-tenue pt-1 border-t border-linea">
                  <span className="inline-flex items-center gap-1">
                    <Fingerprint className="size-3.5" />
                    Huella dactilar: {resultado.huellaRegistrada ? 'Enrolada' : 'Solo facial'}
                  </span>
                  <span>{horaVerificacion}</span>
                </div>
              </dl>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <Boton variante="secundario" onClick={onCerrar}>
                  Cerrar
                </Boton>
                <Boton
                  onClick={() => {
                    onCerrar();
                    onGoLogin();
                  }}
                >
                  Entrar a mi pase
                </Boton>
              </div>
            </div>
          </div>
        )}

        {/* ETAPA RESULTADO NEGATIVO: NO REGISTRADO O ROSTRO NO DETECTADO */}
        {etapa === 'resultado' && !esHinchaRegistrado && (
          <div className="p-7 text-center space-y-5">
            <div className="relative mx-auto size-28 overflow-hidden rounded-full border-4 border-amber-300 shadow-md bg-slate-900">
              {selfieCapturada && (
                <img
                  src={selfieCapturada}
                  alt="Captura facial"
                  className="size-full object-cover -scale-x-100"
                />
              )}
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-aviso-50 px-3 py-1 text-xs font-extrabold text-aviso-900 border border-aviso-200">
                <AlertTriangle className="size-3.5 text-aviso-700" />
                {sinRostroClaro ? 'Rostro no detectado' : 'Sin registro facial activo'}
              </span>
              <h3 className="text-xl font-extrabold text-tinta">
                {sinRostroClaro
                  ? 'No pudimos ver tu rostro claramente'
                  : 'Aún no estás registrado como hincha'}
              </h3>
              <p className="text-sm text-tinta-suave leading-relaxed">
                {resultado?.mensaje ||
                  'No encontramos tus datos faciales en el sistema. Debes registrarte en Fanpass para usar tu acceso.'}
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              {!sinRostroClaro && (
                <Boton
                  ancho
                  icono={<UserPlus className="size-5" />}
                  onClick={() => {
                    onCerrar();
                    onGoRegister();
                  }}
                >
                  Registrarme ahora
                </Boton>
              )}
              <div className="grid grid-cols-2 gap-2.5">
                <Boton
                  variante="secundario"
                  icono={<RotateCcw className="size-4" />}
                  onClick={() => setEtapa('camara')}
                >
                  Probar otra vez
                </Boton>
                <Boton variante="texto" onClick={onCerrar}>
                  Cerrar
                </Boton>
              </div>
            </div>
          </div>
        )}

        {/* ETAPA ERROR DE RED / SERVIDOR */}
        {etapa === 'error' && (
          <div className="p-7 text-center space-y-5">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-error-50 text-error-700 border border-error-200">
              <AlertTriangle className="size-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-extrabold text-tinta">No se pudo verificar ahora</h3>
              <p className="text-sm text-tinta-suave">{errorMsg}</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <Boton
                variante="secundario"
                icono={<RotateCcw className="size-4" />}
                onClick={() => setEtapa('camara')}
              >
                Reintentar
              </Boton>
              <Boton variante="texto" onClick={onCerrar}>
                Cerrar
              </Boton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
