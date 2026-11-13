import { API_URL } from '../config/env';

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('rnh_jwt_token');
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

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && data.message) ||
      'Error en la comunicación con el servidor RNH.';
    throw new Error(message);
  }

  return data;
}
