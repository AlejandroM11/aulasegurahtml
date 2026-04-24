// ===== API — Backend Railway =====

const API_BASE = 'https://aulasegurahtml-production.up.railway.app/api';

async function apiFetch(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API_BASE + path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error(err.error || res.statusText), { response: { data: err } });
  }
  return res.json();
}

// ── Auth ──
async function apiLogin({ email, password }) {
  return apiFetch('POST', '/auth/login', { email, password });
}

async function apiRegister({ email, password, name, role }) {
  return apiFetch('POST', '/auth/register', { email, password, name, role });
}

// ── Evaluaciones ──
async function apiGetExams() {
  return apiFetch('GET', '/evaluaciones');
}

async function apiCreateExam(data) {
  return apiFetch('POST', '/evaluaciones', data);
}

async function apiUpdateExam(id, data) {
  return apiFetch('PUT', `/evaluaciones/${id}`, data);
}

async function apiDeleteExam(id) {
  return apiFetch('DELETE', `/evaluaciones/${id}`);
}

async function apiGetExamByCode(code) {
  return apiFetch('GET', `/evaluaciones/code/${code}`);
}

// ── Notas ──
async function apiGetSubmissions() {
  return apiFetch('GET', '/notas');
}

async function apiCreateSubmission(data) {
  return apiFetch('POST', '/notas', data);
}