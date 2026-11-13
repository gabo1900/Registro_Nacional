import React, { useEffect, useRef, useState } from 'react';
import { X, ListOrdered, ChevronDown, CircleCheck } from 'lucide-react';
import { TERMINOS_SECCIONES } from '../data/terminosAnfp';
import { useFondoInerte } from '../registro/ui';
import { Boton } from './ui';

// Títulos legibles para cada cláusula (el texto legal no cambia).
const TITULOS = {
  primero: 'General',
  segundo: 'Sobre el servicio',
  tercero: 'Sobre el usuario',
  cuarto: 'Acceso al servicio durante el registro',
  quinto: 'Protección de datos personales',
  sexto: 'Incumplimiento de las condiciones de uso',
  septimo: 'Cambios, suspensión o término del servicio',
  octavo: 'Disposiciones finales',
};

const tituloDe = (sec, i) => `${i + 1}. ${TITULOS[sec.id] || sec.titulo}`;

/** Separa el número de cláusula ("5.1.", "2.1.-", "5.8 - 5.10.") para destacarlo. */
function Parrafo({ texto }) {
  const m = texto.match(/^(\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?\.?-?)\s+(.*)$/s);
  if (!m) return <p>{texto}</p>;
  const [, numero, resto] = m;
  const dosPuntos = resto.indexOf(':');
  const tieneTitulo = dosPuntos > 0 && dosPuntos < 80;
  return (
    <p>
      <strong className="font-bold text-tinta tabular-nums">{numero.replace(/[.-]+$/, '')}</strong>{' '}
      {tieneTitulo ? (
        <>
          <strong className="font-bold text-tinta">{resto.slice(0, dosPuntos)}:</strong>
          {resto.slice(dosPuntos + 1)}
        </>
      ) : (
        resto
      )}
    </p>
  );
}

