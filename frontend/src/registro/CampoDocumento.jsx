import React, { useState } from 'react';
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
  const esRut = tipo === 'CEDULA_CHILE';
  const enmascarar = !enFoco && documentoEsValido(tipo, valor);

  return (
    <>
      <div role="radiogroup" aria-label="Tipo de documento" className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
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
            className={`h-12 rounded-xl text-[0.9375rem] font-semibold transition-colors ${
              tipo === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            {texto}
          </button>
        ))}
      </div>
      <Campo
        label={esRut ? 'RUT' : 'Número de pasaporte'}
        autoFocus
        autoComplete="off"
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
              ? 'Incluye el dígito final (puede ser K).'
              : undefined
        }
      />
    </>
  );
}
