import React from 'react';
import { ShieldCheck, Mail, Scale, MapPin, FileText, Lock } from 'lucide-react';

export default function Footer({ onOpenTerms }) {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-white font-extrabold text-lg">
              <ShieldCheck className="w-6 h-6 text-red-500" />
              RNH • ANFP CHILE
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Sistema Oficial del Registro Nacional de Hinchas. Arquitectura Hexagonal en Java
              (Quarkus), PostgreSQL Multi-Tenant Cifrado (AES-256-GCM) e Integración Biométrica.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-slate-300 pt-1">
              <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
              Avenida Quilín 5635, Peñalolén, Región Metropolitana, Chile.
            </div>
          </div>

          {/* Col 2: Marco Legal */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-amber-400" />
              Marco Normativo y Legal
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>• Ley N° 19.628 sobre Protección de la Vida Privada (Art. 2.g y Art. 12 ARCO)</li>
              <li>• Ley N° 19.327 de Derechos y Deberes en Espectáculos de Fútbol Profesional</li>
              <li>• Almacenamiento exclusivo en Google Cloud Platform (Región Chile)</li>
              <li>• Jurisdicción y Arbitraje CAM Cámara de Comercio de Santiago (CCS)</li>
            </ul>
          </div>

          {/* Col 3: Canales Oficiales ANFP */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-emerald-400" />
              Canales Oficiales y Derechos ARCO
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <span className="text-slate-300 font-semibold block">Soporte e Incidencias del Servicio:</span>
                <a href="mailto:marketing@anfpchile.cl" className="text-blue-400 hover:underline">
                  marketing@anfpchile.cl
                </a>
              </li>
              <li>
                <span className="text-slate-300 font-semibold block">Ejercicio de Derechos ARCO (Hinchas):</span>
                <a href="mailto:enlacedehinchas@anfpchile.cl" className="text-blue-400 hover:underline">
                  enlacedehinchas@anfpchile.cl
                </a>
              </li>
              <li>
                <span className="text-slate-300 font-semibold block">Delegado de Protección de Datos (DPO):</span>
                <a href="mailto:ifierro@anfpchile.cl" className="text-blue-400 hover:underline">
                  ifierro@anfpchile.cl
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Documentación */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-blue-400" />
              Transparencia y Seguridad
            </h4>
            <p className="text-xs text-slate-400">
              Las condiciones de uso están permanentemente accesibles para todos los usuarios. Los
              datos no utilizados por 2 años corridos se eliminan automáticamente.
            </p>
            <button
              onClick={onOpenTerms}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <FileText className="w-4 h-4 text-red-400" />
              Ver Términos y Condiciones Completos
            </button>
          </div>
        </div>

        <div className="border-t border-slate-800/80 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 Asociación Nacional de Fútbol Profesional (ANFP) • Registro Nacional de Hinchas.</p>
          <p className="mt-2 sm:mt-0">
            Seguridad End-to-End: TLS 1.3 • mTLS • AES-256-GCM • HMAC-SHA256 • PBKDF2
          </p>
        </div>
      </div>
    </footer>
  );
}
