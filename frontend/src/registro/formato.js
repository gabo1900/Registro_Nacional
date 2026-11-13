// Utilidades de formato, validación y enmascarado para el registro de hinchas.

const limpiarRut = (valor = '') => valor.replace(/[^0-9kK]/g, '').toUpperCase();

/** Da formato 12.345.678-5 mientras la persona escribe. */
export function formatearRut(valor = '') {
  const limpio = limpiarRut(valor).slice(0, 9);
  if (limpio.length <= 1) return limpio;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  return `${cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`;
}

/** Valida el dígito verificador (módulo 11). */
export function rutEsValido(valor = '') {
  const limpio = limpiarRut(valor);
  if (limpio.length < 8) return false;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  if (!/^\d+$/.test(cuerpo)) return false;
  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  const resto = 11 - (suma % 11);
  const esperado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);
  return dv === esperado;
}

export const pasaporteEsValido = (valor = '') => /^[A-Z0-9]{6,12}$/.test(valor.trim().toUpperCase());

export const correoEsValido = (valor = '') => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim());

/** Solo los 8 dígitos que siguen a +56 9. */
export const digitosCelular = (valor = '') => valor.replace(/\D/g, '').replace(/^569/, '').slice(0, 8);

export const formatearCelular = (digitos = '') =>
  digitos.length > 4 ? `${digitos.slice(0, 4)} ${digitos.slice(4)}` : digitos;

/**
 * 26.***.***-7 — formato único en todo el sistema (debe coincidir con
 * RutDocumento.getValorEnmascarado del backend). Solo los 2 primeros dígitos y el DV.
 * Pasaporte AB123456 → AB*****6.
 */
export function enmascararDocumento(valor = '') {
  if (!valor) return '';
  if (rutEsValido(valor)) {
    const [cuerpo, dv] = formatearRut(valor).split('-');
    let visibles = 2;
    const oculto = cuerpo.replace(/\d/g, (d) => (visibles-- > 0 ? d : '*'));
    return `${oculto}-${dv}`;
  }
  const texto = valor.trim().toUpperCase();
  if (texto.length <= 3) return '*'.repeat(texto.length);
  return texto.slice(0, 2) + '*'.repeat(texto.length - 3) + texto.slice(-1);
}

/** +56 9 •••• 5678 */
export function enmascararCelular(valor = '') {
  const d = digitosCelular(valor);
  if (d.length < 4) return '';
  return `+56 9 •••• ${d.slice(-4)}`;
}

/** al•••@gmail.com */
export function enmascararCorreo(valor = '') {
  const [usuario, dominio] = valor.split('@');
  if (!usuario || !dominio) return valor;
  return `${usuario.slice(0, usuario.length > 3 ? 2 : 1)}•••@${dominio}`;
}

export function edadDesde(fechaIso) {
  if (!fechaIso) return null;
  const nac = new Date(`${fechaIso}T00:00:00`);
  if (Number.isNaN(nac.getTime())) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}
