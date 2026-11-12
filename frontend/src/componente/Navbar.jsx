import React from 'react';
import { ShieldCheck, LogOut, UserCheck, Building2, FileText, Lock, LogIn, UserPlus } from 'lucide-react';
import { ENV, USE_LOCAL } from '../config/env';

export default function Navbar({
  currentUser,
  activeScreen,
  setActiveScreen,
  onOpenTerms,
  onLogout,
}) {
  const getRoleBadge = (rol) => {
    switch (rol) {
      case 'SUPER_ADMIN':
        return { label: 'SUPER ADMIN', color: 'bg-indigo-600 text-white' };
      case 'ADMIN_TENANT':
        return { label: 'ADMIN RECINTO', color: 'bg-emerald-600 text-white' };
      case 'OPERADOR_ACCESO':
        return { label: 'OPERADOR PUERTA', color: 'bg-amber-600 text-white' };
      default:
        return { label: 'HINCHA REGISTRADO', color: 'bg-blue-600 text-white' };
    }
  };

  return (
    <nav className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            onClick={() => setActiveScreen(currentUser ? 'panel' : 'landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-blue-700 flex items-center justify-center shadow-md group-hover:scale-105 transition">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-base sm:text-lg text-white">
                  RNH CHILE
                </span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30">
                  ANFP
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Registro Nacional de Hinchas
              </p>
            </div>
          </div>

          {/* Center Navigation Links */}
          <div className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => setActiveScreen('landing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeScreen === 'landing'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              Inicio
            </button>

            <button
              onClick={onOpenTerms}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 flex items-center gap-1.5 transition"
            >
              <FileText className="w-3.5 h-3.5 text-red-400" />
              Términos y Condiciones
            </button>

            {currentUser && (
              <button
                onClick={() => setActiveScreen('panel')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  activeScreen === 'panel'
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-slate-800 text-blue-300 hover:bg-slate-700'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Mi Panel
              </button>
            )}
          </div>

          {/* Right Action Area */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span
              title={`API Base: ${ENV.API_BASE_URL}`}
              className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono border ${
                USE_LOCAL
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50'
                  : 'bg-purple-950/60 text-purple-300 border-purple-700/50'
              }`}
            >
              <Lock className="w-3 h-3" />
              {USE_LOCAL ? 'LOCAL' : 'PRODUCCIÓN'}
            </span>

            {!currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveScreen('login')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    activeScreen === 'login'
                      ? 'bg-white text-slate-900'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => setActiveScreen('register')}
                  className="px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white shadow-md flex items-center gap-1.5 transition"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Registro
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-white flex items-center justify-end gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    {currentUser.nombreCompleto}
                  </div>
                  <div className="flex items-center justify-end gap-1.5 mt-0.5">
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold tracking-wider ${
                        getRoleBadge(currentUser.rol).color
                      }`}
                    >
                      {getRoleBadge(currentUser.rol).label}
                    </span>
                    {currentUser.tenantNombre && (
                      <span className="text-[11px] text-slate-400 truncate max-w-[130px]">
                        • {currentUser.tenantNombre}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  title="Cerrar Sesión"
                  className="p-2 rounded-xl bg-slate-900 hover:bg-red-600/90 text-slate-300 hover:text-white border border-slate-800 transition flex items-center gap-1 text-xs font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
