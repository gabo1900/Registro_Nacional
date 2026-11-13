import React, { useEffect, useId, useRef } from 'react';
import { ArrowLeft, X, Loader2, AlertCircle, Check, ShieldCheck } from 'lucide-react';

/**
 * Mientras la capa está abierta, deja inerte todo lo que hay detrás
 * (teclado y lector de pantalla no pueden salir de ella) y bloquea el scroll.
 */
export function useFondoInerte(ref) {
  useEffect(() => {
    const marcados = [];
    let nodo = ref.current;
    while (nodo && nodo.parentElement && nodo !== document.body) {
      for (const hermano of nodo.parentElement.children) {
        if (hermano !== nodo && !hermano.inert && !hermano.hasAttribute('data-capa-superior')) {
          hermano.inert = true;
          marcados.push(hermano);
        }
      }
      nodo = nodo.parentElement;
    }
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      marcados.forEach((el) => {
        el.inert = false;
      });
      document.body.style.overflow = overflowPrevio;
    };
  }, [ref]);
}

/**
 * El botón "atrás" del celular navega dentro del asistente en vez de abandonarlo.
 * `manejador` null = ignorar (p. ej. mientras se envía).
 */
export function useBotonAtras(manejador) {
  const ref = useRef(manejador);
  ref.current = manejador;
  useEffect(() => {
    window.history.pushState({ fanpassAsistente: true }, '');
    const alVolver = () => {
      const fn = ref.current;
      window.history.pushState({ fanpassAsistente: true }, '');
      fn?.();
    };
    window.addEventListener('popstate', alVolver);
    return () => window.removeEventListener('popstate', alVolver);
  }, []);
}

/** Las cuatro etapas que ve la persona en todo el registro. */
export const FASES = ['Tus datos', 'Consentimiento', 'Tu cara', 'Listo'];

const PRIVACIDAD = [
  'Usamos tu cara solo para reconocerte al comprar entradas y en la entrada del estadio.',
  'Tus datos se guardan protegidos, en servidores en Chile.',
  'Puedes pedir ver, corregir o borrar tus datos cuando quieras, sin costo.',
];

