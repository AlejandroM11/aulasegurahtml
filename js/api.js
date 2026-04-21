// ===== CLIENTE HTTP =====

const IS_LOCAL_FILE = location.protocol === 'file:';
const API_BASE = IS_LOCAL_FILE
  ? null
  : (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:3000/api'
    : '/api';

async function apiFetch(method, path, body) {
  if (IS_LOCAL_FILE) throw new Error('Modo offline: operación no disponible');

  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(API_BASE + path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error(err.error || res.statusText), { response: { data: err } });
  }
  return res.json();
}

// Fallback offline para desarrollo sin servidor
const mockOk = (extra = {}) => Promise.resolve({ ok: true, ...extra });

// ===== ENDPOINTS =====
const apiLogin          = (d)      => IS_LOCAL_FILE ? mockOk({ user: { uid: 'mock', email: d.email, role: d.email.includes('docente') ? 'docente' : 'estudiante' } }) : apiFetch('POST', '/auth/login', d);
const apiRegister       = (d)      => IS_LOCAL_FILE ? mockOk({ uid: 'mock', ...d })                                                                                    : apiFetch('POST', '/auth/register', d);
const apiGetExams       = ()       => IS_LOCAL_FILE ? Promise.resolve([])                                                                                               : apiFetch('GET', '/evaluaciones');
const apiCreateExam     = (d)      => IS_LOCAL_FILE ? mockOk({ id: 'mock-' + Date.now() })                                                                             : apiFetch('POST', '/evaluaciones', d);
const apiUpdateExam     = (id, d)  => IS_LOCAL_FILE ? mockOk({ id })                                                                                                   : apiFetch('PUT', `/evaluaciones/${id}`, d);
const apiDeleteExam     = (id)     => IS_LOCAL_FILE ? mockOk()                                                                                                          : apiFetch('DELETE', `/evaluaciones/${id}`);
const apiGetExamByCode  = (code)   => IS_LOCAL_FILE ? Promise.resolve(null)                                                                                             : apiFetch('GET', `/evaluaciones/code/${code}`);
const apiGetSubmissions = ()       => IS_LOCAL_FILE ? Promise.resolve([])                                                                                               : apiFetch('GET', '/notas');
const apiCreateSubmission = (d)    => IS_LOCAL_FILE ? mockOk({ id: 'mock-' + Date.now() })                                                                             : apiFetch('POST', '/notas', d);
