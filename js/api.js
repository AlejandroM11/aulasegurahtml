// ===== API HELPERS =====
// Detectar si se abre como file:// (sin servidor local)
const isLocalFile = location.protocol === 'file:';
if (isLocalFile) {
  console.warn('Modo offline detectado: La aplicación funcionará con datos simulados. Para funcionalidad completa, ejecuta un servidor local (ej: python -m http.server 8000) y abre http://localhost:8000');
  console.warn('En modo offline: Login/Register simulados, exámenes vacíos, no se guardan datos.');
}

// API base - solo si no es file://
const API = isLocalFile ? null : ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:3000/api' : '/api');

async function apiFetch(method, path, body) {
  if (isLocalFile) {
    throw new Error('Modo offline: operación no disponible');
  }
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error(err.error || res.statusText), { response: { data: err } });
  }
  return res.json();
}

// Funciones API con soporte offline
const apiLogin = (d) => isLocalFile ?
  Promise.resolve({ ok: true, user: { uid: 'mock-' + Date.now(), email: d.email, role: d.email.includes('docente') ? 'docente' : 'estudiante' } }) :
  apiFetch('POST', '/auth/login', d);

const apiRegister = (d) => isLocalFile ?
  Promise.resolve({ ok: true, user: { uid: 'mock-' + Date.now(), email: d.email, role: 'estudiante' } }) :
  apiFetch('POST', '/auth/register', d);

const apiGetExams = () => isLocalFile ? Promise.resolve([]) : apiFetch('GET', '/evaluaciones');

const apiCreateExam = (d) => isLocalFile ?
  Promise.resolve({ id: 'mock-' + Date.now() }) :
  apiFetch('POST', '/evaluaciones', d);

const apiUpdateExam = (id, d) => isLocalFile ?
  Promise.resolve({ id }) :
  apiFetch('PUT', `/evaluaciones/${id}`, d);

const apiDeleteExam = (id) => isLocalFile ?
  Promise.resolve({}) :
  apiFetch('DELETE', `/evaluaciones/${id}`);

const apiGetExamByCode = (code) => isLocalFile ?
  Promise.resolve(null) :
  apiFetch('GET', `/evaluaciones/code/${code}`);

const apiGetSubmissions = () => isLocalFile ? Promise.resolve([]) : apiFetch('GET', '/notas');

const apiCreateSubmission = (d) => isLocalFile ?
  Promise.resolve({ id: 'mock-' + Date.now() }) :
  apiFetch('POST', '/notas', d);

// Explicación de cambios para portabilidad:
// - Detecta si se abre con file:// (sin servidor local)
// - En modo offline, devuelve datos simulados para evitar errores
// - Esto permite que la app funcione en cualquier entorno sin romper
// - Para funcionalidad completa, usar servidor local (python -m http.server 8000)
