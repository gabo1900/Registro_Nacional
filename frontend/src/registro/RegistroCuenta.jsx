import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { IdCard, Sun, Clock, Eye, EyeOff, MapPin } from 'lucide-react';
import { apiFetch } from '../services/api';
import { PasoShell, BotonPrincipal, BotonSecundario, Campo, Opcion, Aviso, useBotonAtras } from './ui';
import CampoDocumento, { documentoEsValido, errorDocumento } from './CampoDocumento';
import { correoEsValido, digitosCelular, formatearCelular } from './formato';

const PASOS = ['inicio', 'estadio', 'metodo', 'nombre', 'documento', 'celular', 'correo', 'clave'];
// La creación de cuenta ocupa la primera mitad de la barra; la verificación, la segunda.
const PESO_CUENTA = 0.45;

function GoogleIcono() {
  return (
    <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z" />
    </svg>
  );
}

export default function RegistroCuenta({ estadios = [], onCerrar, onIrLogin, onAutenticado }) {
  const [paso, setPaso] = useState('inicio');
  const [datos, setDatos] = useState({
    tenantCodigo: '',
    nombres: '',
    apellidos: '',
    tipoDocumento: 'CEDULA_CHILE',
    documento: '',
    celular: '',
    email: '',
    password: '',
  });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [verClave, setVerClave] = useState(false);

  const indice = PASOS.indexOf(paso);
  const progreso = (indice / PASOS.length) * PESO_CUENTA;
  const actualizar = (campo, valor) => {
    setDatos((d) => ({ ...d, [campo]: valor }));
    if (errores[campo]) setErrores((e) => ({ ...e, [campo]: '' }));
  };
  const ir = (destino) => {
    setErrores({});
    setErrorGeneral('');
    setPaso(destino);
  };
  const atras = indice > 0 ? () => ir(PASOS[indice - 1]) : undefined;
  const siguiente = () => ir(PASOS[indice + 1]);

  const autenticar = async (endpoint, cuerpo) => {
    setEnviando(true);
    setErrorGeneral('');
    try {
      const res = await apiFetch(endpoint, { method: 'POST', body: JSON.stringify(cuerpo) });
      onAutenticado(res);
    } catch (err) {
      setErrorGeneral(err.message || 'No pudimos crear tu cuenta. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  const loginGoogle = useGoogleLogin({
    flow: 'implicit',
    onSuccess: (r) =>
      r?.access_token &&
      autenticar('/api/auth/google', {
        credential: r.access_token,
        tokenType: 'access_token',
        tenantCodigo: datos.tenantCodigo,
      }),
    onError: () => setErrorGeneral('No pudimos conectar con Google. Intenta de nuevo o usa tu correo.'),
  });

  const comun = { progreso, onAtras: atras, onCerrar, etapa: 'Crear cuenta' };
  useBotonAtras(enviando ? null : atras || onCerrar);

  if (paso === 'inicio') {
    return (
      <PasoShell
        {...comun}
        etapa="Registro de hinchas"
        titulo="Regístrate para ir al estadio"
        descripcion="Es obligatorio para comprar entradas del fútbol profesional. Lo haces una sola vez."
        onSubmit={siguiente}
        accion={
          <>
            <BotonPrincipal>Empezar</BotonPrincipal>
            <BotonSecundario onClick={onIrLogin}>Ya tengo cuenta</BotonSecundario>
          </>
        }
      >
        <h2 className="text-sm font-semibold text-slate-500">Ten a mano</h2>
        <ul className="mt-3 divide-y divide-slate-100">
          {[
            { icono: <IdCard className="size-6" />, texto: 'Tu cédula de identidad o pasaporte' },
            { icono: <Sun className="size-6" />, texto: 'Un lugar con buena luz para tu foto' },
            { icono: <Clock className="size-6" />, texto: 'Unos 3 minutos' },
          ].map((item) => (
            <li key={item.texto} className="flex items-center gap-4 py-4 text-base text-slate-800">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700" aria-hidden="true">
                {item.icono}
              </span>
              {item.texto}
            </li>
          ))}
        </ul>
      </PasoShell>
    );
  }

  if (paso === 'estadio') {
    return (
      <PasoShell
        {...comun}
        titulo="¿Cuál es tu estadio principal?"
        descripcion="Ahí quedará asociado tu registro."
        onSubmit={() => {
          if (!datos.tenantCodigo) return setErrores({ tenantCodigo: 'Elige un estadio para continuar.' });
          siguiente();
        }}
        accion={<BotonPrincipal>Continuar</BotonPrincipal>}
      >
        {estadios.length === 0 ? (
          <div className="space-y-3" aria-busy="true" aria-label="Cargando estadios">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100 motion-reduce:animate-none" />
            ))}
          </div>
        ) : (
          <div role="radiogroup" aria-label="Estadios" className="space-y-3">
            {estadios.map((t) => (
              <Opcion
                key={t.id}
                seleccionada={datos.tenantCodigo === t.codigo}
                onClick={() => actualizar('tenantCodigo', t.codigo)}
                titulo={t.nombre}
                detalle={t.ciudad || t.region || undefined}
                icono={<MapPin className="size-5" aria-hidden="true" />}
              />
            ))}
          </div>
        )}
        {errores.tenantCodigo && (
          <div className="mt-4">
            <Aviso>{errores.tenantCodigo}</Aviso>
          </div>
        )}
      </PasoShell>
    );
  }

  if (paso === 'metodo') {
    return (
      <PasoShell
        {...comun}
        titulo="¿Cómo quieres crear tu cuenta?"
        descripcion="Con Google es más rápido: tu nombre y correo se completan solos."
        onSubmit={siguiente}
        accion={
          <>
            <button
              type="button"
              onClick={() => loginGoogle()}
              disabled={enviando}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white text-[1.0625rem] font-semibold text-slate-900 active:bg-slate-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              <GoogleIcono />
              Continuar con Google
            </button>
            <BotonPrincipal>Usar mi correo</BotonPrincipal>
          </>
        }
      >
        <Aviso>{errorGeneral}</Aviso>
      </PasoShell>
    );
  }

  if (paso === 'nombre') {
    return (
      <PasoShell
        {...comun}
        titulo="¿Cómo te llamas?"
        descripcion="Escríbelo tal como aparece en tu cédula."
        onSubmit={() => {
          const e = {};
          if (!datos.nombres.trim()) e.nombres = 'Escribe tu nombre.';
          if (!datos.apellidos.trim()) e.apellidos = 'Escribe tus apellidos.';
          if (Object.keys(e).length) return setErrores(e);
          siguiente();
        }}
        accion={<BotonPrincipal>Continuar</BotonPrincipal>}
      >
        <div className="space-y-5">
          <Campo
            label="Nombres"
            autoFocus
            autoComplete="given-name"
            autoCapitalize="words"
            enterKeyHint="next"
            value={datos.nombres}
            onChange={(e) => actualizar('nombres', e.target.value)}
            error={errores.nombres}
          />
          <Campo
            label="Apellidos"
            autoComplete="family-name"
            autoCapitalize="words"
            enterKeyHint="next"
            value={datos.apellidos}
            onChange={(e) => actualizar('apellidos', e.target.value)}
            error={errores.apellidos}
          />
        </div>
      </PasoShell>
    );
  }

  if (paso === 'documento') {
    return (
      <PasoShell
        {...comun}
        titulo="¿Cuál es tu documento?"
        descripcion="El mismo que mostrarás en la puerta del estadio si te lo piden."
        onSubmit={() => {
          if (!documentoEsValido(datos.tipoDocumento, datos.documento)) {
            return setErrores({ documento: errorDocumento(datos.tipoDocumento) });
          }
          siguiente();
        }}
        accion={<BotonPrincipal>Continuar</BotonPrincipal>}
      >
        <CampoDocumento
          tipo={datos.tipoDocumento}
          valor={datos.documento}
          onTipo={(v) => actualizar('tipoDocumento', v)}
          onValor={(v) => actualizar('documento', v)}
          error={errores.documento}
        />
      </PasoShell>
    );
  }

  if (paso === 'celular') {
    return (
      <PasoShell
        {...comun}
        titulo="¿Cuál es tu celular?"
        descripcion="Te avisaremos ahí si hay algún problema con tu registro."
        onSubmit={() => {
          if (datos.celular.length !== 8) return setErrores({ celular: 'Escribe los 8 números que van después del 9.' });
          siguiente();
        }}
        accion={<BotonPrincipal>Continuar</BotonPrincipal>}
      >
        <Campo
          label="Número de celular"
          autoFocus
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          enterKeyHint="next"
          prefijo="+56 9"
          placeholder="1234 5678"
          value={formatearCelular(datos.celular)}
          onChange={(e) => actualizar('celular', digitosCelular(e.target.value))}
          error={errores.celular}
        />
      </PasoShell>
    );
  }

  if (paso === 'correo') {
    return (
      <PasoShell
        {...comun}
        titulo="¿Cuál es tu correo?"
        descripcion="Lo usarás para entrar a tu cuenta."
        onSubmit={() => {
          if (!correoEsValido(datos.email)) return setErrores({ email: 'Revisa tu correo. Debe ser como nombre@correo.cl' });
          siguiente();
        }}
        accion={<BotonPrincipal>Continuar</BotonPrincipal>}
      >
        <Campo
          label="Correo electrónico"
          autoFocus
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="next"
          placeholder="nombre@correo.cl"
          value={datos.email}
          onChange={(e) => actualizar('email', e.target.value.trim())}
          error={errores.email}
        />
      </PasoShell>
    );
  }

  // paso === 'clave'
  return (
    <PasoShell
      {...comun}
      titulo="Crea tu contraseña"
      descripcion="Úsala junto a tu correo para entrar a tu cuenta."
      onSubmit={() => {
        if (datos.password.length < 8) return setErrores({ password: 'Usa al menos 8 caracteres.' });
        autenticar('/api/auth/register-basic', {
          tenantCodigo: datos.tenantCodigo,
          nombreCompleto: `${datos.nombres.trim()} ${datos.apellidos.trim()}`,
          rut: datos.documento,
          telefono: `+569${datos.celular}`,
          email: datos.email,
          password: datos.password,
        });
      }}
      accion={<BotonPrincipal cargando={enviando}>{enviando ? 'Creando tu cuenta…' : 'Crear mi cuenta'}</BotonPrincipal>}
    >
      <div className="space-y-5">
        <Campo
          label="Contraseña"
          autoFocus
          type={verClave ? 'text' : 'password'}
          autoComplete="new-password"
          enterKeyHint="done"
          value={datos.password}
          onChange={(e) => actualizar('password', e.target.value)}
          error={errores.password}
          ayuda={
            datos.password.length >= 8
              ? 'Bien, tiene el largo necesario.'
              : `Mínimo 8 caracteres${datos.password ? ` · te faltan ${8 - datos.password.length}` : ''}.`
          }
          accesorio={
            <button
              type="button"
              onClick={() => setVerClave((v) => !v)}
              aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={verClave}
              className="grid size-12 shrink-0 place-items-center rounded-xl text-slate-500 active:bg-slate-100"
            >
              {verClave ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
            </button>
          }
        />
        <Aviso>{errorGeneral}</Aviso>
      </div>
    </PasoShell>
  );
}
