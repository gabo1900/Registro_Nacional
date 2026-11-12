import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  ScanFace,
  Fingerprint,
  Building2,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Cpu,
  Database,
  Scale,
} from 'lucide-react';

import Navbar from './componente/Navbar';
import Header from './componente/Header';
import Footer from './componente/Footer';
import TermsModal from './componente/TermsModal';
import GoogleAuthButton from './componente/GoogleAuthButton';

import SuperAdministrador from './rol/SuperAdministrador';
import Administrador from './rol/Administrador';
import Usuario from './rol/Usuario';
import RegistroCuenta from './registro/RegistroCuenta';

import { TERMINOS_SECCIONES, ESPECIFICACION_ARQUITECTURA } from './data/terminosAnfp';
import { apiFetch } from './services/api';

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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Shared Navbar from src/componente/Navbar.jsx */}
      <Navbar
        currentUser={currentUser}
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        onOpenTerms={() => setTermsModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* MAIN CONTENT ROUTER */}
      <main className="flex-1">
        {/* 1. PUBLIC LANDING PAGE & TECHNICAL SPECIFICATION */}
        {activeScreen === 'landing' && (
          <div>
            <Header
              onGoLogin={() => {
                setAuthError('');
                setActiveScreen('login');
              }}
              onGoRegister={() => {
                setAuthError('');
                setActiveScreen('register');
              }}
              onOpenTerms={() => setTermsModalOpen(true)}
            />

            {/* Technical & Security Architecture Section from the Specification */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-10">
              <div className="text-center max-w-3xl mx-auto space-y-3">
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-extrabold uppercase tracking-wider">
                  Especificación Técnica y Seguridad End-to-End
                </span>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
                  Arquitectura Hexagonal, Biometría y Defensa en Profundidad
                </h2>
                <p className="text-sm text-slate-600">
                  Diseñado bajo los estándares de la ANFP, Ley N° 19.628 (Protección de Datos
                  Personales Sensibles) y Ley N° 19.327 (Derechos y Deberes en el Fútbol Profesional).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {ESPECIFICACION_ARQUITECTURA.map((bloque, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition space-y-4"
                  >
                    <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                      {i === 0 ? (
                        <Cpu className="w-6 h-6 text-blue-400" />
                      ) : i === 1 ? (
                        <Lock className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <Database className="w-6 h-6 text-amber-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">{bloque.titulo}</h3>
                      <p className="text-xs font-semibold text-blue-600 mt-0.5">
                        {bloque.subtitulo}
                      </p>
                    </div>
                    <ul className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
                      {bloque.puntos.map((p, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* Full Términos y Condiciones Summary & Legal Transparency Section */}
            <section className="bg-white border-y border-slate-200 py-14">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                      <Scale className="w-4 h-4" />
                      Transparencia Legal Obligatoria para el Enrolamiento
                    </span>
                    <h2 className="text-2xl font-extrabold text-slate-900">
                      Términos y Condiciones Oficiales del Servicio RNH (ANFP)
                    </h2>
                    <p className="text-xs text-slate-500">
                      Resumen ejecutivo de las 8 cláusulas contractuales que todo asistente acepta al registrarse.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setTermsModalOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow"
                    >
                      <FileCheck2 className="w-4 h-4 text-red-400" />
                      Leer Documento Legal Completo (8 Cláusulas)
                    </button>
                    <button
                      onClick={() => setActiveScreen('register')}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow"
                    >
                      Aceptar e Iniciar Registro
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {TERMINOS_SECCIONES.map((sec) => (
                    <div
                      key={sec.id}
                      onClick={() => setTermsModalOpen(true)}
                      className="p-4 rounded-2xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200 cursor-pointer transition space-y-2"
                    >
                      <div className="text-xs font-extrabold text-slate-900">{sec.titulo}</div>
                      <p className="text-xs text-slate-600 leading-relaxed">{sec.resumen}</p>
                      <span className="text-[11px] font-bold text-blue-600 inline-block">
                        Leer cláusula completa →
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 2. MULTI-TENANT LOGIN SCREEN */}
        {activeScreen === 'login' && (
          <div className="max-w-md mx-auto px-4 py-12">
            <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-xl space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow">
                  <KeyRound className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Iniciar Sesión Multi-Tenant RNH
                </h2>
                <p className="text-xs text-slate-500">
                  Ingresa con tu correo o RUT, o autentícate directamente con tu cuenta de Google.
                </p>
              </div>

              {authError && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Recinto / Tenant (Opcional para SuperAdmin)
                  </label>
                  <select
                    value={loginForm.tenantCodigo}
                    onChange={(e) =>
                      setLoginForm({ ...loginForm, tenantCodigo: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 bg-white font-semibold"
                  >
                    <option value="TODOS">Detectar Automáticamente / Global</option>
                    {publicTenants.map((t) => (
                      <option key={t.id} value={t.codigo}>
                        {t.nombre} ({t.codigo})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Correo Electrónico o RUT *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="yanezgabriel787@gmail.com o 18.543.210-K"
                    value={loginForm.emailOrRut}
                    onChange={(e) =>
                      setLoginForm({ ...loginForm, emailOrRut: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contraseña *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm shadow-lg transition"
                >
                  {authLoading ? 'Verificando Criptografía...' : 'Ingresar al Sistema RNH'}
                </button>
              </form>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200" />
                <span className="flex-shrink mx-3 text-[11px] font-bold uppercase text-slate-400">
                  O Autenticación Oficial Google OAuth 2.0
                </span>
                <div className="flex-grow border-t border-slate-200" />
              </div>

              <GoogleAuthButton onGoogleTokenReceived={handleGoogleLogin} />

              <div className="text-center text-xs text-slate-500 pt-2">
                ¿Aún no estás enrolado en el Registro Nacional de Hinchas?{' '}
                <button
                  onClick={() => setActiveScreen('register')}
                  className="font-bold text-blue-600 hover:underline"
                >
                  Regístrate aquí
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. REGISTRO DE HINCHAS: un paso por pantalla, pensado para celular */}
        {activeScreen === 'register' && (
          <RegistroCuenta
            estadios={publicTenants}
            onCerrar={() => setActiveScreen('landing')}
            onIrLogin={() => {
              setAuthError('');
              setActiveScreen('login');
            }}
            onAutenticado={iniciarSesion}
          />
        )}

        {/* 4. ROLE-SEPARATED PANELS (SUPER_ADMIN, ADMIN_TENANT, USUARIO) */}
        {activeScreen === 'panel' && currentUser && (
          <>
            {currentUser.rol === 'SUPER_ADMIN' ? (
              <SuperAdministrador />
            ) : currentUser.rol === 'ADMIN_TENANT' ||
              currentUser.rol === 'OPERADOR_ACCESO' ? (
              <Administrador currentUser={currentUser} />
            ) : (
              <Usuario
                currentUser={currentUser}
                onOpenTerms={() => setTermsModalOpen(true)}
                onLogout={handleLogout}
              />
            )}
          </>
        )}
      </main>

      {/* Shared Footer from src/componente/Footer.jsx */}
      <Footer onOpenTerms={() => setTermsModalOpen(true)} />

      {/* Full Términos y Condiciones Modal from src/componente/TermsModal.jsx */}
      <TermsModal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
      />
    </div>
  );
}
