// ============================================================
// local.js - Modo local (servidor Python en la PC)
// Misma API que github.js pero usando endpoints locales.
// ============================================================

const API_BASE = '/api';

export function getToken() { return 'local-mode'; }
export function setToken(t) {}
export function clearToken() {}
export function hasToken() { return true; }

export async function readJSON(repo, path) {
  const res = await fetch(`${API_BASE}/read?path=${encodeURIComponent(path)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Error leyendo ' + path);
  const data = await res.json();
  return JSON.parse(data.content);
}

export async function writeJSON(repo, path, data, message) {
  const res = await fetch(`${API_BASE}/write?path=${encodeURIComponent(path)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error guardando ' + path);
  }
  return res.json();
}

export async function uploadFile(repo, path, base64Content, message) {
  const res = await fetch(`${API_BASE}/upload?path=${encodeURIComponent(path)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: base64Content }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error subiendo ' + path);
  }
  return res.json();
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.onload = () => {
      const result = reader.result;
      const idx = result.indexOf(',');
      resolve(result.substring(idx + 1));
    };
    reader.readAsDataURL(file);
  });
}

export async function getLocalStatus() {
  const res = await fetch(`${API_BASE}/status`);
  return res.json();
}

export async function hacerBackup() {
  const res = await fetch(`${API_BASE}/backup`, { method: 'POST' });
  return res.json();
}