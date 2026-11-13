import React, { useState, useRef, useEffect } from 'react';
import { Camera, ImageUp, RotateCcw, Check, IdCard, AlertCircle } from 'lucide-react';
import { BotonPrincipal, BotonSecundario, Aviso } from './ui';

/**
 * Comprime y redimensiona una imagen antes de enviarla, garantizando
 * transferencia instantánea y máxima legibilidad forense para el OCR.
 */
function procesarYComprimirArchivo(file, maxW = 1200, maxH = 900, calidad = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > maxW || h > maxH) {
          const ratio = Math.min(maxW / w, maxH / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', calidad));
      };
      img.onerror = () => reject(new Error('No se pudo procesar la imagen seleccionada.'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Componente para captura y subida fotográfica de la Cédula de Identidad o Pasaporte.
 * Permite capturar con la cámara del dispositivo o subir una foto nítida del anverso.
 */
export default function CapturaDocumento({ tipoDocumento, onCapturada, onCancelar }) {
  const [modo, setModo] = useState('inicio'); // inicio | camara | preview
  const [fotoBase64, setFotoBase64] = useState(null);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const archivoInputRef = useRef(null);

  const detenerCamara = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => detenerCamara();
  }, []);

  const iniciarCamara = async () => {
    setError('');
    setModo('camara');
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Tu navegador no permite abrir la cámara directamente. Puedes subir la foto.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      detenerCamara();
      setModo('inicio');
      setError('No pudimos acceder a la cámara trasera. Por favor sube una foto de tu cédula.');
    }
  };

  const dispararFoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setError('La cámara aún no está lista. Espera un segundo e intenta de nuevo, o sube una foto de tu cédula.');
      return;
    }
    setError('');

    const canvas = document.createElement('canvas');
    canvas.width = Math.min(1080, video.videoWidth);
    canvas.height = Math.round((canvas.width / video.videoWidth) * video.videoHeight);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const b64 = canvas.toDataURL('image/jpeg', 0.85);
    detenerCamara();
    setFotoBase64(b64);
    setModo('preview');
  };

  const manejarArchivo = async (e) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return setError('Por favor selecciona un archivo de imagen válido (JPG, PNG).');
    }

    try {
      const b64 = await procesarYComprimirArchivo(file);
      setFotoBase64(b64);
      setModo('preview');
    } catch (err) {
      setError('No pudimos procesar la imagen seleccionada. Intenta con otra foto.');
    }
  };

  const reintentar = () => {
    setFotoBase64(null);
    setModo('inicio');
    setError('');
  };

  const nombreDoc = tipoDocumento === 'PASAPORTE' ? 'Pasaporte' : 'Cédula de Identidad';

  return (
    <div className="space-y-4">
      {error && <Aviso tono="aviso">{error}</Aviso>}

      {modo === 'inicio' && (
        <div className="rounded-2xl border-2 border-dashed border-linea-fuerte bg-superficie p-6 text-center space-y-4">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-marca-50 text-marca-700">
            <IdCard className="size-8" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-tinta">Foto del anverso de tu {nombreDoc}</h3>
            <p className="mt-1 text-sm text-tinta-tenue">
              Asegúrate de que la foto, el RUN y tu nombre sean legibles y sin reflejos de luz.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={iniciarCamara}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-marca-700 py-3.5 px-4 font-bold text-white hover:bg-marca-800 transition"
            >
              <Camera className="size-5" />
              Tomar foto con cámara
            </button>
            <button
              type="button"
              onClick={() => archivoInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-linea-fuerte bg-superficie py-3.5 px-4 font-bold text-tinta hover:bg-fondo transition"
            >
              <ImageUp className="size-5" />
              Subir foto desde archivo
            </button>
          </div>
        </div>
      )}

      {modo === 'camara' && (
        <div className="relative overflow-hidden rounded-2xl bg-black text-white shadow-xl">
          <div className="relative aspect-[16/10] w-full overflow-hidden">
            <video ref={videoRef} playsInline autoPlay muted className="size-full object-cover" />

            {/* Guía rectangular del documento */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
              <div className="w-full max-w-sm aspect-[1.58] rounded-xl border-2 border-dashed border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] flex flex-col justify-between p-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/90 bg-black/40 px-2 py-0.5 rounded self-start">
                  Ubica el documento aquí
                </span>
                <span className="text-[11px] text-white/90 bg-black/40 px-2 py-0.5 rounded self-center">
                  Evita sombras y reflejos
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-950/80 gap-3">
            <button
              type="button"
              onClick={() => {
                detenerCamara();
                setModo('inicio');
              }}
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={dispararFoto}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-slate-900 font-extrabold hover:bg-slate-200 transition"
            >
              <Camera className="size-5" />
              Capturar
            </button>
          </div>
        </div>
      )}

      {modo === 'preview' && fotoBase64 && (
        <div className="space-y-4 rounded-2xl border border-linea bg-superficie p-4">
          <div className="relative overflow-hidden rounded-xl border border-linea aspect-[16/10] bg-slate-900">
            <img src={fotoBase64} alt="Documento capturado" className="size-full object-contain" />
            <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2.5 py-1 text-xs font-bold text-white flex items-center gap-1.5">
              <Check className="size-3.5 text-ok-400" /> Cédula capturada
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => onCapturada(fotoBase64)}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-ok-700 py-3.5 px-4 font-bold text-white hover:bg-ok-800 transition"
            >
              <Check className="size-5" />
              Confirmar esta foto
            </button>
            <button
              type="button"
              onClick={reintentar}
              className="flex items-center justify-center gap-2 rounded-xl border border-linea-fuerte px-4 py-3.5 font-bold text-tinta hover:bg-fondo transition"
            >
              <RotateCcw className="size-4" />
              Tomar otra
            </button>
          </div>
        </div>
      )}

      <input
        ref={archivoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={manejarArchivo}
      />
    </div>
  );
}
