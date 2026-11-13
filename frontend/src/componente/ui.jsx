import React from 'react';
import { Loader2, CircleCheck, TriangleAlert, CircleAlert, Info, ChevronDown, X } from 'lucide-react';

/*
 * Componentes base del sistema de diseño RNH.
 * Todos usan los tokens de index.css (marca, tinta, ok, aviso, error).
 */

const cx = (...c) => c.filter(Boolean).join(' ');

const VARIANTES_BOTON = {
  principal:
    'bg-marca-700 text-white shadow-tarjeta hover:bg-marca-800 active:bg-marca-900 disabled:bg-marca-700/50 disabled:shadow-none',
  secundario:
    'border border-linea-fuerte bg-superficie text-tinta hover:bg-fondo hover:border-tinta-apagada active:bg-linea disabled:text-tinta-apagada',
  texto: 'text-marca-700 hover:bg-marca-50 active:bg-marca-100 disabled:text-tinta-apagada',
  peligro: 'border border-error-200 bg-superficie text-error-700 hover:bg-error-50',
  claro: 'bg-white text-tinta hover:bg-marca-50 active:bg-marca-100',
  'claro-borde': 'border border-white/40 text-white hover:bg-white/10 active:bg-white/15',
};

const TAMANOS_BOTON = {
  md: 'min-h-12 px-5 text-base',
  lg: 'min-h-14 px-6 text-[1.0625rem]',
  sm: 'min-h-11 px-3.5 text-[0.9375rem]',
};

export function Boton({
  variante = 'principal',
  tamano = 'md',
  cargando = false,
  ancho = false,
  icono,
  iconoFinal,
  className = '',
  children,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={cargando || props.disabled}
      aria-busy={cargando || undefined}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-colors duration-150 disabled:cursor-not-allowed',
        VARIANTES_BOTON[variante],
        TAMANOS_BOTON[tamano],
        ancho && 'w-full',
        className
      )}
      {...props}
    >
      {cargando ? (
        <Loader2 className="size-5 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" />
      ) : (
        icono
      )}
      {children}
      {!cargando && iconoFinal}
    </button>
  );
}

export function Tarjeta({ as: Tag = 'section', className = '', children, ...props }) {
  return (
    <Tag
      className={cx('rounded-2xl border border-linea bg-superficie shadow-tarjeta', className)}
      {...props}
    >
      {children}
    </Tag>
  );
}

const TONOS_BADGE = {
  ok: 'bg-ok-50 text-ok-800 ring-ok-200',
  aviso: 'bg-aviso-50 text-aviso-900 ring-aviso-200',
  error: 'bg-error-50 text-error-800 ring-error-200',
  marca: 'bg-marca-50 text-marca-800 ring-marca-200',
  neutro: 'bg-fondo text-tinta-suave ring-linea',
};

const ICONO_TONO = { ok: CircleCheck, aviso: TriangleAlert, error: CircleAlert, marca: Info, neutro: Info };

/** Etiqueta de estado. Siempre lleva ícono para no depender solo del color. */
export function Badge({ tono = 'neutro', conIcono = true, children, className = '' }) {
  const Icono = ICONO_TONO[tono];
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-sm font-bold ring-1 ring-inset',
        TONOS_BADGE[tono],
        className
      )}
    >
      {conIcono && <Icono className="size-4 shrink-0" aria-hidden="true" />}
      {children}
    </span>
  );
}

const TONOS_ALERTA = {
  ok: 'border-ok-200 bg-ok-50 text-ok-800',
  aviso: 'border-aviso-200 bg-aviso-50 text-aviso-900',
  error: 'border-error-200 bg-error-50 text-error-800',
  info: 'border-marca-200 bg-marca-50 text-marca-900',
};
const ICONO_ALERTA = { ok: CircleCheck, aviso: TriangleAlert, error: CircleAlert, info: Info };

