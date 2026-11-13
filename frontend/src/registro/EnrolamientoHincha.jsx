import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sun, Glasses, Smartphone, Fingerprint, Check, CircleCheck, ShieldCheck, Loader2 } from 'lucide-react';
import { apiFetch } from '../services/api';
import { PasoShell, BotonPrincipal, BotonSecundario, Aviso, FilaResumen, useBotonAtras } from './ui';
import CampoDocumento, { documentoEsValido, errorDocumento } from './CampoDocumento';
import CapturaDocumento from './CapturaDocumento';
import CapturaFacial from './CapturaFacial';
import CampoFecha from './CampoFecha';
import { rutEsValido, enmascararDocumento, enmascararCelular, enmascararCorreo, edadDesde } from './formato';

const PESO_CUENTA = 0.45; // la primera parte de la barra corresponde a "Crear cuenta"

const huellaDisponible = () =>
  typeof window !== 'undefined' && !!window.PublicKeyCredential && !!navigator.credentials?.create;

const aBase64Url = (buffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

/** Registra la huella con el lector del propio dispositivo. */
async function registrarHuellaDelDispositivo(nombre) {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));
  const credencial = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'Registro Nacional de Hinchas', id: window.location.hostname },
      user: { id: userId, name: nombre || 'hincha', displayName: nombre || 'Hincha' },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },
        { alg: -257, type: 'public-key' },
      ],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
      timeout: 60000,
    },
  });
  if (!credencial) throw new Error('sin-credencial');
  const id = credencial.id || aBase64Url(credencial.rawId);
  return {
    credentialId: `FIDO2-${id.substring(0, 28)}`,
    publicKey: credencial.response?.attestationObject
      ? aBase64Url(credencial.response.attestationObject)
      : `WEBAUTHN_COSE_KEY_${Date.now()}`,
    dispositivoTipo: 'Sensor Biométrico Nativo (WebAuthn / FIDO2)',
    dedoIndice: 'INDICE_DERECHO',
  };
}

const formatearFecha = (iso) => {
  if (!iso) return '';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
};


