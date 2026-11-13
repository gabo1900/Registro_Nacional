import React from 'react';
import { ArrowRight, CircleCheck, ScanFace } from 'lucide-react';
import { Boton, Contenedor } from './ui';

/** Portada de Inicio: qué es, para qué sirve y una sola acción principal. */
export default function Header({ onGoLogin, onGoRegister, onCheckFace }) {
  return (
    <section className="border-b border-linea bg-superficie">
      <Contenedor className="grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:py-20">
        <div>
          <h1 className="max-w-xl text-[2rem] font-bold leading-[1.1] tracking-tight sm:text-titulo-1 lg:text-[2.75rem]">
            Regístrate una vez para ir al estadio
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-tinta-suave">
            El Registro Nacional de Hinchas es obligatorio para comprar entradas del fútbol profesional chileno. Toma
            unos 3 minutos desde tu celular.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Boton tamano="lg" onClick={onGoRegister} iconoFinal={<ArrowRight className="size-5" aria-hidden="true" />} className="sm:min-w-48">
              Registrarme
            </Boton>
            <Boton
              variante="secundario"
              tamano="lg"
              onClick={onCheckFace}
              icono={<ScanFace className="size-5 text-marca-700" aria-hidden="true" />}
            >
              ¿Cómo lo sé?
            </Boton>
            <Boton variante="texto" tamano="lg" onClick={onGoLogin}>
              Ya estoy registrado
            </Boton>
          </div>

          <p className="mt-6 flex items-center gap-2 text-[0.9375rem] text-tinta-tenue">
            <CircleCheck className="size-5 shrink-0 text-ok-700" aria-hidden="true" />
            Servicio oficial de la ANFP. Gratis.
          </p>
        </div>

        {/* Vista previa del pase: muestra lo que obtendrá la persona */}
        <figure className="mx-auto w-full max-w-sm lg:max-w-md">
          <div className="rounded-xl border border-linea bg-fondo p-3 shadow-elevada sm:p-4">
            <div className="rounded-lg bg-superficie p-5 shadow-tarjeta">
              <div className="flex items-center gap-4">
                <span className="grid size-14 shrink-0 place-items-center rounded-full bg-ok-50 text-ok-700" aria-hidden="true">
                  <CircleCheck className="size-8" />
                </span>
                <div>
                  <p className="text-lg font-bold leading-tight">Listo para ingresar</p>
                  <p className="text-[0.9375rem] text-tinta-tenue">Tu registro está activo</p>
                </div>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-linea pt-4 text-[0.9375rem]">
                <div>
                  <dt className="text-sm text-tinta-tenue">Nombre</dt>
                  <dd className="font-bold">Camila Rojas</dd>
                </div>
                <div>
                  <dt className="text-sm text-tinta-tenue">RUT</dt>
                  <dd className="font-bold tabular-nums">••.•••.483-7</dd>
                </div>
              </dl>
              <p className="mt-4 flex items-center gap-2 rounded-lg bg-marca-50 px-3 py-2.5 text-[0.9375rem] font-bold text-marca-900">
                <ScanFace className="size-5 shrink-0" aria-hidden="true" />
                En la entrada, mira a la cámara
              </p>
            </div>
          </div>
          <figcaption className="mt-3 text-center text-sm text-tinta-tenue">Ejemplo de cómo se verá tu pase</figcaption>
        </figure>
      </Contenedor>
    </section>
  );
}
