// ============================================================
// github.js - Cliente mínimo para la API de GitHub
// Lee y escribe archivos JSON en el repositorio.
// El token se guarda en localStorage y se recuerda entre sesiones.
// ============================================================

const API = 'https://api.github.com';
const TOKEN_KEY = 'vestuario_studio_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setToken(token) {
  if (!token) return;
  localStorage.setItem(TOKEN_KEY, token.trim());
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function hasToken() {
  return !!getToken();
}

function toBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
function fromBase64(b64) {
  return decodeURIComponent(escape(atob(b64.replace(/\s/g, ''))));
}

export async function readFile(repo, path) {
  const url = `${API}/repos/${repo.owner}/${repo.name}/contents/${path}?ref=${repo.branch}`;
  const headers = { Accept: 'application/vnd.github+json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Error leyendo ${path}: ${res.status}`);
  const data = await res.json();
  return { content: fromBase64(data.content), sha: data.sha };
}

export async function readJSON(repo, path) {
  const file = await readFile(repo, path);
  if (!file) return null;
  return JSON.parse(file.content);
}

export async function writeJSON(repo, path, data, message) {
  const token = getToken();
  if (!token) throw new Error('Token de GitHub no configurado');

  const current = await readFile(repo, path);
  const url = `${API}/repos/${repo.owner}/${repo.name}/contents/${path}`;

  const body = {
    message: message || `Actualizacion ${path} - ${new Date().toISOString()}`,
    content: toBase64(JSON.stringify(data, null, 2)),
    branch: repo.branch,
  };
  if (current) body.sha = current.sha;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 409) throw new Error('Conflicto: el archivo fue modificado por otra persona. Recarga la pagina.');
    if (res.status === 401) throw new Error('Token invalido o vencido. Volve a configurarlo.');
    if (res.status === 403) throw new Error('Sin permisos de escritura sobre el repositorio.');
    throw new Error(`Error guardando ${path}: ${res.status} ${err.message || ''}`);
  }

  return res.json();
}
export async function uploadFile(repo, path, base64Content, message) {
  const token = getToken();
  if (!token) throw new Error('Token de GitHub no configurado');

  const url = `${API}/repos/${repo.owner}/${repo.name}/contents/${path}`;
  const headers = { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}` };

  // Ver si el archivo ya existe (para obtener el SHA)
  const getRes = await fetch(url + `?ref=${repo.branch}`, { headers });
  let sha = null;
  if (getRes.ok) {
    const data = await getRes.json();
    sha = data.sha;
  }

  const body = {
    message: message || `Subir ${path}`,
    content: base64Content,
    branch: repo.branch,
  };
  if (sha) body.sha = sha;

  const res = await fetch(url, {
    method: 'PUT',
    headers: Object.assign({}, headers, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) throw new Error('Token invalido o vencido.');
    if (res.status === 403) throw new Error('Sin permisos de escritura.');
    if (res.status === 422) throw new Error('Archivo demasiado grande (maximo 100 MB).');
    throw new Error(`Error subiendo ${path}: ${res.status} ${err.message || ''}`);
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