/** Mensaje de estado: qué pasó y, si es un problema, cómo solucionarlo. */
export function Alerta({ tono = 'info', titulo, children, onCerrar, accion, className = '' }) {
  const Icono = ICONO_ALERTA[tono];
  return (
    <div
      role={tono === 'error' ? 'alert' : 'status'}
      className={cx('flex items-start gap-3 rounded-xl border p-4', TONOS_ALERTA[tono], className)}
    >
      <Icono className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 space-y-1">
        {titulo && <p className="font-bold">{titulo}</p>}
        {children && <div className="text-[0.9375rem] leading-relaxed">{children}</div>}
        {accion && <div className="pt-2">{accion}</div>}
      </div>
      {onCerrar && (
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar mensaje"
          className="-m-2 grid size-11 shrink-0 place-items-center rounded-xl hover:bg-black/5"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/** Estado vacío: qué significa y, si aplica, qué puede hacer la persona. */
export function EstadoVacio({ icono: Icono, titulo, children, accion }) {
  return (
    <div className="rounded-xl border border-dashed border-linea-fuerte bg-fondo px-5 py-8 text-center">
      {Icono && (
        <span className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-superficie text-tinta-tenue shadow-tarjeta">
          <Icono className="size-6" aria-hidden="true" />
        </span>
      )}
      <p className="font-bold text-tinta">{titulo}</p>
      {children && <p className="mx-auto mt-1 max-w-sm text-[0.9375rem] text-tinta-tenue">{children}</p>}
      {accion && <div className="mt-4">{accion}</div>}
    </div>
  );
}

export function Esqueleto({ className = '' }) {
  return <div className={cx('animate-pulse rounded-xl bg-linea motion-reduce:animate-none', className)} aria-hidden="true" />;
}

/** Desplegable nativo (details/summary): accesible sin JavaScript extra. */
export function Desplegable({ titulo, icono: Icono, children, abierto, className = '', tema = 'claro' }) {
  const oscuro = tema === 'oscuro';
  return (
    <details
      open={abierto}
      className={cx(
        'group rounded-xl border',
        oscuro ? 'border-white/15' : 'border-linea bg-superficie',
        className
      )}
    >
      <summary
        className={cx(
          'flex min-h-12 list-none items-center gap-3 rounded-xl px-4 py-3 font-bold',
          oscuro ? 'hover:bg-white/5' : 'hover:bg-fondo'
        )}
      >
        {Icono && <Icono className={cx('size-5 shrink-0', oscuro ? 'text-white/70' : 'text-tinta-tenue')} aria-hidden="true" />}
        <span className="flex-1">{titulo}</span>
        <ChevronDown
          className="size-5 shrink-0 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </summary>
      <div className={cx('px-4 pb-4 pt-1 text-[0.9375rem] leading-relaxed', oscuro ? 'text-white/80' : 'text-tinta-tenue')}>
        {children}
      </div>
    </details>
  );
}

/**
 * Marca del RNH: sigla + filete + nombre, como un sello institucional.
 * Sin ícono en caja de color ni degradados.
 */
export function Logo({ compacto = false, claro = false }) {
  return (
    <span className="flex items-center gap-3 whitespace-nowrap text-left">
      <span
        className={cx(
          'text-[1.625rem] font-bold leading-none tracking-[-0.03em]',
          claro ? 'text-white' : 'text-marca-800'
        )}
      >
        RNH
      </span>
      <span className={cx('h-8 w-px', claro ? 'bg-white/35' : 'bg-linea-fuerte')} aria-hidden="true" />
      <span className={cx('leading-[1.15]', compacto ? 'text-[0.8125rem]' : 'text-[0.9375rem]')}>
        <span className={cx('block font-bold', claro ? 'text-white' : 'text-tinta')}>Registro Nacional</span>
        <span className={cx('block', claro ? 'text-white/75' : 'text-tinta-tenue')}>de Hinchas · Chile</span>
      </span>
    </span>
  );
}

export const Contenedor = ({ className = '', children }) => (
  <div className={cx('mx-auto w-full max-w-[75rem] px-4 sm:px-6 lg:px-8', className)}>{children}</div>
);