/** Panel lateral (solo en PC): en qué etapa vas y cómo se cuidan tus datos. */
function PanelLateral({ fase }) {
  return (
    <aside className="hidden overflow-y-auto border-l border-linea bg-fondo lg:block" aria-label="Tu avance">
      <div className="px-10 py-12">
        <h2 className="font-bold text-tinta">Tu registro</h2>
        <ol className="mt-5">
          {FASES.map((f, i) => {
            const hecho = i < fase;
            const actual = i === fase;
            return (
              <li key={f} className="relative flex gap-4 pb-7 last:pb-0">
                {i < FASES.length - 1 && (
                  <span
                    className={`absolute left-[15px] top-9 h-[calc(100%-2.5rem)] w-0.5 ${hecho ? 'bg-marca-700' : 'bg-linea-fuerte'}`}
                    aria-hidden="true"
                  />
                )}
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-full text-[0.9375rem] font-bold ${
                    hecho
                      ? 'bg-marca-700 text-white'
                      : actual
                        ? 'border-2 border-marca-700 bg-superficie text-marca-700'
                        : 'border-2 border-linea-fuerte bg-superficie text-tinta-tenue'
                  }`}
                  aria-hidden="true"
                >
                  {hecho ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                </span>
                <span className={`pt-1 ${actual ? 'font-bold text-tinta' : hecho ? 'text-tinta' : 'text-tinta-tenue'}`}>
                  {f}
                  <span className="sr-only">{hecho ? ' (completado)' : actual ? ' (paso actual)' : ''}</span>
                </span>
              </li>
            );
          })}
        </ol>

        <div className="mt-12 border-t border-linea pt-8">
          <h2 className="flex items-center gap-2 font-bold text-tinta">
            <ShieldCheck className="size-5 text-marca-700" aria-hidden="true" />
            Tus datos están protegidos
          </h2>
          <ul className="mt-4 space-y-3 text-[0.9375rem] leading-relaxed text-tinta-tenue">
            {PRIVACIDAD.map((t) => (
              <li key={t} className="flex gap-2.5">
                <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-tinta-apagada" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-tinta-tenue">Ley N° 19.628 sobre protección de la vida privada.</p>
        </div>
      </div>
    </aside>
  );
}

/**
 * Pantalla de un paso del registro.
 * Celular: ocupa toda la pantalla, título arriba y acción principal abajo, al alcance del pulgar.
 * PC: formulario a la izquierda y, a la derecha, las etapas y la explicación de privacidad.
 */
export function PasoShell({
  etapa,
  fase = 0,
  progreso = 0,
  onAtras,
  onCerrar,
  titulo,
  descripcion,
  onSubmit,
  accion,
  children,
}) {
  const raizRef = useRef(null);
  const tituloRef = useRef(null);
  useFondoInerte(raizRef);

  // Al cambiar de paso llevamos el foco al título para que se anuncie,
  // salvo que el paso ya haya enfocado su campo (autoFocus).
  useEffect(() => {
    const activo = document.activeElement;
    if (activo?.tagName === 'INPUT' && raizRef.current?.contains(activo)) return;
    tituloRef.current?.focus({ preventScroll: true });
  }, [titulo]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  const nombreFase = etapa || FASES[fase];

  return (
    <div
      ref={raizRef}
      className="fixed inset-0 z-40 flex flex-col bg-superficie text-tinta"
    >
      <header className="shrink-0 border-b border-linea pt-[env(safe-area-inset-top)] lg:border-b-0">
        <div className="mx-auto flex h-14 w-full max-w-lg items-center justify-between px-2 lg:h-16 lg:max-w-none lg:px-6">
          {onAtras ? (
            <button
              type="button"
              onClick={onAtras}
              aria-label="Volver al paso anterior"
              className="flex size-12 items-center justify-center rounded-lg text-tinta-suave hover:bg-sutil active:bg-sutil lg:w-auto lg:gap-2 lg:px-3"
            >
              <ArrowLeft className="size-6 lg:size-5" aria-hidden="true" />
              <span className="hidden font-bold lg:inline">Atrás</span>
            </button>
          ) : (
            <span className="size-12" aria-hidden="true" />
          )}
          <span className="text-center text-[0.9375rem] text-tinta-tenue">
            <span className="font-bold text-tinta">Paso {Math.min(fase + 1, FASES.length)} de {FASES.length}</span>
            <span aria-hidden="true"> · </span>
            {nombreFase}
          </span>
          {onCerrar ? (
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Salir del registro"
              className="flex size-12 items-center justify-center rounded-lg text-tinta-suave hover:bg-sutil active:bg-sutil lg:w-auto lg:gap-2 lg:px-3"
            >
              <span className="hidden font-bold lg:inline">Salir</span>
              <X className="size-6 lg:size-5" aria-hidden="true" />
            </button>
          ) : (
            <span className="size-12" aria-hidden="true" />
          )}
        </div>
        <div
          className="h-1 w-full bg-sutil"
          role="progressbar"
          aria-label="Avance del registro"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progreso * 100)}
        >
          <div
            className="h-full bg-marca-700 transition-[width] duration-300 ease-salida motion-reduce:transition-none"
            style={{ width: `${Math.max(4, progreso * 100)}%` }}
          />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 lg:grid lg:grid-cols-[minmax(0,1fr)_26rem] xl:grid-cols-[minmax(0,1fr)_30rem]">
        <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="mx-auto w-full max-w-lg px-5 pb-8 pt-7 sm:pt-10 lg:pt-14">
              <h1
                ref={tituloRef}
                tabIndex={-1}
                className="text-[1.625rem] font-bold leading-tight tracking-tight outline-none lg:text-titulo-2"
              >
                {titulo}
              </h1>
              {descripcion && (
                <p className="mt-2 text-[1.0625rem] leading-relaxed text-tinta-tenue">{descripcion}</p>
              )}
              <div className="mt-7">{children}</div>
            </div>
          </main>

          {accion && (
            <footer className="shrink-0 border-t border-linea bg-superficie">
              <div className="mx-auto w-full max-w-lg space-y-2 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
                {accion}
              </div>
            </footer>
          )}
        </form>

        <PanelLateral fase={fase} />
      </div>
    </div>
  );
}

export function BotonPrincipal({ children, cargando = false, type = 'submit', className = '', ...props }) {
  return (
    <button
      type={type}
      disabled={cargando || props.disabled}
      aria-busy={cargando || undefined}
      className={`flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-marca-700 px-5 text-[1.0625rem] font-bold text-white transition-colors hover:bg-marca-800 active:bg-marca-900 disabled:bg-marca-700/50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-marca-700 ${className}`}
      {...props}
    >
      {cargando && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function BotonSecundario({ children, type = 'button', className = '', ...props }) {
  return (
    <button
      type={type}
      className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-base font-bold text-marca-700 hover:bg-marca-50 active:bg-marca-100 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-marca-700 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Campo({ label, error, ayuda, prefijo, accesorio, inputRef, id: idProp, ...props }) {
  const autoId = useId();
  const id = idProp || autoId;
  const ayudaId = `${id}-ayuda`;
  const errorId = `${id}-error`;
  const describedBy = [error ? errorId : null, ayuda ? ayudaId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-[0.9375rem] font-bold text-tinta">
        {label}
      </label>
      <div
        className={`flex h-14 items-center rounded-xl border bg-superficie transition-colors focus-within:ring-3 ${
          error
            ? 'border-error-700 focus-within:ring-error-700/20'
            : 'border-linea-fuerte hover:border-tinta-apagada focus-within:border-marca-700 focus-within:ring-marca-700/15'
        }`}
      >
        {prefijo && (
          <span className="pl-4 pr-1 text-[1.0625rem] text-tinta-tenue select-none" aria-hidden="true">
            {prefijo}
          </span>
        )}
        <input
          id={id}
          ref={inputRef}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`h-full min-w-0 flex-1 rounded-xl bg-transparent text-[1.0625rem] text-tinta outline-none placeholder:text-tinta-apagada ${
            prefijo ? 'pr-4' : 'px-4'
          }`}
          {...props}
        />
        {accesorio}
      </div>
      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 text-sm text-error-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : (
        ayuda && (
          <p id={ayudaId} className="text-sm text-tinta-tenue">
            {ayuda}
          </p>
        )
      )}
    </div>
  );
}

/** Tarjeta seleccionable grande, pensada para tocar con el pulgar. */
export function Opcion({ seleccionada, onClick, titulo, detalle, icono, role = 'radio' }) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={role === 'radio' ? !!seleccionada : undefined}
      onClick={onClick}
      className={`flex min-h-16 w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-marca-700 ${
        seleccionada
          ? 'border-marca-700 bg-marca-50 ring-1 ring-marca-700'
          : 'border-linea bg-white active:bg-fondo'
      }`}
    >
      {icono && <span className="shrink-0 text-tinta-tenue">{icono}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-base font-bold text-tinta">{titulo}</span>
        {detalle && <span className="mt-0.5 block text-sm text-tinta-tenue">{detalle}</span>}
      </span>
      {role === 'radio' && (
        <span
          className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${
            seleccionada ? 'border-marca-700 bg-marca-700 text-white' : 'border-linea-fuerte'
          }`}
          aria-hidden="true"
        >
          {seleccionada && <Check className="size-4" strokeWidth={3} />}
        </span>
      )}
    </button>
  );
}

export function Aviso({ children, tono = 'error' }) {
  const ref = useRef(null);
  // Si el aviso queda bajo el borde de la pantalla, lo traemos a la vista.
  useEffect(() => {
    if (!children || !ref.current) return;
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    ref.current.scrollIntoView({ block: 'nearest', behavior: suave ? 'smooth' : 'auto' });
  }, [children]);
  if (!children) return null;
  const estilos =
    tono === 'error'
      ? 'bg-error-50 text-error-800 border-error-200'
      : 'bg-aviso-50 text-aviso-900 border-aviso-200';
  return (
    <div ref={ref} role="alert" className={`flex scroll-mb-4 items-start gap-2.5 rounded-xl border p-3.5 text-[0.9375rem] ${estilos}`}>
      <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

/** Fila de resumen con dato enmascarado. */
export function FilaResumen({ etiqueta, valor, onEditar }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3.5">
      <div className="min-w-0">
        <div className="text-sm text-tinta-tenue">{etiqueta}</div>
        <div className="truncate text-base font-bold text-tinta tabular-nums">{valor}</div>
      </div>
      {onEditar && (
        <button
          type="button"
          onClick={onEditar}
          className="h-11 shrink-0 rounded-xl px-3 text-[0.9375rem] font-bold text-marca-700 active:bg-marca-50"
        >
          Cambiar
        </button>
      )}
    </div>
  );
}
