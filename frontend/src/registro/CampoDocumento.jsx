import React, { useRef, useState } from 'react';
import { Campo } from './ui';
import { formatearRut, rutEsValido, pasaporteEsValido, enmascararDocumento } from './formato';

export const documentoEsValido = (tipo, valor) =>
  tipo === 'CEDULA_CHILE' ? rutEsValido(valor) : pasaporteEsValido(valor);

export const errorDocumento = (tipo) =>
  tipo === 'CEDULA_CHILE'
    ? 'Revisa tu RUT. El número o el dígito final no coinciden.'
    : 'Revisa tu pasaporte. Usa solo letras y números (6 a 12).';

/**
 * Selector cédula/pasaporte + campo con formato automático.
 * Cuando el dato es válido y el campo no está en uso, se muestra enmascarado.
 */
export default function CampoDocumento({ tipo, valor, onTipo, onValor, error }) {
  const [enFoco, setEnFoco] = useState(false);
  const inputRef = useRef(null);
  const esRut = tipo === 'CEDULA_CHILE';
  const enmascarar = !enFoco && documentoEsValido(tipo, valor);

  return (
    <>
      <div role="radiogroup" aria-label="Tipo de documento" className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-sutil p-1">
        {[
          ['CEDULA_CHILE', 'Cédula chilena'],
          ['PASAPORTE', 'Pasaporte'],
        ].map(([v, texto]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={tipo === v}
            onClick={() => {
              if (tipo === v) return;
              onTipo(v);
              onValor('');
            }}
            className={`h-12 rounded-xl text-[0.9375rem] font-bold transition-colors ${
              tipo === v ? 'bg-superficie text-tinta shadow-tarjeta' : 'text-tinta-tenue'
            }`}
          >
            {texto}
          </button>
        ))}
      </div>
      <Campo
        label={esRut ? 'RUT' : 'Número de pasaporte'}
        autoFocus
        inputRef={inputRef}
        autoComplete="off"
        inputMode={esRut ? 'numeric' : 'text'}
        autoCapitalize="characters"
        spellCheck={false}
        enterKeyHint="next"
        placeholder={esRut ? '12.345.678-5' : 'AB1234567'}
        value={enmascarar ? enmascararDocumento(valor) : valor}
        onFocus={() => setEnFoco(true)}
        onBlur={() => setEnFoco(false)}
        onChange={(e) =>
          onValor(
            esRut
              ? formatearRut(e.target.value)
              : e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)
          )
        }
        error={error}
        ayuda={
          enmascarar
            ? 'Lo ocultamos por seguridad. Toca el campo para verlo.'
            : esRut
              ? 'Incluye el dígito final. Si es K, toca el botón K.'
              : undefined
        }
        accesorio={
          esRut && !enmascarar ? (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (!/k$/i.test(valor)) onValor(formatearRut(`${valor}K`));
                inputRef.current?.focus();
              }}
              aria-label="Agregar K como dígito final del RUT"
              className="mr-1.5 grid h-11 min-w-11 shrink-0 place-items-center rounded-lg border border-linea-fuerte bg-fondo px-3 text-lg font-bold text-tinta hover:bg-sutil active:bg-linea"
            >
              K
            </button>
          ) : undefined
        }
      />
    </>
  );
}
