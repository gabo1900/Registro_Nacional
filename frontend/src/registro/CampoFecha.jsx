import React, { useId, useRef, useState } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** Devuelve 'AAAA-MM-DD' si día/mes/año forman una fecha real; si no, ''. */
export function componerFecha({ dia, mes, anio }) {
  const d = Number(dia);
  const m = Number(mes);
  const a = Number(anio);
  if (!d || !m || String(anio).length !== 4) return '';
  const fecha = new Date(a, m - 1, d);
  if (fecha.getFullYear() !== a || fecha.getMonth() !== m - 1 || fecha.getDate() !== d) return '';
  return `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

const separar = (iso) => {
  const [anio = '', mes = '', dia = ''] = (iso || '').split('-');
  return { dia: dia.replace(/^0/, ''), mes: mes.replace(/^0/, ''), anio };
};

const base =
  'h-14 w-full rounded-xl border bg-white text-[1.0625rem] text-tinta outline-none transition-colors focus:ring-3';

/**
 * Fecha en tres campos (día, mes, año). Para una fecha de nacimiento es más
 * rápido escribirla que navegar décadas hacia atrás en un calendario.
 */
export default function CampoFecha({ label, valor, onCambio, error }) {
  const id = useId();
  const [partes, setPartes] = useState(() => separar(valor));
  const mesRef = useRef(null);
  const anioRef = useRef(null);

  const cambiar = (campo, v) => {
    const nuevas = { ...partes, [campo]: v };
    setPartes(nuevas);
    onCambio(componerFecha(nuevas), nuevas);
  };

  const borde = error
    ? 'border-error-700 focus:ring-error-700/20'
    : 'border-linea-fuerte focus:border-marca-700 focus:ring-marca-700/15';
  const errorId = `${id}-error`;
  const describedBy = error ? errorId : undefined;

  return (
    <fieldset aria-describedby={describedBy}>
      <legend className="mb-2 block text-[0.9375rem] font-bold text-tinta">{label}</legend>
      <div className="grid grid-cols-[1fr_1.75fr_1.25fr] gap-3">
        <div className="space-y-1.5">
          <label htmlFor={`${id}-d`} className="block text-sm text-tinta-tenue">Día</label>
          <input
            id={`${id}-d`}
            autoFocus
            inputMode="numeric"
            autoComplete="bday-day"
            enterKeyHint="next"
            placeholder="DD"
            maxLength={2}
            value={partes.dia}
            aria-invalid={error ? true : undefined}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 2);
              cambiar('dia', v);
              if (v.length === 2 || Number(v) > 3) mesRef.current?.focus();
            }}
            className={`${base} ${borde} px-4 text-center tabular-nums placeholder:text-tinta-apagada`}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${id}-m`} className="block text-sm text-tinta-tenue">Mes</label>
          <div className="relative">
            <select
              id={`${id}-m`}
              ref={mesRef}
              autoComplete="bday-month"
              value={partes.mes}
              aria-invalid={error ? true : undefined}
              onChange={(e) => {
                cambiar('mes', e.target.value);
                if (e.target.value) anioRef.current?.focus();
              }}
              className={`${base} ${borde} appearance-none pl-4 pr-9 ${partes.mes ? '' : 'text-tinta-apagada'}`}
            >
              <option value="" disabled>Mes</option>
              {MESES.map((m, i) => (
                <option key={m} value={String(i + 1)} className="text-tinta">
                  {m}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-tinta-tenue"
              aria-hidden="true"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${id}-a`} className="block text-sm text-tinta-tenue">Año</label>
          <input
            id={`${id}-a`}
            ref={anioRef}
            inputMode="numeric"
            autoComplete="bday-year"
            enterKeyHint="done"
            placeholder="AAAA"
            maxLength={4}
            value={partes.anio}
            aria-invalid={error ? true : undefined}
            onChange={(e) => cambiar('anio', e.target.value.replace(/\D/g, '').slice(0, 4))}
            className={`${base} ${borde} px-4 text-center tabular-nums placeholder:text-tinta-apagada`}
          />
        </div>
      </div>
      {error && (
        <p id={errorId} className="mt-2 flex items-start gap-1.5 text-sm text-error-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </fieldset>
  );
}