function Contenido({ onCerrar, onAcceptTerms }) {
  const raizRef = useRef(null);
  const cerrarRef = useRef(null);
  const lectorRef = useRef(null);
  const [actual, setActual] = useState(TERMINOS_SECCIONES[0].id);
  const [indiceAbierto, setIndiceAbierto] = useState(false);
  const cerrarFnRef = useRef(onCerrar);
  cerrarFnRef.current = onCerrar;
  useFondoInerte(raizRef);

  // Foco al abrir, Escape para cerrar y devolver el foco al cerrar.
  useEffect(() => {
    const previo = document.activeElement;
    cerrarRef.current?.focus();
    const alTeclear = (e) => {
      if (e.key === 'Escape') cerrarFnRef.current();
    };
    window.addEventListener('keydown', alTeclear);
    return () => {
      window.removeEventListener('keydown', alTeclear);
      previo?.focus?.();
    };
  }, []);

  // Resalta en el índice la cláusula que se está leyendo.
  useEffect(() => {
    const raiz = lectorRef.current;
    if (!raiz || !('IntersectionObserver' in window)) return undefined;
    const obs = new IntersectionObserver(
      (entradas) => {
        const visible = entradas.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActual(visible.target.id.replace('clausula-', ''));
      },
      { root: raiz, rootMargin: '0px 0px -70% 0px' }
    );
    raiz.querySelectorAll('section[id^="clausula-"]').forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  const irA = (id) => {
    setIndiceAbierto(false);
    const destino = document.getElementById(`clausula-${id}`);
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    destino?.scrollIntoView({ behavior: suave ? 'smooth' : 'auto', block: 'start' });
    destino?.focus({ preventScroll: true });
    setActual(id);
  };

  const Indice = ({ compacto }) => (
    <ol className="space-y-0.5">
      {TERMINOS_SECCIONES.map((sec, i) => {
        const sel = actual === sec.id;
        return (
          <li key={sec.id}>
            <a
              href={`#clausula-${sec.id}`}
              onClick={(e) => {
                e.preventDefault();
                irA(sec.id);
              }}
              aria-current={sel ? 'location' : undefined}
              className={`flex min-h-11 items-center rounded-lg px-3 py-2 text-[0.9375rem] leading-snug no-underline transition-colors ${
                sel && !compacto ? 'bg-marca-50 font-bold text-marca-800' : 'text-tinta-suave hover:bg-sutil hover:text-tinta'
              }`}
            >
              {tituloDe(sec, i)}
            </a>
          </li>
        );
      })}
    </ol>
  );

  return (
    <div
      ref={raizRef}
      data-capa-superior
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-tinta/60 sm:items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="terminos-titulo"
        className="flex h-full w-full max-w-6xl flex-col overflow-hidden bg-superficie shadow-elevada sm:h-[min(92vh,60rem)] sm:rounded-2xl"
      >
        {/* Encabezado */}
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-linea px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 sm:pt-6">
          <div>
            <h2 id="terminos-titulo" className="text-titulo-3 font-bold leading-tight sm:text-titulo-2">
              Términos y condiciones
            </h2>
            <p className="mt-1 text-[0.9375rem] text-tinta-tenue">Registro Nacional de Hinchas · ANFP</p>
          </div>
          <button
            ref={cerrarRef}
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar términos y condiciones"
            className="-mr-2 grid size-12 shrink-0 place-items-center rounded-xl text-tinta-suave hover:bg-sutil"
          >
            <X className="size-6" aria-hidden="true" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1">
          {/* Índice lateral (PC) */}
          <nav aria-label="Índice" className="hidden w-80 shrink-0 overflow-y-auto border-r border-linea bg-fondo p-4 md:block">
            <h3 className="px-3 pb-2 pt-1 font-bold text-tinta">Índice</h3>
            <Indice />
          </nav>

          {/* Texto */}
          <div ref={lectorRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {/* Índice desplegable (celular) */}
            <div className="sticky top-0 z-10 border-b border-linea bg-superficie/95 px-5 py-2 backdrop-blur md:hidden">
              <button
                type="button"
                onClick={() => setIndiceAbierto((v) => !v)}
                aria-expanded={indiceAbierto}
                aria-controls="terminos-indice-movil"
                className="flex min-h-12 w-full items-center gap-3 rounded-xl text-left font-bold"
              >
                <ListOrdered className="size-5 shrink-0 text-tinta-tenue" aria-hidden="true" />
                <span className="flex-1">Índice</span>
                <ChevronDown className={`size-5 transition-transform motion-reduce:transition-none ${indiceAbierto ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              {indiceAbierto && (
                <nav id="terminos-indice-movil" aria-label="Índice" className="pb-2">
                  <Indice compacto />
                </nav>
              )}
            </div>

            <article className="mx-auto max-w-[70ch] px-5 py-6 sm:px-8 sm:py-10">
              <p className="rounded-xl border border-marca-200 bg-marca-50 p-4 leading-relaxed text-marca-900">
                <strong>En simple:</strong> para usar el registro debes aceptar estos términos y autorizar
                expresamente el uso de tu cara (datos biométricos). Sin esa autorización no es posible registrarte.
              </p>

              {TERMINOS_SECCIONES.map((sec, i) => (
                <section
                  key={sec.id}
                  id={`clausula-${sec.id}`}
                  tabIndex={-1}
                  aria-labelledby={`clausula-${sec.id}-t`}
                  className="scroll-mt-20 pt-10 outline-none md:scroll-mt-4"
                >
                  <h3 id={`clausula-${sec.id}-t`} className="text-titulo-3 font-bold leading-snug">
                    {tituloDe(sec, i)}
                  </h3>
                  <div className="mt-4 space-y-4 text-[1.0625rem] leading-[1.7] text-tinta-suave">
                    {sec.contenido.map((parrafo) => (
                      <Parrafo key={parrafo.slice(0, 40)} texto={parrafo} />
                    ))}
                  </div>
                </section>
              ))}
            </article>
          </div>
        </div>

        {/* Pie */}
        <footer className="flex shrink-0 flex-col-reverse gap-3 border-t border-linea bg-fondo px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-sm text-tinta-tenue">
            Dudas sobre tus datos:{' '}
            <a href="mailto:ifierro@anfpchile.cl" className="font-bold text-marca-700 underline decoration-marca-200">
              ifierro@anfpchile.cl
            </a>
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            {onAcceptTerms && (
              <Boton
                onClick={() => {
                  onAcceptTerms();
                  onCerrar();
                }}
                icono={<CircleCheck className="size-5" aria-hidden="true" />}
              >
                Leí y acepto
              </Boton>
            )}
            <Boton variante={onAcceptTerms ? 'secundario' : 'principal'} onClick={onCerrar} className="sm:min-w-32">
              Cerrar
            </Boton>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function TermsModal({ isOpen, onClose, onAcceptTerms }) {
  if (!isOpen) return null;
  return <Contenido onCerrar={onClose} onAcceptTerms={onAcceptTerms} />;
}
