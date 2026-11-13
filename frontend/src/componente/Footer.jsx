import React from 'react';
import { Contenedor, Logo } from './ui';
import { MARCA } from '../data/marca';

const CONTACTOS = [
  { para: 'Dudas o problemas con tu registro', correo: MARCA.correoAyuda },
  { para: 'Ver, corregir o borrar tus datos', correo: MARCA.correoDatos },
  { para: 'Encargado de protección de datos', correo: MARCA.correoPrivacidad },
];

export default function Footer({ onOpenTerms }) {
  return (
    <footer className="tema-oscuro mt-16 bg-tinta text-white/80">
      <Contenedor className="py-10 lg:py-12">
        <div className="grid gap-10 md:grid-cols-[1.2fr_2fr]">
          <div className="space-y-4">
            <Logo claro />
            <p className="max-w-sm text-[0.9375rem] leading-relaxed">
              Registra tu rostro una vez y entra más rápido a los estadios.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <h2 className="font-bold text-white">Contacto</h2>
              <ul className="mt-3 space-y-3">
                {CONTACTOS.map((c) => (
                  <li key={c.correo}>
                    <span className="block text-sm text-white/65">{c.para}</span>
                    <a
                      href={`mailto:${c.correo}`}
                      className="break-all font-bold text-white underline decoration-white/30 hover:decoration-white"
                    >
                      {c.correo}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-bold text-white">Tus datos</h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed">
                Protegidos por la Ley N° 19.628 y guardados en servidores en Chile. Si no usas tu registro en 2 años,
                se borra solo.
              </p>
              <button
                type="button"
                onClick={onOpenTerms}
                className="mt-3 min-h-11 font-bold text-white underline decoration-white/30 hover:decoration-white"
              >
                Términos y condiciones
              </button>
            </div>
          </div>
        </div>

        <p className="mt-10 border-t border-white/15 pt-6 text-sm text-white/65">
          © {new Date().getFullYear()} {MARCA.nombre} · Ley N° 19.327 y Ley N° 19.628
        </p>
      </Contenedor>
    </footer>
  );
}
