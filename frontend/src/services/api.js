import { API_URL } from '../config/env';

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('rnh_jwt_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
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
