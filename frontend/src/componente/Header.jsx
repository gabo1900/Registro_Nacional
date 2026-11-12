import React from 'react';
import {
  ShieldCheck,
  ScanFace,
  Lock,
  CheckCircle2,
  FileCheck2,
  ArrowRight,
  Fingerprint,
  QrCode,
  LogIn,
} from 'lucide-react';

export default function Header({ onGoLogin, onGoRegister, onOpenTerms }) {
  return (
    <header className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden border-b border-slate-800">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-blue-600/10 blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Clear Presentation & Actions */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Plataforma Oficial • Asociación Nacional de Fútbol Profesional (ANFP)
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Registro Nacional de Hinchas{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-white to-blue-500">
                  (RNH)
                </span>
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
                Sistema centralizado para la identificación y acceso seguro a los estadios del fútbol
                chileno. Validación de identidad, biometría facial con prueba de vida y control del
                derecho de admisión bajo la <strong>Ley N° 19.327</strong> y <strong>Ley N° 19.628</strong>.
              </p>
            </div>

            {/* Direct Action Buttons: "Registro" & "Iniciar Sesión" */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={onGoRegister}
                className="px-6 py-3 rounded-xl font-extrabold text-sm text-white bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 shadow-lg shadow-blue-900/30 flex items-center gap-2 transition"
              >
                <span>Registro</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onGoLogin}
                className="px-6 py-3 rounded-xl font-bold text-sm text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-2 transition"
              >
                <LogIn className="w-4 h-4 text-blue-400" />
                <span>Iniciar Sesión</span>
              </button>

              <button
                onClick={onOpenTerms}
                className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white underline underline-offset-4 flex items-center gap-1 transition"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
                Términos y Condiciones
              </button>
            </div>

            {/* Minimalist Security Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-slate-800/80">
              <div className="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="text-[11px] leading-tight font-semibold text-slate-300">
                  Cifrado AES-256
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <ScanFace className="w-4 h-4 text-blue-400 shrink-0" />
                <div className="text-[11px] leading-tight font-semibold text-slate-300">
                  Zero-Retention
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <Fingerprint className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="text-[11px] leading-tight font-semibold text-slate-300">
                  FIDO2 WebAuthn
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                <div className="text-[11px] leading-tight font-semibold text-slate-300">
                  GCP Chile
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Digital Pass Card Preview */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-sm rounded-3xl p-6 bg-gradient-to-br from-slate-900 via-blue-950/60 to-slate-900 border border-slate-700/80 shadow-2xl space-y-5">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-black tracking-wider uppercase text-white">
                    Pase Digital RNH
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  HABILITADO
                </span>
              </div>

              {/* Card Body */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                  <ScanFace className="w-9 h-9 text-blue-400" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-extrabold text-white">Identidad Verificada</div>
                  <div className="text-xs text-slate-400">RUT: 18.***.***-K</div>
                  <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Prueba de Vida Superada (98.4%)
                  </div>
                </div>
              </div>

              {/* Card Footer Info */}
              <div className="bg-slate-950/80 rounded-2xl p-3 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold">Torniquete & Entrada</div>
                  <div className="font-bold text-white text-[11px]">Acceso Rápido por Rostro</div>
                </div>
                <QrCode className="w-8 h-8 text-slate-300" />
              </div>

              <div className="text-[11px] text-center text-slate-400">
                Válido para compra de entradas y acceso a todos los recintos deportivos del país.
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
