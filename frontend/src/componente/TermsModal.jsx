import React, { useState } from 'react';
import { X, FileCheck2, ShieldAlert, CheckCircle2, Mail } from 'lucide-react';
import { TERMINOS_SECCIONES } from '../data/terminosAnfp';

export default function TermsModal({ isOpen, onClose, onAcceptTerms }) {
  const [selectedSection, setSelectedSection] = useState(TERMINOS_SECCIONES[0].id);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-600/20 border border-red-500/40">
              <FileCheck2 className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold">
                TÉRMINOS Y CONDICIONES OFICIALES - REGISTRO NACIONAL DE HINCHAS (RNH)
              </h2>
              <p className="text-xs text-slate-300">
                Asociación Nacional de Fútbol Profesional (ANFP) • Ley N° 19.628 y Ley N° 19.327
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-2 text-xs text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Importante:</strong> Conforme a la Cláusula Primera, el uso del Servicio exige
            marcar expresamente la casilla de aceptación de los Términos y Condiciones y la casilla
            de consentimiento para el tratamiento de datos biométricos.
          </span>
        </div>

        {/* Body with Sidebar + Full Text */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Index Sidebar */}
          <div className="md:col-span-4 bg-slate-50 border-r border-slate-200 overflow-y-auto p-3 space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
              Cláusulas del Contrato
            </div>
            {TERMINOS_SECCIONES.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setSelectedSection(sec.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  selectedSection === sec.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <div className="font-bold">{sec.titulo}</div>
                <div
                  className={`text-[11px] mt-0.5 line-clamp-1 ${
                    selectedSection === sec.id ? 'text-blue-100' : 'text-slate-500'
                  }`}
                >
                  {sec.resumen}
                </div>
              </button>
            ))}
          </div>

          {/* Content Reader */}
          <div className="md:col-span-8 overflow-y-auto p-6 space-y-6 bg-white">
            {TERMINOS_SECCIONES.map((sec) => (
              <div
                key={sec.id}
                className={`space-y-3 pb-6 border-b border-slate-100 ${
                  selectedSection === sec.id ? 'ring-2 ring-blue-500/20 bg-blue-50/20 p-4 rounded-xl' : ''
                }`}
              >
                <h3 className="text-base font-extrabold text-slate-900">{sec.titulo}</h3>
                {sec.contenido.map((parrafo, idx) => (
                  <p key={idx} className="text-sm text-slate-700 leading-relaxed">
                    {parrafo}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-blue-600" /> DPO: ifierro@anfpchile.cl
            </span>
            <span>•</span>
            <span>Derechos ARCO: enlacedehinchas@anfpchile.cl</span>
          </div>
          <div className="flex items-center gap-3">
            {onAcceptTerms && (
              <button
                onClick={() => {
                  onAcceptTerms();
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                He Leído y Acepto las Condiciones
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