export default function EnrolamientoHincha({ usuario, onTerminado, onOpenTerms, onCerrar }) {
  const rutGuardado = usuario?.rutDecrypted || '';
  const necesitaDocumento = !rutGuardado;
  const nombreCompleto = usuario?.nombreCompleto || '';

  const pasos = useMemo(
    () =>
      [
        necesitaDocumento && 'documento',
        'fotoDocumento',
        'nacimiento',
        'terminos',
        'antesFoto',
        'revisar',
      ].filter(Boolean),
    [necesitaDocumento]
  );

  const [paso, setPaso] = useState(pasos[0]);
  const [datos, setDatos] = useState({
    tipoDocumento: rutGuardado && !rutEsValido(rutGuardado) ? 'PASAPORTE' : 'CEDULA_CHILE',
    numeroDocumento: rutGuardado,
    fechaNacimiento: '',
    aceptaTerminosGenerales: false,
    aceptaTratamientoBiometrico: false,
  });
  const [fotoDocumento, setFotoDocumento] = useState(null);
  const [foto, setFoto] = useState(null);
  const [huella, setHuella] = useState(null);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [leyendoHuella, setLeyendoHuella] = useState(false);
  const [chequeosListos, setChequeosListos] = useState(0);
  const timersRef = useRef([]);

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  const indice = Math.max(0, pasos.indexOf(paso));
  const progreso = PESO_CUENTA + ((indice + 1) / (pasos.length + 1)) * (1 - PESO_CUENTA);
  // Las huellas se registran en un punto de enrolamiento, no desde el celular.
  const fase = ['documento', 'nacimiento'].includes(paso) ? 0 : paso === 'terminos' ? 1 : 2;

  const actualizar = (campo, valor) => {
    setDatos((d) => ({ ...d, [campo]: valor }));
    if (errores[campo]) setErrores((e) => ({ ...e, [campo]: '' }));
  };
  const ir = (destino) => {
    setErrores({});
    setErrorGeneral('');
    setPaso(destino);
  };
  const siguiente = () => ir(pasos[indice + 1]);
  const atras = indice > 0 ? () => ir(pasos[indice - 1]) : undefined;
  const comun = { fase, progreso, onAtras: atras, onCerrar };
  // Cada etapa corresponde a una llamada real al servidor.
  const chequeos = huella
    ? ['Enviando tus datos y tu foto', 'Guardando tu huella']
    : ['Enviando tus datos y tu foto'];

  useBotonAtras(
    paso === 'foto' ? () => setPaso('antesFoto') : ['verificando', 'listo'].includes(paso) ? null : atras || onCerrar
  );

  const enviar = async () => {
    ir('verificando');
    setChequeosListos(0);
    timersRef.current.forEach(clearTimeout);
    const [nombres, ...resto] = nombreCompleto.split(' ');
    try {
      await Promise.all([
        apiFetch('/api/hincha/biometria', {
          method: 'POST',
          body: JSON.stringify({
            ...datos,
            nombres: nombres || '',
            apellidos: resto.join(' '),
            nacionalidad: datos.tipoDocumento === 'CEDULA_CHILE' ? 'Chilena' : 'Extranjera',
            fotoDocumentoBase64: fotoDocumento,
            selfieBase64: foto?.selfieBase64,
            descriptorFacialJson: foto?.descriptorFacialJson,
          }),
        }),
        // Evita un parpadeo si el servidor responde al instante.
        new Promise((r) => setTimeout(r, 600)),
      ]);
      setChequeosListos(1);
      if (huella) {
        await apiFetch('/api/hincha/huella', { method: 'POST', body: JSON.stringify(huella) });
        setChequeosListos(2);
      }
      timersRef.current = [setTimeout(() => setPaso('listo'), 500)];
    } catch (err) {
      setPaso('revisar');
      setErrorGeneral(err.message || 'No pudimos enviar tu registro. Revisa tu conexión e intenta de nuevo.');
    }
  };

  if (paso === 'documento') {
    return (
      <PasoShell
        {...comun}
        titulo="¿Cuál es tu documento?"
        descripcion="El mismo que mostrarás en la puerta del estadio si te lo piden."
        onSubmit={() => {
          if (!documentoEsValido(datos.tipoDocumento, datos.numeroDocumento)) {
            return setErrores({ numeroDocumento: errorDocumento(datos.tipoDocumento) });
          }
          siguiente();
        }}
        accion={<BotonPrincipal>Continuar</BotonPrincipal>}
      >
        <CampoDocumento
          tipo={datos.tipoDocumento}
          valor={datos.numeroDocumento}
          onTipo={(v) => actualizar('tipoDocumento', v)}
          onValor={(v) => actualizar('numeroDocumento', v)}
          error={errores.numeroDocumento}
        />
      </PasoShell>
    );
  }

  if (paso === 'fotoDocumento') {
    return (
      <PasoShell
        {...comun}
        titulo="Foto de tu Cédula de Identidad"
        descripcion="Necesitamos verificar que la cédula sea auténtica y coincida con tu rostro."
        onSubmit={() => {
          if (!fotoDocumento) return setErrores({ fotoDocumento: 'Debes capturar o subir la foto de tu cédula para continuar.' });
          siguiente();
        }}
        accion={<BotonPrincipal deshabilitado={!fotoDocumento}>Continuar</BotonPrincipal>}
      >
        <CapturaDocumento
          tipoDocumento={datos.tipoDocumento}
          onCapturada={(b64) => {
            setFotoDocumento(b64);
            siguiente();
          }}
          onCancelar={atras}
        />
        {errores.fotoDocumento && (
          <div className="mt-4">
            <Aviso>{errores.fotoDocumento}</Aviso>
          </div>
        )}
      </PasoShell>
    );
  }

  if (paso === 'nacimiento') {
    return (
      <PasoShell
        {...comun}
        titulo={nombreCompleto ? `${nombreCompleto.split(' ')[0]}, ¿cuándo naciste?` : '¿Cuándo naciste?'}
        descripcion="Tal como aparece en tu documento."
        onSubmit={() => {
          const edad = edadDesde(datos.fechaNacimiento);
          if (edad === null) {
            return setErrores({ fechaNacimiento: 'Revisa la fecha. Escribe día, mes y año, por ejemplo 12 abril 1997.' });
          }
          if (edad < 0 || edad > 110) {
            return setErrores({ fechaNacimiento: 'Revisa el año de nacimiento.' });
          }
          siguiente();
        }}
        accion={<BotonPrincipal>Continuar</BotonPrincipal>}
      >
        <CampoFecha
          label="Fecha de nacimiento"
          valor={datos.fechaNacimiento}
          onCambio={(iso) => actualizar('fechaNacimiento', iso)}
          error={errores.fechaNacimiento}
        />
      </PasoShell>
    );
  }

  if (paso === 'terminos') {
    const casillas = [
      {
        campo: 'aceptaTerminosGenerales',
        texto: 'Acepto los términos y condiciones del Registro Nacional de Hinchas.',
      },
      {
        campo: 'aceptaTratamientoBiometrico',
        texto: 'Autorizo usar la foto de mi cara (y mi huella, si la agrego) para comprobar que soy yo al comprar entradas y al entrar al estadio.',
      },
    ];
    return (
      <PasoShell
        {...comun}
        titulo="Antes de seguir, lo importante"
        onSubmit={() => {
          const e = {};
          casillas.forEach((c) => {
            if (!datos[c.campo]) e[c.campo] = true;
          });
          if (Object.keys(e).length) {
            setErrores(e);
            return setErrorGeneral('Para registrarte necesitas marcar las dos casillas.');
          }
          siguiente();
        }}
        accion={<BotonPrincipal>Acepto y continúo</BotonPrincipal>}
      >
        <ul className="space-y-3 text-base text-tinta-suave">
          {[
            'Usamos tu cara solo para reconocerte al comprar entradas y en la puerta del estadio.',
            'Tus datos se guardan protegidos, en servidores en Chile.',
            'Puedes pedir ver, corregir o borrar tus datos cuando quieras, sin costo.',
          ].map((t) => (
            <li key={t} className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-marca-700" aria-hidden="true" />
              <span className="text-pretty">{t}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onOpenTerms}
          className="mt-4 -ml-1 h-11 rounded-lg px-1 text-base font-bold text-marca-700 underline underline-offset-4"
        >
          Leer los términos completos
        </button>

        <fieldset className="mt-6 space-y-3">
          <legend className="sr-only">Autorizaciones</legend>
          {casillas.map((c) => (
            <label
              key={c.campo}
              className={`flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition-colors ${
                datos[c.campo]
                  ? 'border-marca-700 bg-marca-50'
                  : errores[c.campo]
                    ? 'border-error-700 bg-white'
                    : 'border-linea bg-white'
              }`}
            >
              <input
                type="checkbox"
                checked={datos[c.campo]}
                onChange={(e) => {
                  actualizar(c.campo, e.target.checked);
                  setErrorGeneral('');
                }}
                aria-invalid={errores[c.campo] ? true : undefined}
                className="mt-0.5 size-6 shrink-0 accent-marca-700"
              />
              <span className="text-[0.9375rem] leading-relaxed text-tinta">{c.texto}</span>
            </label>
          ))}
        </fieldset>
        {errorGeneral && (
          <div className="mt-4">
            <Aviso>{errorGeneral}</Aviso>
          </div>
        )}
      </PasoShell>
    );
  }

  if (paso === 'antesFoto') {
    return (
      <PasoShell
        {...comun}
        titulo="Ahora, una foto de tu cara"
        descripcion="Es para reconocerte en la entrada. La cámara te irá guiando y la foto se toma sola."
        onSubmit={() => ir('foto')}
        accion={<BotonPrincipal>{foto ? 'Tomar otra foto' : 'Abrir la cámara'}</BotonPrincipal>}
      >
        <ul className="divide-y divide-linea">
          {[
            { icono: <Sun className="size-6" />, titulo: 'Busca buena luz', detalle: 'Que la luz te dé de frente, no por detrás.' },
            { icono: <Glasses className="size-6" />, titulo: 'Despeja tu cara', detalle: 'Sin lentes de sol, gorro ni mascarilla.' },
            { icono: <Smartphone className="size-6" />, titulo: 'Celular a la altura de tus ojos', detalle: 'Con el brazo estirado y la pantalla hacia ti.' },
          ].map((t) => (
            <li key={t.titulo} className="flex items-start gap-4 py-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sutil text-tinta-suave" aria-hidden="true">
                {t.icono}
              </span>
              <span>
                <span className="block text-base font-bold text-tinta">{t.titulo}</span>
                <span className="block text-[0.9375rem] text-tinta-tenue">{t.detalle}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-tinta-tenue">Te pediremos permiso para usar la cámara.</p>
      </PasoShell>
    );
  }

  if (paso === 'foto') {
    return (
      <CapturaFacial
        onCancelar={() => setPaso('antesFoto')}
        onCapturada={(c) => {
          setFoto(c);
          ir(pasos[pasos.indexOf('antesFoto') + 1]);
        }}
      />
    );
  }

  if (paso === 'huella') {
    return (
      <PasoShell
        {...comun}
        titulo="¿Agregamos tu huella?"
        descripcion="Es opcional. Sirve como respaldo para entrar si la cámara del estadio no te reconoce."
        onSubmit={async () => {
          setErrorGeneral('');
          setLeyendoHuella(true);
          try {
            setHuella(await registrarHuellaDelDispositivo(nombreCompleto));
            siguiente();
          } catch (err) {
            setErrorGeneral(
              err?.name === 'NotAllowedError'
                ? 'No se completó la lectura. Puedes intentar de nuevo u omitir este paso.'
                : 'Tu celular no pudo leer la huella. Puedes omitir este paso y agregarla después.'
            );
          } finally {
            setLeyendoHuella(false);
          }
        }}
        accion={
          <>
            <BotonPrincipal cargando={leyendoHuella}>
              {leyendoHuella ? 'Pon tu dedo en el lector…' : huella ? 'Registrar de nuevo' : 'Agregar mi huella'}
            </BotonPrincipal>
            <BotonSecundario onClick={siguiente}>{huella ? 'Continuar' : 'Ahora no'}</BotonSecundario>
          </>
        }
      >
        <div className="grid place-items-center py-6" aria-hidden="true">
          <span className={`grid size-28 place-items-center rounded-full ${huella ? 'bg-ok-50 text-ok-700' : 'bg-marca-50 text-marca-700'}`}>
            {huella ? <Check className="size-14" /> : <Fingerprint className="size-14" />}
          </span>
        </div>
        <p className="text-center text-[0.9375rem] text-tinta-tenue">
          Usaremos el lector de huella o desbloqueo de tu celular. Tu huella no sale del teléfono.
        </p>
        {errorGeneral && (
          <div className="mt-5">
            <Aviso tono="aviso">{errorGeneral}</Aviso>
          </div>
        )}
      </PasoShell>
    );
  }

  if (paso === 'revisar') {
    return (
      <PasoShell
        {...comun}
        titulo="Revisa que todo esté bien"
        descripcion="Ocultamos parte de tus datos por seguridad."
        onSubmit={() => {
          if (!foto) return setErrorGeneral('Falta tu foto. Tócala en la lista para tomarla.');
          enviar();
        }}
        accion={<BotonPrincipal>Enviar mi registro</BotonPrincipal>}
      >
        {errorGeneral && (
          <div className="mb-4">
            <Aviso>{errorGeneral}</Aviso>
          </div>
        )}
        <div className="divide-y divide-linea border-y border-linea">
          {nombreCompleto && <FilaResumen etiqueta="Nombre" valor={nombreCompleto} />}
          <FilaResumen
            etiqueta={datos.tipoDocumento === 'CEDULA_CHILE' ? 'RUT' : 'Pasaporte'}
            valor={enmascararDocumento(datos.numeroDocumento)}
            onEditar={necesitaDocumento ? () => ir('documento') : undefined}
          />
          <FilaResumen etiqueta="Fecha de nacimiento" valor={formatearFecha(datos.fechaNacimiento)} onEditar={() => ir('nacimiento')} />
          {usuario?.telefonoDecrypted && <FilaResumen etiqueta="Celular" valor={enmascararCelular(usuario.telefonoDecrypted)} />}
          {usuario?.email && <FilaResumen etiqueta="Correo" valor={enmascararCorreo(usuario.email)} />}
          {/* 1. Foto de la Cédula */}
          <div className="flex items-center justify-between gap-3 py-3.5">
            <div className="flex items-center gap-3">
              {fotoDocumento ? (
                <img src={fotoDocumento} alt="Cédula" className="h-12 w-16 rounded-md object-cover border border-linea" />
              ) : null}
              <div>
                <div className="text-sm text-tinta-tenue">Cédula de Identidad</div>
                <div className={`text-base font-bold ${fotoDocumento ? 'text-tinta' : 'text-error-700'}`}>
                  {fotoDocumento ? 'Cédula adjuntada' : 'Falta'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => ir('fotoDocumento')}
              className="h-11 shrink-0 rounded-xl px-3 text-[0.9375rem] font-bold text-marca-700 active:bg-marca-50"
            >
              {fotoDocumento ? 'Cambiar' : 'Tomar'}
            </button>
          </div>

          {/* 2. Foto de la Cara */}
          <div className="flex items-center justify-between gap-3 py-3.5">
            <div className="flex items-center gap-3">
              {foto?.selfieBase64?.startsWith('data:image/') ? (
                <img src={foto.selfieBase64} alt="" className="h-14 w-11 rounded-[50%] object-cover -scale-x-100" />
              ) : null}
              <div>
                <div className="text-sm text-tinta-tenue">Foto de tu cara (Selfie)</div>
                <div className={`text-base font-bold ${foto ? 'text-tinta' : 'text-error-700'}`}>{foto ? 'Lista' : 'Falta'}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => ir('antesFoto')}
              className="h-11 shrink-0 rounded-xl px-3 text-[0.9375rem] font-bold text-marca-700 active:bg-marca-50"
            >
              {foto ? 'Cambiar' : 'Tomar'}
            </button>
          </div>

          {/* 3. Indicador de Cotejo */}
          {fotoDocumento && foto && (
            <div className="flex items-center gap-2 py-3 px-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-800">
              <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
              Cotejo de identidad: Documento y Rostro listos para validación ANFP
            </div>
          )}
          {pasos.includes('huella') && (
            <FilaResumen etiqueta="Huella" valor={huella ? 'Agregada' : 'No agregada (opcional)'} onEditar={() => ir('huella')} />
          )}
        </div>
      </PasoShell>
    );
  }

  if (paso === 'verificando') {
    return (
      <PasoShell fase={2} progreso={0.97} titulo="Enviando tu registro" descripcion="Toma unos segundos. No cierres esta pantalla.">
        <ol className="space-y-1" aria-live="polite">
          {chequeos.map((texto, i) => {
            const listo = i < chequeosListos;
            const activo = i === chequeosListos;
            return (
              <li key={texto} className="flex items-center gap-3.5 py-3">
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-full ${
                    listo ? 'bg-ok-700 text-white' : activo ? 'bg-marca-50 text-marca-700' : 'bg-sutil text-tinta-apagada'
                  }`}
                  aria-hidden="true"
                >
                  {listo ? <Check className="size-5" strokeWidth={3} /> : activo ? <Loader2 className="size-5 animate-spin motion-reduce:animate-none" /> : null}
                </span>
                <span className={`text-base ${listo ? 'text-tinta' : activo ? 'font-bold text-tinta' : 'text-tinta-apagada'}`}>
                  {texto}
                  <span className="sr-only">{listo ? ' (listo)' : activo ? ' (en curso)' : ''}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </PasoShell>
    );
  }

  // paso === 'listo'
  return (
    <PasoShell
      fase={3}
      progreso={1}
      titulo="¡Listo! Ya estás registrado"
      descripcion="Ya puedes comprar entradas. En el estadio, mira a la cámara de la entrada o muestra tu cédula."
      onSubmit={onTerminado}
      accion={<BotonPrincipal>Ver mi pase</BotonPrincipal>}
    >
      <div className="grid place-items-center py-8" aria-hidden="true">
        <span className="grid size-28 place-items-center rounded-full bg-ok-50 text-ok-700">
          <CircleCheck className="size-16" />
        </span>
      </div>
    </PasoShell>
  );
}
