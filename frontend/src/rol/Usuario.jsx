import React, { useEffect, useId, useRef, useState } from 'react';
import {
  CircleCheck,
  CircleAlert,
  TriangleAlert,
  RefreshCw,
  ScanFace,
  Fingerprint,
  History,
  FileCheck2,
  Scale,
  UserRound,
  ChevronDown,
  MapPin,
  Send,
  Inbox,
  Code2,
} from 'lucide-react';
import { apiFetch } from '../services/api';
import EnrolamientoHincha from '../registro/EnrolamientoHincha';
import { enmascararDocumento, enmascararCorreo, enmascararCelular } from '../registro/formato';
import { Alerta, Badge, Boton, Contenedor, Desplegable, EstadoVacio, Esqueleto, Tarjeta } from '../componente/ui';

/* ---------- Textos y formato ---------- */

const DEDOS = {
  INDICE_DERECHO: 'Índice derecho',
  INDICE_IZQUIERDO: 'Índice izquierdo',
  PULGAR_DERECHO: 'Pulgar derecho',
  PULGAR_IZQUIERDO: 'Pulgar izquierdo',
  MEDIO_DERECHO: 'Medio derecho',
  MEDIO_IZQUIERDO: 'Medio izquierdo',
};

const DERECHOS = {
  ACCESO: { titulo: 'Ver mis datos', detalle: 'Recibe una copia de los datos que tenemos sobre ti.' },
  RECTIFICACION: { titulo: 'Corregir mis datos', detalle: 'Si algún dato está mal o cambió.' },
  CANCELACION: { titulo: 'Borrar mis datos', detalle: 'Eliminamos tu registro en un máximo de 60 días.' },
  OPOSICION: { titulo: 'Oponerme a un uso', detalle: 'Si no estás de acuerdo con cómo usamos tus datos.' },
  PORTABILIDAD: { titulo: 'Llevarme mis datos', detalle: 'Recibe tus datos en un formato para usarlos en otro servicio.' },
};

const ESTADOS_ARCO = {
  PENDIENTE: { texto: 'En revisión', tono: 'aviso' },
  EN_PROCESO: { texto: 'En revisión', tono: 'aviso' },
  RESPONDIDA: { texto: 'Respondida', tono: 'ok' },
  RESUELTA: { texto: 'Respondida', tono: 'ok' },
  COMPLETADA: { texto: 'Respondida', tono: 'ok' },
  RECHAZADA: { texto: 'Rechazada', tono: 'error' },
};

const aFecha = (v) => {
  if (!v) return null;
  if (Array.isArray(v)) {
    const [a, m = 1, d = 1, h = 0, mi = 0] = v;
    return new Date(a, m - 1, d, h, mi);
  }
  const f = new Date(v);
  return Number.isNaN(f.getTime()) ? null : f;
};

