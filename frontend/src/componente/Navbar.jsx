import React, { useEffect, useRef, useState } from 'react';
import { Menu, X, LogOut, House, FileText, LayoutDashboard, LogIn, ShieldCheck } from 'lucide-react';
import { Boton, Contenedor, Logo } from './ui';

const ROLES = {
  SUPER_ADMIN: 'Super administrador',
  ADMIN_TENANT: 'Administrador de estadio',
  OPERADOR_ACCESO: 'Operador de puerta',
};

const iniciales = (nombre = '') =>
  nombre
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || '·';

function Avatar({ nombre, grande = false }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-marca-50 font-bold text-marca-800 ring-1 ring-marca-200 ${
        grande ? 'size-11 text-base' : 'size-9 text-sm'
      }`}
      aria-hidden="true"
    >
      {iniciales(nombre)}
    </span>
  );
}

export default function Navbar({ currentUser, activeScreen, setActiveScreen, onOpenTerms, onLogout }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [bordeMenu, setBordeMenu] = useState(0);
  const barraRef = useRef(null);
  const botonMenuRef = useRef(null);
  const panelRef = useRef(null);

  const ir = (pantalla) => {
    setMenuAbierto(false);
    setActiveScreen(pantalla);
    window.scrollTo({ top: 0 });
  };

  // Menú móvil: se ubica bajo la barra, se cierra con Escape o al pasar a pantalla grande.
  useEffect(() => {
    if (!menuAbierto) return undefined;
    setBordeMenu(barraRef.current?.getBoundingClientRect().bottom || 0);
    const alTeclear = (e) => {
      if (e.key === 'Escape') {
        setMenuAbierto(false);
        botonMenuRef.current?.focus();
      }
    };
    const mq = window.matchMedia('(min-width: 1024px)');
    const alCambiar = () => mq.matches && setMenuAbierto(false);
    window.addEventListener('keydown', alTeclear);
    mq.addEventListener('change', alCambiar);
    panelRef.current?.querySelector('button')?.focus();
    return () => {
      window.removeEventListener('keydown', alTeclear);
      mq.removeEventListener('change', alCambiar);
    };
  }, [menuAbierto]);

  const rol = currentUser && ROLES[currentUser.rol];

  const enlaces = [
    // Con sesión iniciada no se muestra "Inicio": la portada pública solo se ve al cerrar sesión.
    !currentUser && { id: 'landing', texto: 'Inicio', icono: House, onClick: () => ir('landing') },
    currentUser && { id: 'panel', texto: 'Mi panel', icono: LayoutDashboard, onClick: () => ir('panel') },
    {
      id: 'terminos',
      texto: 'Términos y condiciones',
      icono: FileText,
      onClick: () => {
        setMenuAbierto(false);
        onOpenTerms();
      },
    },
  ].filter(Boolean);

  return (
    <>
      {/* Franja institucional: deja claro que es el sitio oficial */}
      <div className="tema-oscuro bg-tinta pt-[env(safe-area-inset-top)] text-white/85">
        <Contenedor className="flex h-9 items-center justify-between gap-4 text-sm">
          <p className="flex items-center gap-2">
            <ShieldCheck className="size-4 shrink-0 text-white/70" aria-hidden="true" />
            <span className="sm:hidden">Sitio oficial de la ANFP</span>
            <span className="hidden sm:inline">Sitio oficial de la Asociación Nacional de Fútbol Profesional</span>
          </p>
          <a
            href="mailto:marketing@anfpchile.cl"
            className="hidden text-white/85 underline decoration-white/30 underline-offset-4 hover:text-white hover:decoration-white md:inline"
          >
            Ayuda: marketing@anfpchile.cl
          </a>
        </Contenedor>
      </div>

      <header ref={barraRef} className="sticky top-0 z-30 border-b border-linea bg-superficie">
        <Contenedor className="flex h-[4.5rem] items-stretch justify-between gap-6">
          <div className="flex items-stretch gap-10">
            <button
              type="button"
              onClick={() => ir(currentUser ? 'panel' : 'landing')}
              className="-ml-1 self-center rounded-md p-1"
              aria-label="Registro Nacional de Hinchas, ir al inicio"
            >
              <span className="hidden sm:block">
                <Logo />
              </span>
              <span className="sm:hidden">
                <Logo compacto />
              </span>
            </button>

            {/* Navegación de escritorio: texto simple, la página actual se subraya */}
            <nav aria-label="Principal" className="hidden lg:flex">
              <ul className="flex items-stretch gap-7">
                {enlaces.map((e) => {
                  const actual = activeScreen === e.id;
                  return (
                    <li key={e.id} className="flex">
                      <button
                        type="button"
                        onClick={e.onClick}
                        aria-current={actual ? 'page' : undefined}
                        className={`-mb-px border-b-[3px] pt-[3px] font-bold transition-colors ${
                          actual
                            ? 'border-marca-700 text-tinta'
                            : 'border-transparent text-tinta-tenue hover:border-linea-fuerte hover:text-tinta'
                        }`}
                      >
                        {e.texto}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="hidden items-center gap-4 lg:flex">
                <span className="flex min-w-0 items-center gap-3">
                  <Avatar nombre={currentUser.nombreCompleto} />
                  <span className="min-w-0 leading-tight">
                    <span className="block max-w-[14rem] truncate font-bold" title={currentUser.nombreCompleto}>
                      {currentUser.nombreCompleto}
                    </span>
                    <span className="block text-sm text-tinta-tenue">{rol || 'Hincha registrado'}</span>
                  </span>
                </span>
                <span className="h-8 w-px bg-linea" aria-hidden="true" />
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex min-h-11 items-center gap-2 rounded-md px-1 font-bold text-tinta-tenue hover:text-tinta"
                >
                  <LogOut className="size-5" aria-hidden="true" />
                  Salir
                </button>
              </div>
            ) : (
              <div className="hidden items-center gap-6 lg:flex">
                <button
                  type="button"
                  onClick={() => ir('login')}
                  aria-current={activeScreen === 'login' ? 'page' : undefined}
                  className="flex min-h-11 items-center gap-2 rounded-md font-bold text-tinta-suave hover:text-marca-700"
                >
                  <LogIn className="size-5" aria-hidden="true" />
                  Iniciar sesión
                </button>
                <Boton tamano="sm" onClick={() => ir('register')} className="rounded-lg px-5">
                  Registrarme
                </Boton>
              </div>
            )}

            {!currentUser && activeScreen !== 'register' && (
              <span className="hidden sm:block lg:hidden">
                <Boton tamano="sm" onClick={() => ir('register')} className="rounded-lg">
                  Registrarme
                </Boton>
              </span>
            )}
            <button
              ref={botonMenuRef}
              type="button"
              onClick={() => setMenuAbierto((v) => !v)}
              aria-expanded={menuAbierto}
              aria-controls="menu-movil"
              aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
              className="-mr-2 grid size-12 place-items-center rounded-md text-tinta hover:bg-fondo lg:hidden"
            >
              {menuAbierto ? <X className="size-6" aria-hidden="true" /> : <Menu className="size-6" aria-hidden="true" />}
            </button>
          </div>
        </Contenedor>

        {/* Menú móvil */}
        {menuAbierto && (
          <>
            <div
              className="fixed inset-x-0 bottom-0 bg-tinta/40 lg:hidden"
              style={{ top: bordeMenu }}
              onClick={() => setMenuAbierto(false)}
              aria-hidden="true"
            />
            <div
              id="menu-movil"
              ref={panelRef}
              className="absolute inset-x-0 top-full border-b border-linea bg-superficie shadow-elevada lg:hidden"
            >
              <Contenedor className="py-3">
                {currentUser && (
                  <div className="mb-2 flex items-center gap-3 border-b border-linea px-1 pb-4 pt-2">
                    <Avatar nombre={currentUser.nombreCompleto} grande />
                    <div className="min-w-0">
                      <p className="font-bold break-words">{currentUser.nombreCompleto}</p>
                      <p className="text-sm text-tinta-tenue">{rol || currentUser.tenantNombre || 'Hincha registrado'}</p>
                    </div>
                  </div>
                )}
                <nav aria-label="Menú">
                  <ul>
                    {enlaces.map((e) => {
                      const Icono = e.icono;
                      const actual = activeScreen === e.id;
                      return (
                        <li key={e.id}>
                          <button
                            type="button"
                            onClick={e.onClick}
                            aria-current={actual ? 'page' : undefined}
                            className={`flex min-h-12 w-full items-center gap-3 border-l-[3px] px-3 text-left font-bold ${
                              actual ? 'border-marca-700 bg-fondo text-tinta' : 'border-transparent text-tinta-suave hover:bg-fondo'
                            }`}
                          >
                            <Icono className="size-5 shrink-0" aria-hidden="true" />
                            {e.texto}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
                <div className="mt-3 border-t border-linea pt-4">
                  {currentUser ? (
                    <Boton
                      variante="secundario"
                      ancho
                      onClick={() => {
                        setMenuAbierto(false);
                        onLogout();
                      }}
                      icono={<LogOut className="size-5" aria-hidden="true" />}
                    >
                      Cerrar sesión
                    </Boton>
                  ) : (
                    <div className="space-y-2">
                      <div className="sm:hidden">
                        <Boton ancho tamano="lg" onClick={() => ir('register')}>
                          Registrarme
                        </Boton>
                      </div>
                      <Boton variante="secundario" ancho onClick={() => ir('login')} icono={<LogIn className="size-5" aria-hidden="true" />}>
                        Iniciar sesión
                      </Boton>
                    </div>
                  )}
                </div>
              </Contenedor>
            </div>
          </>
        )}
      </header>
    </>
  );
}
