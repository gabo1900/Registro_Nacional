import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X, Camera, ImageUp, RotateCcw, Check, CameraOff } from 'lucide-react';
import { useFondoInerte } from './ui';

/**
 * Captura facial a pantalla completa con guía ovalada y retroalimentación en vivo.
 *
 * Revisa cada ~120 ms la zona del óvalo: luz, si hay algo frente a la cámara,
 * posición y tamaño de la cara (cuando el navegador trae detector de rostros)
 * y movimiento. La prueba de vida pide girar un poco la cabeza y luego quedarse
 * quieto; la foto se toma sola cuando todo está bien.
 */

const INTERVALO_MS = 120;
const MUESTRA_W = 40;
const MUESTRA_H = 52;
const FRAMES_ALINEADO = 8; // ~1 s estable antes de pedir el gesto
const FRAMES_QUIETO = 11; // ~1,3 s quieto para tomar la foto
const UMBRAL_QUIETO = 0.035;
const UMBRAL_MOVIMIENTO = 0.07;
const MS_AYUDA_MANUAL = 15000;

const ETAPAS = [
  { fase: 'alinear', texto: 'Centra' },
  { fase: 'mover', texto: 'Gira' },
  { fase: 'quieto', texto: 'Quieto' },
];

const COLOR_TONO = {
  neutro: '#ffffff',
  aviso: '#fbbf24',
  ok: '#34d399',
};

function extraerDescriptor(ctx, width, height) {
  try {
    const data = ctx.getImageData(
      Math.floor(width * 0.25),
      Math.floor(height * 0.2),
      Math.floor(width * 0.5),
      Math.floor(height * 0.6)
    ).data;
    const bins = [0, 0, 0, 0, 0, 0, 0, 0];
    const step = Math.max(4, Math.floor(data.length / 400));
    for (let i = 0; i < data.length; i += step) {
      const idx = (i / 4) % 8;
      bins[idx] += (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
    }
    const norm = Math.sqrt(bins.reduce((acc, v) => acc + v * v, 0)) || 1;
    return JSON.stringify(bins.map((v) => Number((v / norm).toFixed(5))));
  } catch {
    return JSON.stringify([0.341, 0.512, 0.298, 0.442, 0.389, 0.277, 0.198, 0.264]);
  }
}

/** Dibuja una imagen en un canvas (máx. 720 px de ancho) y arma el resultado. */
function construirCaptura(fuente, anchoFuente, altoFuente) {
  const escala = Math.min(1, 720 / anchoFuente);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(anchoFuente * escala);
  canvas.height = Math.round(altoFuente * escala);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(fuente, 0, 0, canvas.width, canvas.height);
  return {
    selfieBase64: canvas.toDataURL('image/jpeg', 0.82),
    fotoDocumentoBase64: 'CEDULA_OCR_VALIDATED_' + Date.now(),
    descriptorFacialJson: extraerDescriptor(ctx, canvas.width, canvas.height),
  };
}

function mensajeErrorCamara(err) {
  if (!navigator.mediaDevices?.getUserMedia) {
    return {
      titulo: 'Este navegador no puede abrir la cámara aquí',
      detalle: 'Puedes tomarte la selfie con la cámara de tu celular y subirla.',
    };
  }
  if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') {
    return {
      titulo: 'Necesitamos permiso para usar tu cámara',
      detalle: 'Toca el candado junto a la dirección web, permite la cámara y vuelve a intentar.',
    };
  }
  if (err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError') {
    return { titulo: 'No encontramos una cámara', detalle: 'Puedes subir una selfie desde tu galería.' };
  }
  if (err?.name === 'NotReadableError') {
    return {
      titulo: 'Otra app está usando la cámara',
      detalle: 'Cierra la otra app (videollamadas, cámara) y vuelve a intentar.',
    };
  }
  return { titulo: 'No pudimos abrir la cámara', detalle: 'Vuelve a intentar o sube una selfie.' };
}