const formatearFecha = (v, conHora = false) => {
  const f = aFecha(v);
  if (!f) return '';
  return f.toLocaleString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(conHora ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
};

const capitalizar = (t = '') => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase().replace(/_/g, ' ');

/* ---------- Hook: ¿pantalla de celular? ---------- */

function useEsCelular() {
  const consulta = '(max-width: 767px)';
  const [es, setEs] = useState(() => typeof window !== 'undefined' && window.matchMedia(consulta).matches);
  useEffect(() => {
    const mq = window.matchMedia(consulta);
    const alCambiar = () => setEs(mq.matches);
    mq.addEventListener('change', alCambiar);
    return () => mq.removeEventListener('change', alCambiar);
  }, []);
  return es;
}

/* ---------- Secciones: pestañas en PC/tablet, acordeón en celular ---------- */

function Secciones({ secciones, activa, onCambiar }) {
  const esCelular = useEsCelular();
  const base = useId();
  const tabsRef = useRef([]);

  if (esCelular) {
    return (
      <div className="space-y-3">
        {secciones.map((s) => {
          const abierta = activa === s.id;
          const Icono = s.icono;
          return (
            <Tarjeta key={s.id} as="div" className="overflow-hidden">
              <h2>
                <button
                  type="button"
                  id={`${base}-b-${s.id}`}
                  aria-expanded={abierta}
                  aria-controls={`${base}-p-${s.id}`}
                  onClick={() => onCambiar(abierta ? null : s.id)}
                  className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left font-bold hover:bg-fondo"
                >
                  <Icono className="size-5 shrink-0 text-tinta-tenue" aria-hidden="true" />
                  <span className="flex-1">{s.titulo}</span>
                  {s.contador !== undefined && (
                    <span className="rounded-full bg-sutil px-2 text-sm text-tinta-suave tabular-nums">{s.contador}</span>
                  )}
                  <ChevronDown
                    className={`size-5 shrink-0 transition-transform duration-200 motion-reduce:transition-none ${abierta ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>
              </h2>
              {abierta && (
                <div
                  id={`${base}-p-${s.id}`}
                  role="region"
                  aria-labelledby={`${base}-b-${s.id}`}
                  className="border-t border-linea px-4 py-5"
                >
                  {s.contenido}
                </div>
              )}
            </Tarjeta>
          );
        })}
      </div>
    );
  }

  const indice = Math.max(0, secciones.findIndex((s) => s.id === activa));
  const actual = secciones[indice];

  const alTeclear = (e) => {
    const mover = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    let destino = null;
    if (mover) destino = (indice + mover + secciones.length) % secciones.length;
    if (e.key === 'Home') destino = 0;
    if (e.key === 'End') destino = secciones.length - 1;
    if (destino === null) return;
    e.preventDefault();
    onCambiar(secciones[destino].id);
    tabsRef.current[destino]?.focus();
  };

  return (
    <Tarjeta as="div">
      <div
        role="tablist"
        aria-label="Secciones de tu cuenta"
        onKeyDown={alTeclear}
        className="flex gap-1 overflow-x-auto border-b border-linea px-2 [scrollbar-width:thin]"
      >
        {secciones.map((s, i) => {
          const sel = i === indice;
          const Icono = s.icono;
          return (
            <button
              key={s.id}
              ref={(el) => (tabsRef.current[i] = el)}
              type="button"
              role="tab"
              id={`${base}-t-${s.id}`}
              aria-selected={sel}
              aria-controls={`${base}-p-${s.id}`}
              tabIndex={sel ? 0 : -1}
              onClick={() => onCambiar(s.id)}
              className={`relative flex min-h-14 shrink-0 items-center gap-2 whitespace-nowrap px-2.5 font-bold transition-colors ${
                sel ? 'text-marca-700' : 'text-tinta-tenue hover:text-tinta'
              }`}
            >
              <Icono className="hidden size-5 2xl:block" aria-hidden="true" />
              {s.corto || s.titulo}
              {s.contador !== undefined && (
                <span className={`rounded-full px-2 text-sm tabular-nums ${sel ? 'bg-marca-50' : 'bg-sutil'}`}>{s.contador}</span>
              )}
              {sel && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-marca-700" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`${base}-p-${actual.id}`}
        aria-labelledby={`${base}-t-${actual.id}`}
        tabIndex={0}
        className="p-5 sm:p-6 lg:p-8"
      >
        <h2 className="sr-only">{actual.titulo}</h2>
        {actual.contenido}
      </div>
    </Tarjeta>
  );
}

/* ---------- Piezas ---------- */

function Dato({ etiqueta, children }) {
  return (
    <div className="py-3.5 sm:grid sm:grid-cols-[12rem_1fr] sm:gap-4">
      <dt className="text-[0.9375rem] text-tinta-tenue">{etiqueta}</dt>
      <dd className="mt-0.5 break-words font-bold tabular-nums sm:mt-0">{children || '—'}</dd>
    </div>
  );
}

function CargandoPanel() {
  return (
    <Contenedor className="py-8 lg:py-10" >
      <div role="status" aria-live="polite" className="space-y-6">
        <span className="sr-only">Cargando tu cuenta…</span>
        <Esqueleto className="h-40 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Esqueleto className="h-24" />
          <Esqueleto className="h-24" />
          <Esqueleto className="h-24" />
        </div>
        <Esqueleto className="h-64 w-full rounded-2xl" />
      </div>
    </Contenedor>
  );
}

/* ---------- Panel ---------- */

export default function Usuario({ currentUser, onOpenTerms, onLogout }) {
  const [portal, setPortal] = useState({
    usuario: currentUser,
    hincha: null,
    consentimiento: null,
    huellas: [],
    historialAccesos: [],
    solicitudesArco: [],
  });
  const [activeTab, setActiveTab] = useState('datos');
  const [loading, setLoading] = useState(true);
  const [cargaInicial, setCargaInicial] = useState(true);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [enviandoArco, setEnviandoArco] = useState(false);

  // Las huellas se registran en un punto de enrolamiento. Esta lógica queda
  // disponible por si se vuelve a habilitar el registro desde el dispositivo.
  const [nuevaHuellaDedo] = useState('INDICE_IZQUIERDO');
  const [, setHuellaSaving] = useState(false);

  // Form Derechos ARCO (Ley 19.628)
  const [arcoForm, setArcoForm] = useState({
    tipoDerecho: 'ACCESO',
    fundamento: '',
  });

  const cargarPortal = async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await apiFetch('/api/hincha/perfil');
      setPortal(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
      setCargaInicial(false);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleGuardarNuevaHuella = async (fp) => {
    setHuellaSaving(true);
    setErr('');
    try {
      await apiFetch('/api/hincha/huella', {
        method: 'POST',
        body: JSON.stringify({
          credentialId: fp.credentialId,
          publicKey: fp.publicKey,
          dispositivoTipo: fp.dispositivoTipo,
          dedoIndice: nuevaHuellaDedo,
        }),
      });
      setMsg('Huella agregada.');
      cargarPortal();
    } catch (e) {
      setErr(e.message);
    } finally {
      setHuellaSaving(false);
    }
  };

  useEffect(() => {
    cargarPortal();
  }, []);

  const handleEnviarArco = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    setEnviandoArco(true);
    try {
      await apiFetch('/api/hincha/arco', {
        method: 'POST',
        body: JSON.stringify(arcoForm),
      });
      setMsg('Recibimos tu solicitud. La revisará el encargado de protección de datos de la ANFP y te responderá por correo.');
      setArcoForm({ tipoDerecho: 'ACCESO', fundamento: '' });
      cargarPortal();
    } catch (e) {
      setErr(e.message);
    } finally {
      setEnviandoArco(false);
    }
  };

  const hincha = portal.hincha;
  const isEnrolled = hincha && hincha.estadoEnrolamiento === 'COMPLETADO';

  if (cargaInicial) return <CargandoPanel />;

  if (!isEnrolled && !err) {
    return (
      <EnrolamientoHincha
        usuario={portal.usuario || currentUser}
        onTerminado={cargarPortal}
        onOpenTerms={onOpenTerms}
        onCerrar={onLogout}
      />
    );
  }

  // No se pudo cargar la cuenta: explicamos qué hacer.
  if (!isEnrolled) {
    return (
      <Contenedor className="py-12">
        <Tarjeta className="mx-auto max-w-lg p-6 text-center sm:p-8">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-error-50 text-error-700" aria-hidden="true">
            <CircleAlert className="size-8" />
          </span>
          <h1 className="mt-4 text-titulo-3 font-bold">No pudimos cargar tu cuenta</h1>
          <p className="mt-2 text-tinta-tenue">
            Puede ser la señal. Revisa tu conexión a internet y vuelve a intentar.
          </p>
          <p className="mt-1 text-sm text-tinta-apagada">Detalle: {err}</p>
          <Boton tamano="lg" ancho className="mt-6" cargando={loading} onClick={cargarPortal} icono={<RefreshCw className="size-5" aria-hidden="true" />}>
            Intentar de nuevo
          </Boton>
        </Tarjeta>
      </Contenedor>
    );
  }

  const usuario = portal.usuario || currentUser;
  const documento = hincha?.documentoDecrypted || usuario?.rutDecrypted || '';
  const ultimoIngreso = [...portal.historialAccesos].sort(
    (a, b) => (aFecha(b.fechaEvento)?.getTime() || 0) - (aFecha(a.fechaEvento)?.getTime() || 0)
  )[0];

  // Estado principal: uno solo, con qué hacer.
  const estado = hincha.tieneProhibicionActiva
    ? {
        tono: 'error',
        icono: CircleAlert,
        titulo: 'No puedes ingresar a estadios',
        texto: 'Tienes una prohibición de ingreso vigente. Si crees que es un error, escribe a marketing@anfpchile.cl.',
      }
    : !hincha.livenessPassed
      ? {
          tono: 'aviso',
          icono: TriangleAlert,
          titulo: 'Falta verificar la foto de tu cara',
          texto: 'Actualiza en unos minutos. Si no cambia, escribe a marketing@anfpchile.cl.',
        }
      : {
          tono: 'ok',
          icono: CircleCheck,
          titulo: 'Listo para ingresar al estadio',
          texto: 'En la entrada, mira a la cámara o muestra tu cédula.',
        };

  const COLORES_ESTADO = {
    ok: { caja: 'border-ok-200', icono: 'bg-ok-50 text-ok-700' },
    aviso: { caja: 'border-aviso-200', icono: 'bg-aviso-50 text-aviso-700' },
    error: { caja: 'border-error-200', icono: 'bg-error-50 text-error-700' },
  }[estado.tono];
  const IconoEstado = estado.icono;

  const resumen = [
    {
      etiqueta: 'Estadio principal',
      valor: usuario?.tenantNombre || 'ANFP',
      icono: MapPin,
    },
    {
      etiqueta: 'Huellas registradas',
      valor: portal.huellas.length === 0 ? 'Ninguna' : portal.huellas.length,
      icono: Fingerprint,
      ir: 'huellas',
    },
    {
      etiqueta: 'Último ingreso',
      valor: ultimoIngreso ? formatearFecha(ultimoIngreso.fechaEvento) || ultimoIngreso.puertaAcceso : 'Aún no registras',
      icono: History,
      ir: 'historial',
    },
  ];

  const secciones = [
    {
      id: 'datos',
      titulo: 'Mis datos',
      icono: UserRound,
      contenido: (
        <div>
          <p className="text-tinta-tenue">Ocultamos parte de tus datos por seguridad.</p>
          <dl className="mt-3 divide-y divide-linea border-y border-linea">
            <Dato etiqueta="Nombre">{usuario?.nombreCompleto}</Dato>
            <Dato etiqueta="RUT o pasaporte">{enmascararDocumento(documento)}</Dato>
            <Dato etiqueta="Correo">{enmascararCorreo(usuario?.email || '')}</Dato>
            {usuario?.telefonoDecrypted && <Dato etiqueta="Celular">{enmascararCelular(usuario.telefonoDecrypted)}</Dato>}
            <Dato etiqueta="Estadio principal">{usuario?.tenantNombre}</Dato>
          </dl>
          <p className="mt-4 text-[0.9375rem] text-tinta-tenue">
            ¿Algún dato está mal?{' '}
            <button
              type="button"
              onClick={() => {
                setArcoForm((f) => ({ ...f, tipoDerecho: 'RECTIFICACION' }));
                setActiveTab('arco');
              }}
              className="min-h-11 font-bold text-marca-700 underline decoration-marca-200 hover:decoration-marca-700"
            >
              Pide corregirlo
            </button>
          </p>
        </div>
      ),
    },
    {
      id: 'huellas',
      titulo: 'Huellas',
      icono: Fingerprint,
      contador: portal.huellas.length,
      contenido: (
        <div className="space-y-5">
          <Alerta tono="info" titulo="Las huellas se registran en persona">
            Se toman en un punto de enrolamiento del estadio, no desde el celular. Sirven de respaldo si la cámara de la
            entrada no te reconoce. Si un dedo se lesiona, puedes entrar con otro.
          </Alerta>
          {portal.huellas.length === 0 ? (
            <EstadoVacio icono={Fingerprint} titulo="Aún no tienes huellas registradas">
              No es obligatorio. Puedes entrar al estadio solo con tu cara o tu cédula.
            </EstadoVacio>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {portal.huellas.map((h) => (
                <li key={h.id} className="flex items-center gap-3 rounded-xl border border-linea p-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-marca-50 text-marca-700" aria-hidden="true">
                    <Fingerprint className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{DEDOS[h.dedoIndice] || capitalizar(h.dedoIndice || 'Huella')}</p>
                    {h.createdAt && <p className="text-sm text-tinta-tenue">Desde el {formatearFecha(h.createdAt)}</p>}
                  </div>
                  {h.activo === false ? <Badge tono="neutro">Inactiva</Badge> : <Badge tono="ok">Activa</Badge>}
                </li>
              ))}
            </ul>
          )}
        </div>
      ),
    },
    {
      id: 'historial',
      titulo: 'Historial de ingresos',
      corto: 'Ingresos',
      icono: History,
      contador: portal.historialAccesos.length,
      contenido:
        portal.historialAccesos.length === 0 ? (
          <EstadoVacio icono={History} titulo="Aún no registras ingresos">
            Cuando entres a un estadio, aparecerá aquí con la fecha y la puerta.
          </EstadoVacio>
        ) : (
          <ul className="divide-y divide-linea border-y border-linea">
            {portal.historialAccesos.map((a) => {
              const ok = a.resultado === 'AUTORIZADO';
              return (
                <li key={a.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <p className="font-bold">
                      {a.tenantNombre ? `${a.tenantNombre} · ` : ''}
                      {a.puertaAcceso}
                    </p>
                    <p className="text-[0.9375rem] text-tinta-tenue">
                      {[formatearFecha(a.fechaEvento, true), a.tipoOperacion && capitalizar(a.tipoOperacion)].filter(Boolean).join(' · ')}
                    </p>
                    {!ok && a.detalleMensaje && <p className="mt-1 text-[0.9375rem] text-error-800">{a.detalleMensaje}</p>}
                  </div>
                  <Badge tono={ok ? 'ok' : 'error'} className="self-start sm:self-auto">
                    {ok ? 'Autorizado' : 'No autorizado'}
                  </Badge>
                </li>
              );
            })}
          </ul>
        ),
    },
    {
      id: 'consentimiento',
      titulo: 'Consentimiento',
      icono: FileCheck2,
      contenido: portal.consentimiento ? (
        <div className="space-y-5">
          <dl className="divide-y divide-linea border-y border-linea">
            <Dato etiqueta="Términos aceptados">Versión {portal.consentimiento.versionTerminos}</Dato>
            <Dato etiqueta="Uso de tu cara">Autorizado</Dato>
            {portal.consentimiento.fechaAceptacion && (
              <Dato etiqueta="Fecha">{formatearFecha(portal.consentimiento.fechaAceptacion)}</Dato>
            )}
          </dl>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Boton variante="secundario" onClick={onOpenTerms} icono={<FileCheck2 className="size-5" aria-hidden="true" />}>
              Leer los términos
            </Boton>
          </div>
          {portal.consentimiento.hashDocumentoLegal && (
            <Desplegable titulo="Detalles técnicos" icono={Code2}>
              <p>Huella digital del documento que aceptaste (sirve para comprobar que no ha cambiado):</p>
              <p className="mt-2 break-all rounded-lg bg-fondo p-3 font-mono text-sm text-tinta-suave">
                {portal.consentimiento.hashDocumentoLegal}
              </p>
            </Desplegable>
          )}
        </div>
      ) : (
        <EstadoVacio icono={FileCheck2} titulo="No encontramos tu consentimiento">
          Actualiza la página. Si sigue sin aparecer, escribe a marketing@anfpchile.cl.
        </EstadoVacio>
      ),
    },
    {
      id: 'arco',
      titulo: 'Derechos ARCO',
      icono: Scale,
      contador: portal.solicitudesArco.length || undefined,
      contenido: (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
          <form onSubmit={handleEnviarArco} className="space-y-5">
            <div>
              <h3 className="text-lg font-bold">Haz una solicitud sobre tus datos</h3>
              <p className="mt-1 text-[0.9375rem] text-tinta-tenue">
                Es gratis. Lo revisa el encargado de protección de datos de la ANFP (Ley N° 19.628, art. 12).
              </p>
            </div>
            <fieldset>
              <legend className="mb-2 font-bold">¿Qué quieres hacer?</legend>
              <div className="space-y-2">
                {Object.entries(DERECHOS).map(([valor, d]) => {
                  const sel = arcoForm.tipoDerecho === valor;
                  return (
                    <label
                      key={valor}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors ${
                        sel ? 'border-marca-700 bg-marca-50 ring-1 ring-marca-700' : 'border-linea hover:border-linea-fuerte hover:bg-fondo'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tipoDerecho"
                        value={valor}
                        checked={sel}
                        onChange={() => setArcoForm({ ...arcoForm, tipoDerecho: valor })}
                        className="mt-1 size-5 shrink-0 accent-marca-700"
                      />
                      <span>
                        <span className="block font-bold">{d.titulo}</span>
                        <span className="block text-[0.9375rem] text-tinta-tenue">{d.detalle}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <div className="space-y-2">
              <label htmlFor="arco-fundamento" className="block font-bold">
                Cuéntanos el motivo
              </label>
              <textarea
                id="arco-fundamento"
                rows={4}
                required
                value={arcoForm.fundamento}
                onChange={(e) => setArcoForm({ ...arcoForm, fundamento: e.target.value })}
                placeholder="Por ejemplo: mi segundo apellido está mal escrito."
                className="w-full rounded-xl border border-linea-fuerte bg-superficie px-4 py-3 text-campo outline-none transition-colors placeholder:text-tinta-apagada hover:border-tinta-apagada focus:border-marca-700 focus:ring-3 focus:ring-marca-700/15"
              />
            </div>
            <Boton type="submit" tamano="lg" ancho cargando={enviandoArco} icono={<Send className="size-5" aria-hidden="true" />}>
              {enviandoArco ? 'Enviando…' : 'Enviar solicitud'}
            </Boton>
          </form>

          <div>
            <h3 className="text-lg font-bold">Mis solicitudes</h3>
            {portal.solicitudesArco.length === 0 ? (
              <div className="mt-3">
                <EstadoVacio icono={Inbox} titulo="No has hecho solicitudes">
                  Cuando envíes una, verás aquí su estado y la respuesta.
                </EstadoVacio>
              </div>
            ) : (
              <ul className="mt-3 space-y-3">
                {portal.solicitudesArco.map((s) => {
                  const est = ESTADOS_ARCO[s.estado] || { texto: capitalizar(s.estado || 'En revisión'), tono: 'neutro' };
                  return (
                    <li key={s.id} className="rounded-xl border border-linea p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="font-bold">{DERECHOS[s.tipoDerecho]?.titulo || capitalizar(s.tipoDerecho)}</p>
                        <Badge tono={est.tono}>{est.texto}</Badge>
                      </div>
                      {s.createdAt && <p className="text-sm text-tinta-tenue">Enviada el {formatearFecha(s.createdAt)}</p>}
                      <p className="mt-2 text-[0.9375rem] text-tinta-suave">{s.fundamento}</p>
                      {s.respuestaDpo && (
                        <div className="mt-3 rounded-lg bg-fondo p-3 text-[0.9375rem]">
                          <p className="font-bold">Respuesta</p>
                          <p className="text-tinta-suave">{s.respuestaDpo}</p>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ),
    },
  ];

  return (
    <Contenedor className="space-y-6 py-6 sm:py-8 lg:py-10">
      <h1 className="sr-only">Mi panel</h1>

      {msg && (
        <Alerta tono="ok" onCerrar={() => setMsg('')}>
          {msg}
        </Alerta>
      )}
      {err && (
        <Alerta tono="error" titulo="Algo no funcionó" onCerrar={() => setErr('')}>
          {err} Revisa tu conexión e intenta de nuevo.
        </Alerta>
      )}

      <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start xl:grid-cols-[24rem_minmax(0,1fr)]">
        {/* Pase: estado principal + identidad */}
        <Tarjeta className={`p-6 lg:sticky lg:top-24 ${COLORES_ESTADO.caja}`} aria-labelledby="estado-pase">
          <div className="flex items-start gap-4 lg:flex-col">
            <span className={`grid size-14 shrink-0 place-items-center rounded-full lg:size-16 ${COLORES_ESTADO.icono}`} aria-hidden="true">
              <IconoEstado className="size-8 lg:size-9" />
            </span>
            <div>
              <h2 id="estado-pase" className="text-titulo-3 font-bold leading-tight lg:text-titulo-2">
                {estado.titulo}
              </h2>
              <p className="mt-1.5 text-[1.0625rem] leading-relaxed text-tinta-suave">{estado.texto}</p>
            </div>
          </div>

          <div className="mt-6 border-t border-linea pt-5">
            <p className="text-lg font-bold break-words">{usuario?.nombreCompleto}</p>
            <p className="mt-0.5 text-tinta-tenue tabular-nums">{enmascararDocumento(documento)}</p>
          </div>

          {estado.tono === 'ok' && (
            <p className="mt-5 flex items-center gap-2.5 rounded-xl bg-marca-50 px-3.5 py-3 font-bold text-marca-900">
              <ScanFace className="size-6 shrink-0" aria-hidden="true" />
              Tu cara es tu entrada
            </p>
          )}

          <Boton
            variante="texto"
            tamano="sm"
            className="-ml-3 mt-4"
            onClick={cargarPortal}
            disabled={loading}
            icono={<RefreshCw className={`size-4 ${loading ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden="true" />}
          >
            {loading ? 'Actualizando…' : 'Actualizar'}
          </Boton>
        </Tarjeta>

        <div className="min-w-0 space-y-6">
          {/* Resumen en fila */}
          {/* Celular: una lista compacta. Tablet y PC: tres tarjetas en fila. */}
          <ul className="divide-y divide-linea overflow-hidden rounded-2xl border border-linea bg-superficie shadow-tarjeta sm:grid sm:grid-cols-3 sm:gap-3 sm:divide-y-0 sm:overflow-visible sm:rounded-none sm:border-0 sm:bg-transparent sm:shadow-none">
            {resumen.map((r) => {
              const Icono = r.icono;
              const contenido = (
                <>
                  <Icono className="size-5 shrink-0 text-tinta-tenue" aria-hidden="true" />
                  <span className="min-w-0 flex-1 sm:mt-3 sm:block">
                    <span className="block text-[0.9375rem] text-tinta-tenue">{r.etiqueta}</span>
                    <span className="mt-0.5 block font-bold break-words">{r.valor}</span>
                  </span>
                </>
              );
              const caja =
                'flex h-full w-full items-center gap-3 px-4 py-3.5 text-left sm:block sm:rounded-2xl sm:border sm:border-linea sm:bg-superficie sm:p-4 sm:shadow-tarjeta';
              return (
                <li key={r.etiqueta}>
                  {r.ir ? (
                    <button
                      type="button"
                      onClick={() => setActiveTab(r.ir)}
                      className={`${caja} transition-colors hover:bg-fondo sm:hover:border-linea-fuerte`}
                    >
                      {contenido}
                    </button>
                  ) : (
                    <div className={caja}>{contenido}</div>
                  )}
                </li>
              );
            })}
          </ul>

          <Secciones secciones={secciones} activa={activeTab} onCambiar={setActiveTab} />
        </div>
      </div>
    </Contenedor>
  );
}
