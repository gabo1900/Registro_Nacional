import React, { useState, useEffect } from 'react';
import { ShieldCheck, Building2, Cpu } from 'lucide-react';

import Navbar from './componente/Navbar';
import Header from './componente/Header';
import Footer from './componente/Footer';
import TermsModal from './componente/TermsModal';
import GoogleAuthButton from './componente/GoogleAuthButton';
import { Alerta, Boton, Contenedor, Desplegable, Tarjeta } from './componente/ui';

import SuperAdministrador from './rol/SuperAdministrador';
import Administrador from './rol/Administrador';
import Usuario from './rol/Usuario';
import RegistroCuenta from './registro/RegistroCuenta';

import { ESPECIFICACION_ARQUITECTURA } from './data/terminosAnfp';
import { apiFetch } from './services/api';

const CLASE_INPUT =
  'h-14 w-full rounded-xl border border-linea-fuerte bg-superficie px-4 text-campo text-tinta outline-none transition-colors placeholder:text-tinta-apagada hover:border-tinta-apagada focus:border-marca-700 focus:ring-3 focus:ring-marca-700/15';

const PASOS_INICIO = [
  {
    titulo: 'Completa tus datos',
    texto: 'Tu nombre, RUT o pasaporte, celular y correo. Ten tu cédula a mano.',
  },
  {
    titulo: 'Tómate una foto de la cara',
    texto: 'La cámara de tu celular te guía y la foto se toma sola. Busca un lugar con buena luz.',
  },
  {
    titulo: 'Ve al estadio',
    texto: 'Al comprar entradas se revisa tu registro. En la puerta, mira la cámara o muestra tu cédula.',
  },
];

