// ===== API HELPERS =====
const isDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
const API = isDev ? 'http://localhost:3000/api' : '/api';

async function apiFetch(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error(err.error || res.statusText), { response: { data: err } });
  }
  return res.json();
}

const apiLogin = (d) => apiFetch('POST', '/auth/login', d);
const apiRegister = (d) => apiFetch('POST', '/auth/register', d);
const apiGetExams = () => apiFetch('GET', '/evaluaciones');
const apiCreateExam = (d) => apiFetch('POST', '/evaluaciones', d);
const apiUpdateExam = (id, d) => apiFetch('PUT', `/evaluaciones/${id}`, d);
const apiDeleteExam = (id) => apiFetch('DELETE', `/evaluaciones/${id}`);
const apiGetExamByCode = (code) => apiFetch('GET', `/evaluaciones/code/${code}`);
const apiGetSubmissions = () => apiFetch('GET', '/notas');
const apiCreateSubmission = (d) => apiFetch('POST', '/notas', d);
