import React, { useEffect, useId, useRef } from 'react';
import { ArrowLeft, X, Loader2, AlertCircle, Check } from 'lucide-react';

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
    window.history.pushState({ rnhAsistente: true }, '');
    const alVolver = () => {
      const fn = ref.current;
      window.history.pushState({ rnhAsistente: true }, '');
      fn?.();
    };
    window.addEventListener('popstate', alVolver);
    return () => window.removeEventListener('popstate', alVolver);
  }, []);
}

/**
 * Pantalla de un paso del registro. Ocupa toda la pantalla del celular,
 * con el título arriba y la acción principal abajo, al alcance del pulgar.
 */
export function PasoShell({
  etapa,
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

  return (
    <div
      ref={raizRef}
      className="fixed inset-0 z-40 flex flex-col bg-white text-slate-900 caret-blue-700 selection:bg-blue-100 selection:text-blue-950"
    >
      <header className="shrink-0 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 w-full max-w-md items-center justify-between px-2">
          {onAtras ? (
            <button
              type="button"
              onClick={onAtras}
              aria-label="Volver al paso anterior"
              className="grid size-12 place-items-center rounded-full text-slate-700 active:bg-slate-100"
            >
              <ArrowLeft className="size-6" aria-hidden="true" />
            </button>
          ) : (
            <span className="size-12" aria-hidden="true" />
          )}
          <span className="text-sm font-medium text-slate-500">{etapa}</span>
          {onCerrar ? (
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Salir del registro"
              className="grid size-12 place-items-center rounded-full text-slate-700 active:bg-slate-100"
            >
              <X className="size-6" aria-hidden="true" />
            </button>
          ) : (
            <span className="size-12" aria-hidden="true" />
          )}
        </div>
        <div
          className="h-1 w-full bg-slate-100"
          role="progressbar"
          aria-label="Avance del registro"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progreso * 100)}
        >
          <div
            className="h-full bg-blue-700 transition-[width] duration-300 ease-out motion-reduce:transition-none"
            style={{ width: `${Math.max(4, progreso * 100)}%` }}
          />
        </div>
      </header>

      <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto w-full max-w-md px-5 pb-8 pt-7">
            <h1
              ref={tituloRef}
              tabIndex={-1}
              className="text-[1.625rem] font-bold leading-tight tracking-tight text-balance outline-none"
            >
              {titulo}
            </h1>
            {descripcion && (
              <p className="mt-2 text-base leading-relaxed text-slate-600 text-pretty">{descripcion}</p>
            )}
            <div className="mt-7">{children}</div>
          </div>
        </main>

        {accion && (
          <footer className="shrink-0 border-t border-slate-100 bg-white">
            <div className="mx-auto w-full max-w-md space-y-2 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
              {accion}
            </div>
          </footer>
        )}
      </form>
    </div>
  );
}

export function BotonPrincipal({ children, cargando = false, type = 'submit', className = '', ...props }) {
  return (
    <button
      type={type}
      disabled={cargando || props.disabled}
      aria-busy={cargando || undefined}
      className={`flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 text-[1.0625rem] font-semibold text-white transition-colors active:bg-blue-800 disabled:bg-blue-700/50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${className}`}
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
      className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 text-base font-semibold text-blue-700 active:bg-blue-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${className}`}
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
      <label htmlFor={id} className="block text-[0.9375rem] font-medium text-slate-800">
        {label}
      </label>
      <div
        className={`flex h-14 items-center rounded-xl border bg-white transition-colors focus-within:ring-3 ${
          error
            ? 'border-red-600 focus-within:ring-red-600/20'
            : 'border-slate-300 focus-within:border-blue-700 focus-within:ring-blue-700/15'
        }`}
      >
        {prefijo && (
          <span className="pl-4 pr-1 text-[1.0625rem] text-slate-500 select-none" aria-hidden="true">
            {prefijo}
          </span>
        )}
        <input
          id={id}
          ref={inputRef}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`h-full min-w-0 flex-1 rounded-xl bg-transparent text-[1.0625rem] text-slate-900 outline-none placeholder:text-slate-400 ${
            prefijo ? 'pr-4' : 'px-4'
          }`}
          {...props}
        />
        {accesorio}
      </div>
      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : (
        ayuda && (
          <p id={ayudaId} className="text-sm text-slate-500">
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
      className={`flex min-h-16 w-full items-center gap-4 rounded-2xl border px-4 py-3.5 text-left transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
        seleccionada
          ? 'border-blue-700 bg-blue-50 ring-1 ring-blue-700'
          : 'border-slate-200 bg-white active:bg-slate-50'
      }`}
    >
      {icono && <span className="shrink-0 text-slate-600">{icono}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold text-slate-900">{titulo}</span>
        {detalle && <span className="mt-0.5 block text-sm text-slate-500">{detalle}</span>}
      </span>
      {role === 'radio' && (
        <span
          className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${
            seleccionada ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-300'
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
      ? 'bg-red-50 text-red-800 border-red-200'
      : 'bg-amber-50 text-amber-900 border-amber-200';
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
        <div className="text-sm text-slate-500">{etiqueta}</div>
        <div className="truncate text-base font-medium text-slate-900 tabular-nums">{valor}</div>
      </div>
      {onEditar && (
        <button
          type="button"
          onClick={onEditar}
          className="h-11 shrink-0 rounded-xl px-3 text-[0.9375rem] font-semibold text-blue-700 active:bg-blue-50"
        >
          Cambiar
        </button>
      )}
    </div>
  );
}