const PRIVACIDAD = [
  'Usamos tu cara solo para reconocerte al comprar entradas y en la entrada del estadio.',
  'Tus datos se guardan protegidos, en servidores ubicados en Chile, y no se venden.',
  'Puedes pedir ver, corregir o borrar tus datos cuando quieras, sin costo.',
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeScreen, setActiveScreen] = useState('landing'); // landing, login, register, panel
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [publicTenants, setPublicTenants] = useState([]);

  // Login State
  const [loginForm, setLoginForm] = useState({
    emailOrRut: '',
    password: '',
    tenantCodigo: 'TODOS',
  });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    apiFetch('/api/public/tenants')
      .then((list) => {
        if (Array.isArray(list)) setPublicTenants(list);
      })
      .catch(() => {});

    const savedToken = localStorage.getItem('rnh_jwt_token');
    if (savedToken) {
      apiFetch('/api/auth/me')
        .then((res) => {
          if (res?.usuario) {
            setCurrentUser(res.usuario);
            setActiveScreen('panel');
          }
        })
        .catch(() => {
          localStorage.removeItem('rnh_jwt_token');
        });
    }
  }, []);

  const iniciarSesion = (res) => {
    localStorage.setItem('rnh_jwt_token', res.accessToken);
    setCurrentUser(res.usuario);
    setActiveScreen('panel');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginForm),
      });
      iniciarSesion(res);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async (credential, tokenType) => {
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await apiFetch('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({
          credential,
          tokenType,
          tenantCodigo: loginForm.tenantCodigo !== 'TODOS' ? loginForm.tenantCodigo : undefined,
        }),
      });
      localStorage.setItem('rnh_jwt_token', res.accessToken);
      setCurrentUser(res.usuario);
      setActiveScreen('panel');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('rnh_jwt_token');
    setCurrentUser(null);
    setActiveScreen('landing');
  };

  const irRegistro = () => {
    setAuthError('');
    setActiveScreen('register');
    window.scrollTo({ top: 0 });
  };
  const irLogin = () => {
    setAuthError('');
    setActiveScreen('login');
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="flex min-h-screen flex-col bg-fondo">
      <a
        href="#contenido"
        className="sr-only z-50 rounded-lg bg-marca-700 px-4 py-3 font-bold text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Saltar al contenido
      </a>

      <Navbar
        currentUser={currentUser}
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        onOpenTerms={() => setTermsModalOpen(true)}
        onLogout={handleLogout}
      />

      <main id="contenido" className="flex-1">
        {/* 1. INICIO */}
        {activeScreen === 'landing' && (
          <>
            <Header onGoLogin={irLogin} onGoRegister={irRegistro} />

            {/* Cómo funciona */}
            <section aria-labelledby="como-funciona" className="py-14 sm:py-20">
              <Contenedor>
                <h2 id="como-funciona" className="text-titulo-2 font-bold tracking-tight">
                  Cómo funciona
                </h2>
                <p className="mt-2 max-w-2xl text-lg text-tinta-suave">Tres pasos, y lo haces una sola vez.</p>

                <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-6">
                  {PASOS_INICIO.map((p, i) => (
                    <li key={p.titulo} className="flex gap-4 md:flex-col">
                      <span
                        className="grid size-11 shrink-0 place-items-center rounded-full bg-marca-700 text-lg font-bold text-white"
                        aria-hidden="true"
                      >
                        {i + 1}
                      </span>
                      <div>
                        <h3 className="text-lg font-bold">
                          <span className="sr-only">Paso {i + 1}: </span>
                          {p.titulo}
                        </h3>
                        <p className="mt-1 leading-relaxed text-tinta-tenue">{p.texto}</p>
                      </div>
                    </li>
                  ))}
                </ol>

                <div className="mt-10">
                  <Boton tamano="lg" onClick={irRegistro} className="w-full sm:w-auto sm:min-w-56">
                    Registrarme
                  </Boton>
                </div>
              </Contenedor>
            </section>

            {/* Por qué y privacidad */}
            <section aria-labelledby="por-que" className="border-t border-linea bg-superficie py-14 sm:py-20">
              <Contenedor className="grid gap-10 lg:grid-cols-2 lg:gap-16">
                <div>
                  <h2 id="por-que" className="text-titulo-2 font-bold tracking-tight">
                    ¿Por qué me tengo que registrar?
                  </h2>
                  <div className="mt-4 max-w-[65ch] space-y-4 text-lg leading-relaxed text-tinta-suave">
                    <p>
                      La Ley N° 19.327 regula el ingreso a los estadios del fútbol profesional. Con tu registro, se
                      confirma que eres tú al comprar entradas y que no tienes una prohibición de ingreso.
                    </p>
                    <p>En la puerta te reconocen mirando una cámara o mostrando tu cédula.</p>
                  </div>
                </div>

                <div>
                  <h2 className="text-titulo-3 font-bold">Así cuidamos tus datos</h2>
                  <ul className="mt-4 space-y-4">
                    {PRIVACIDAD.map((t) => (
                      <li key={t} className="flex gap-3 text-[1.0625rem] leading-relaxed">
                        <ShieldCheck className="mt-1 size-5 shrink-0 text-marca-700" aria-hidden="true" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => setTermsModalOpen(true)}
                    className="mt-5 min-h-11 font-bold text-marca-700 underline decoration-marca-200 hover:decoration-marca-700"
                  >
                    Leer los términos y condiciones
                  </button>

                  <Desplegable titulo="Detalles técnicos" icono={Cpu} className="mt-6">
                    <div className="space-y-5">
                      {ESPECIFICACION_ARQUITECTURA.map((bloque) => (
                        <div key={bloque.titulo}>
                          <h3 className="font-bold text-tinta">{bloque.titulo.replace(/^\d+\.\s*/, '')}</h3>
                          <ul className="mt-2 list-disc space-y-1.5 pl-5">
                            {bloque.puntos.map((p) => (
                              <li key={p}>{p}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </Desplegable>
                </div>
              </Contenedor>
            </section>
          </>
        )}

        {/* 2. INICIAR SESIÓN */}
        {activeScreen === 'login' && (
          <Contenedor className="py-10 sm:py-16">
            <Tarjeta className="mx-auto max-w-md p-6 sm:p-8">
              <h1 className="text-titulo-2 font-bold tracking-tight">Inicia sesión</h1>
              <p className="mt-2 text-tinta-tenue">Entra con el correo o RUT que usaste al registrarte.</p>

              {authError && (
                <Alerta tono="error" titulo="No pudimos iniciar tu sesión" className="mt-6">
                  {authError} Revisa tus datos e intenta de nuevo.
                </Alerta>
              )}

              <form onSubmit={handleLoginSubmit} className="mt-6 space-y-5">
                <div className="space-y-2">
                  <label htmlFor="login-usuario" className="block font-bold">
                    Correo o RUT
                  </label>
                  <input
                    id="login-usuario"
                    type="text"
                    required
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="nombre@correo.cl"
                    value={loginForm.emailOrRut}
                    onChange={(e) => setLoginForm({ ...loginForm, emailOrRut: e.target.value })}
                    className={CLASE_INPUT}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="login-clave" className="block font-bold">
                    Contraseña
                  </label>
                  <input
                    id="login-clave"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className={CLASE_INPUT}
                  />
                </div>

                <Desplegable titulo="Soy personal de un estadio" icono={Building2}>
                  <label htmlFor="login-recinto" className="mb-2 block font-bold text-tinta">
                    Recinto
                  </label>
                  <select
                    id="login-recinto"
                    value={loginForm.tenantCodigo}
                    onChange={(e) => setLoginForm({ ...loginForm, tenantCodigo: e.target.value })}
                    className={CLASE_INPUT}
                  >
                    <option value="TODOS">Detectar automáticamente</option>
                    {publicTenants.map((t) => (
                      <option key={t.id} value={t.codigo}>
                        {t.nombre}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-sm">Los hinchas no necesitan cambiar esto.</p>
                </Desplegable>

                <Boton type="submit" tamano="lg" ancho cargando={authLoading}>
                  {authLoading ? 'Ingresando…' : 'Ingresar'}
                </Boton>
              </form>

              <div className="my-6 flex items-center gap-3 text-sm text-tinta-tenue">
                <span className="h-px flex-1 bg-linea" />o<span className="h-px flex-1 bg-linea" />
              </div>

              <GoogleAuthButton onGoogleTokenReceived={handleGoogleLogin} />

              <p className="mt-8 border-t border-linea pt-6 text-center text-tinta-tenue">
                ¿Todavía no te registras?{' '}
                <button
                  type="button"
                  onClick={irRegistro}
                  className="min-h-11 font-bold text-marca-700 underline decoration-marca-200 hover:decoration-marca-700"
                >
                  Registrarme
                </button>
              </p>
            </Tarjeta>
          </Contenedor>
        )}

        {/* 3. REGISTRO */}
        {activeScreen === 'register' && (
          <RegistroCuenta
            estadios={publicTenants}
            onCerrar={() => setActiveScreen('landing')}
            onIrLogin={irLogin}
            onAutenticado={iniciarSesion}
          />
        )}

        {/* 4. PANELES POR ROL */}
        {activeScreen === 'panel' && currentUser && (
          <>
            {currentUser.rol === 'SUPER_ADMIN' ? (
              <SuperAdministrador />
            ) : currentUser.rol === 'ADMIN_TENANT' || currentUser.rol === 'OPERADOR_ACCESO' ? (
              <Administrador currentUser={currentUser} />
            ) : (
              <Usuario currentUser={currentUser} onOpenTerms={() => setTermsModalOpen(true)} onLogout={handleLogout} />
            )}
          </>
        )}
      </main>

      <Footer onOpenTerms={() => setTermsModalOpen(true)} />

      <TermsModal isOpen={termsModalOpen} onClose={() => setTermsModalOpen(false)} />
    </div>
  );
}