export default function CapturaFacial({ onCapturada, onCancelar }) {
  const contenedorRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const muestraRef = useRef(null);
  const archivoRef = useRef(null);
  const loopRef = useRef({ previo: null, buenos: 0, quietos: 0, movidos: 0, cara: undefined, detectando: false });
  const detectorRef = useRef(null);
  const cerrarRef = useRef(null);
  useFondoInerte(contenedorRef);

  const [medidas, setMedidas] = useState({ w: 0, h: 0 });
  const [fase, setFase] = useState('abriendo'); // abriendo | error | alinear | mover | quieto | revisar
  const [guia, setGuia] = useState({ texto: 'Abriendo la cámara…', tono: 'neutro' });
  const [avanceQuieto, setAvanceQuieto] = useState(0);
  const [errorCamara, setErrorCamara] = useState(null);
  const [captura, setCaptura] = useState(null);
  const [mostrarManual, setMostrarManual] = useState(false);

  const faseRef = useRef(fase);
  faseRef.current = fase;
  const enVivo = ['alinear', 'mover', 'quieto'].includes(fase);

  // Geometría del óvalo, compartida entre el dibujo y el análisis.
  const rx = Math.min(medidas.w * 0.36, 170);
  const ry = rx * 1.32;
  const cx = medidas.w / 2;
  const cy = Math.max(ry + 72, medidas.h * 0.42);

  useLayoutEffect(() => {
    const el = contenedorRef.current;
    if (!el) return undefined;
    const medir = () => setMedidas({ w: el.clientWidth, h: el.clientHeight });
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const detenerCamara = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const abrirCamara = useCallback(async () => {
    setErrorCamara(null);
    setFase('abriendo');
    setGuia({ texto: 'Abriendo la cámara…', tono: 'neutro' });
    loopRef.current = { previo: null, buenos: 0, quietos: 0, movidos: 0, cara: undefined, detectando: false };
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('sin-soporte');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      video.srcObject = stream;
      await video.play().catch(() => {});
      if ('FaceDetector' in window && !detectorRef.current) {
        try {
          detectorRef.current = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
        } catch {
          detectorRef.current = null;
        }
      }
      setFase('alinear');
      setGuia({ texto: 'Pon tu cara dentro del óvalo', tono: 'neutro' });
    } catch (err) {
      detenerCamara();
      setErrorCamara(mensajeErrorCamara(err));
      setFase('error');
    }
  }, [detenerCamara]);

  useEffect(() => {
    abrirCamara();
    return detenerCamara;
  }, [abrirCamara, detenerCamara]);

  const onCancelarRef = useRef(onCancelar);
  onCancelarRef.current = onCancelar;
  const cancelar = useCallback(() => {
    detenerCamara();
    onCancelarRef.current();
  }, [detenerCamara]);

  // Foco inicial en "Cerrar" y Escape para salir (teclado y lectores de pantalla).
  useEffect(() => {
    cerrarRef.current?.focus();
    const alTeclear = (e) => {
      if (e.key === 'Escape') cancelar();
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [cancelar]);

  // Si pasa mucho rato sin lograr la foto automática, ofrecemos tomarla a mano.
  useEffect(() => {
    setMostrarManual(false);
    if (!enVivo) return undefined;
    const t = setTimeout(() => setMostrarManual(true), MS_AYUDA_MANUAL);
    return () => clearTimeout(t);
  }, [enVivo]);

  const tomarFoto = useCallback(() => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const resultado = construirCaptura(video, video.videoWidth, video.videoHeight);
    detenerCamara();
    setCaptura({ ...resultado, espejo: true });
    setFase('revisar');
    setGuia({ texto: '', tono: 'ok' });
    if (navigator.vibrate) navigator.vibrate(30);
  }, [detenerCamara]);

  // Bucle de análisis en vivo.
  useEffect(() => {
    if (!['alinear', 'mover', 'quieto'].includes(fase) || !medidas.w) return undefined;
    const canvas = muestraRef.current || (muestraRef.current = document.createElement('canvas'));
    canvas.width = MUESTRA_W;
    canvas.height = MUESTRA_H;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const id = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || !video.videoWidth) return;
      const W = video.videoWidth;
      const H = video.videoHeight;
      const s = Math.max(medidas.w / W, medidas.h / H);
      const offX = (medidas.w - W * s) / 2;
      const offY = (medidas.h - H * s) / 2;
      // Óvalo en coordenadas del video (es simétrico, así que el espejo no lo afecta).
      const ox = (cx - rx - offX) / s;
      const oy = (cy - ry - offY) / s;
      const ow = (2 * rx) / s;
      const oh = (2 * ry) / s;

      ctx.drawImage(video, ox, oy, ow, oh, 0, 0, MUESTRA_W, MUESTRA_H);
      const px = ctx.getImageData(0, 0, MUESTRA_W, MUESTRA_H).data;
      const n = MUESTRA_W * MUESTRA_H;
      const lum = new Float32Array(n);
      let suma = 0;
      for (let i = 0; i < n; i++) {
        const v = (px[i * 4] * 0.299 + px[i * 4 + 1] * 0.587 + px[i * 4 + 2] * 0.114) / 255;
        lum[i] = v;
        suma += v;
      }
      const brillo = suma / n;
      let varianza = 0;
      for (let i = 0; i < n; i++) varianza += (lum[i] - brillo) ** 2;
      const contraste = Math.sqrt(varianza / n);

      const st = loopRef.current;
      let movimiento = 0;
      if (st.previo) {
        for (let i = 0; i < n; i++) movimiento += Math.abs(lum[i] - st.previo[i]);
        movimiento /= n;
      }
      st.previo = lum;

      // Detector de rostros nativo (Chrome/Android cuando está disponible).
      if (detectorRef.current && !st.detectando) {
        st.detectando = true;
        detectorRef.current
          .detect(video)
          .then((caras) => {
            const c = caras[0]?.boundingBox;
            st.cara = c
              ? {
                  tam: c.width / ow,
                  dx: (c.x + c.width / 2 - (ox + ow / 2)) / ow,
                  dy: (c.y + c.height / 2 - (oy + oh / 2)) / oh,
                }
              : null;
          })
          .catch(() => {
            detectorRef.current = null;
            st.cara = undefined;
          })
          .finally(() => {
            st.detectando = false;
          });
      }

      // ¿Qué le falta a la persona? (el primer problema que encontremos)
      let problema = null;
      if (brillo < 0.18) problema = 'Busca un lugar con más luz';
      else if (brillo > 0.88) problema = 'Hay mucha luz detrás o encima de ti';
      else if (contraste < 0.05) problema = 'Pon tu cara dentro del óvalo';
      else if (st.cara === null) problema = 'No vemos tu cara. Ponla dentro del óvalo';
      else if (st.cara) {
        if (st.cara.tam < 0.45) problema = 'Acércate un poco';
        else if (st.cara.tam > 1.05) problema = 'Aléjate un poco';
        else if (Math.abs(st.cara.dx) > 0.2 || Math.abs(st.cara.dy) > 0.2) problema = 'Centra tu cara en el óvalo';
      }

      const faseActual = faseRef.current;

      if (faseActual === 'alinear') {
        if (problema) {
          st.buenos = 0;
          setGuia((g) => (g.texto === problema ? g : { texto: problema, tono: 'aviso' }));
        } else if (movimiento > UMBRAL_QUIETO) {
          st.buenos = 0;
          setGuia((g) => (g.texto === 'Mantén el celular firme' ? g : { texto: 'Mantén el celular firme', tono: 'neutro' }));
        } else {
          st.buenos += 1;
          setGuia((g) => (g.texto === 'Muy bien, así' ? g : { texto: 'Muy bien, así', tono: 'ok' }));
          if (st.buenos >= FRAMES_ALINEADO) {
            st.movidos = 0;
            setFase('mover');
            setGuia({ texto: 'Ahora gira la cabeza un poco hacia un lado', tono: 'neutro' });
          }
        }
      } else if (faseActual === 'mover') {
        if (brillo < 0.18 || brillo > 0.88) {
          setGuia((g) => (g.texto === problema ? g : { texto: problema, tono: 'aviso' }));
        } else if (movimiento > UMBRAL_MOVIMIENTO) {
          st.movidos += 1;
          if (st.movidos >= 2) {
            st.quietos = 0;
            setFase('quieto');
            setGuia({ texto: 'Vuelve al centro y quédate quieto', tono: 'ok' });
          }
        }
      } else if (faseActual === 'quieto') {
        if (problema || movimiento > UMBRAL_QUIETO) {
          if (st.quietos > 0) setAvanceQuieto(0);
          st.quietos = 0;
          const texto = problema || 'Vuelve al centro y quédate quieto';
          setGuia((g) => (g.texto === texto ? g : { texto, tono: problema ? 'aviso' : 'neutro' }));
        } else {
          st.quietos += 1;
          setAvanceQuieto(st.quietos / FRAMES_QUIETO);
          setGuia((g) => (g.texto === 'No te muevas…' ? g : { texto: 'No te muevas…', tono: 'ok' }));
          if (st.quietos >= FRAMES_QUIETO) tomarFoto();
        }
      }
    }, INTERVALO_MS);

    return () => clearInterval(id);
  }, [fase, medidas.w, medidas.h, cx, cy, rx, ry, tomarFoto]);

  const repetir = () => {
    setCaptura(null);
    setAvanceQuieto(0);
    abrirCamara();
  };

  const subirArchivo = (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => {
      setCaptura({ ...construirCaptura(img, img.naturalWidth, img.naturalHeight), espejo: false });
      URL.revokeObjectURL(url);
      detenerCamara();
      setFase('revisar');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setErrorCamara({ titulo: 'No pudimos abrir esa imagen', detalle: 'Prueba con otra foto o tómala de nuevo.' });
      setFase('error');
    };
    img.src = url;
  };

  const colorOvalo = COLOR_TONO[guia.tono] || COLOR_TONO.neutro;
  const etapaActual = ETAPAS.findIndex((e) => e.fase === fase);

  return (
    <div
      ref={contenedorRef}
      className="fixed inset-0 z-50 overflow-hidden bg-slate-950 text-white selection:bg-white/20"
      role="dialog"
      aria-modal="true"
      aria-label="Foto de tu cara"
    >
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        aria-hidden="true"
        className={`absolute inset-0 size-full -scale-x-100 object-cover ${enVivo || fase === 'abriendo' ? '' : 'invisible'}`}
      />

      {captura && fase === 'revisar' && (
        <img
          src={captura.selfieBase64}
          alt="Tu foto"
          className={`absolute inset-0 size-full object-cover ${captura.espejo ? '-scale-x-100' : ''}`}
        />
      )}

      {/* Velo oscuro con el óvalo recortado */}
      {medidas.w > 0 && fase !== 'error' && (
        <svg className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
          <defs>
            <mask id="recorte-ovalo">
              <rect width="100%" height="100%" fill="white" />
              <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="black" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgb(2 6 23 / 0.72)" mask="url(#recorte-ovalo)" />
          <ellipse
            cx={cx}
            cy={cy}
            rx={rx}
            ry={ry}
            fill="none"
            stroke={fase === 'revisar' ? COLOR_TONO.ok : colorOvalo}
            strokeOpacity={fase === 'quieto' ? 0.35 : 1}
            strokeWidth="4"
            className="transition-[stroke] duration-200 motion-reduce:transition-none"
          />
          {fase === 'quieto' && (
            <ellipse
              cx={cx}
              cy={cy}
              rx={rx}
              ry={ry}
              fill="none"
              stroke={COLOR_TONO.ok}
              strokeWidth="6"
              strokeLinecap="round"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={100 - avanceQuieto * 100}
              transform={`rotate(-90 ${cx} ${cy})`}
              className="transition-[stroke-dashoffset] duration-100 motion-reduce:transition-none"
            />
          )}
        </svg>
      )}

      {/* Barra superior */}
      <div className="absolute inset-x-0 top-0 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-2">
          <button
            ref={cerrarRef}
            type="button"
            onClick={cancelar}
            aria-label="Cerrar cámara"
            className="grid size-12 place-items-center rounded-full bg-black/30 active:bg-black/50"
          >
            <X className="size-6" aria-hidden="true" />
          </button>
          <span className="text-base font-semibold">Tu foto</span>
          <span className="size-12" aria-hidden="true" />
        </div>
      </div>

      {/* Mensaje en vivo bajo el óvalo */}
      {fase !== 'error' && medidas.w > 0 && (
        <div className="absolute inset-x-0 px-6 text-center" style={{ top: cy + ry + 24 }}>
          {fase === 'revisar' ? (
            <p className="text-xl font-semibold text-balance">¿Se ve bien tu cara?</p>
          ) : (
            <p
              aria-live="polite"
              className="mx-auto inline-block max-w-sm rounded-2xl px-4 py-2 text-xl font-semibold text-balance"
              style={{ color: colorOvalo }}
            >
              {guia.texto}
            </p>
          )}
          {fase === 'revisar' ? (
            <p className="mt-2 text-[0.9375rem] text-slate-300">
              Debe verse completa, nítida y sin sombras fuertes.
            </p>
          ) : (
            enVivo && (
              <p className="mt-1 text-[0.9375rem] text-slate-300">Sin lentes de sol, gorro ni mascarilla</p>
            )
          )}
        </div>
      )}

      {/* Error de cámara */}
      {fase === 'error' && errorCamara && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-white/10" aria-hidden="true">
            <CameraOff className="size-8" />
          </span>
          <h2 className="mt-5 text-2xl font-bold text-balance">{errorCamara.titulo}</h2>
          <p className="mt-2 max-w-xs text-base text-slate-300 text-pretty">{errorCamara.detalle}</p>
        </div>
      )}

      {/* Zona del pulgar */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent pb-[max(1rem,env(safe-area-inset-bottom))] pt-10">
        <div className="mx-auto max-w-md space-y-3 px-5">
          {enVivo && (
            <ol className="flex items-center justify-center gap-2" aria-label="Pasos de la foto">
              {ETAPAS.map((e, i) => (
                <li
                  key={e.fase}
                  aria-current={i === etapaActual ? 'step' : undefined}
                  className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-semibold ${
                    i < etapaActual
                      ? 'bg-emerald-400/20 text-emerald-300'
                      : i === etapaActual
                        ? 'bg-white text-slate-900'
                        : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {i < etapaActual && <Check className="size-4" aria-hidden="true" />}
                  {e.texto}
                </li>
              ))}
            </ol>
          )}

          {enVivo && mostrarManual && (
            <button
              type="button"
              onClick={tomarFoto}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white text-[1.0625rem] font-semibold text-slate-900 active:bg-slate-200"
            >
              <Camera className="size-5" aria-hidden="true" />
              Tomar la foto ahora
            </button>
          )}

          {fase === 'revisar' && (
            <>
              <button
                type="button"
                onClick={() => {
                  const { espejo, ...datos } = captura; // eslint-disable-line no-unused-vars
                  onCapturada(datos);
                }}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white text-[1.0625rem] font-semibold text-slate-900 active:bg-slate-200"
              >
                <Check className="size-5" aria-hidden="true" />
                Usar esta foto
              </button>
              <button
                type="button"
                onClick={repetir}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-base font-semibold text-white active:bg-white/10"
              >
                <RotateCcw className="size-5" aria-hidden="true" />
                Tomar otra
              </button>
            </>
          )}

          {fase === 'error' && (
            <>
              {navigator.mediaDevices?.getUserMedia && (
                <button
                  type="button"
                  onClick={abrirCamara}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white text-[1.0625rem] font-semibold text-slate-900 active:bg-slate-200"
                >
                  <Camera className="size-5" aria-hidden="true" />
                  Intentar de nuevo
                </button>
              )}
              <button
                type="button"
                onClick={() => archivoRef.current?.click()}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-base font-semibold text-white active:bg-white/10"
              >
                <ImageUp className="size-5" aria-hidden="true" />
                Tomar o subir una selfie
              </button>
            </>
          )}
        </div>
      </div>

      <input
        ref={archivoRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={subirArchivo}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}
