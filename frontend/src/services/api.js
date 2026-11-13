import { API_URL } from '../config/env';

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('fanpass_jwt_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  // Normalizar base URL y endpoint para evitar duplicaciones como /api/api
  const base = (API_URL || '').replace(/\/+$/, '');
  let path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (base.endsWith('/api') && path.startsWith('/api/')) {
    path = path.replace(/^\/api/, '');
  }

  const url = `${base}${path}`;

  const timeoutMs = options.timeoutMs || 35000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });

    clearTimeout(timer);

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      let message = 'Error en la comunicación con el servidor de Fanpass.';
      if (data && typeof data === 'object') {
        message = data.message || data.details || data.error || message;
      } else if (typeof data === 'string' && data.length > 0 && data.length < 300) {
        message = data;
      }
      throw new Error(message);
    }

    return data;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error('Tiempo de espera agotado al conectar con el servidor central de identidad. Verifique su señal e intente de nuevo.');
    }
    throw err;
  }
}
