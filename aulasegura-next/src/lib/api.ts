import { Exam, Submission } from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'https://aulasegurahtml-production.up.railway.app/api'

async function apiFetch<T>(method: string, path: string, body?: unknown): Promise<T> {
  const opts: RequestInit = { method, headers: { 'Content-Type': 'application/json' } }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(API_BASE + path, opts)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw Object.assign(new Error(err.error ?? res.statusText), { data: err })
  }
  return res.json() as Promise<T>
}

// ── Auth ──────────────────────────────────────────────────
export const apiLogin    = (b: { email: string; password: string }) => apiFetch<{ ok: boolean; user: import('@/types').User }>('POST', '/auth/login', b)
export const apiRegister = (b: { email: string; password: string; name: string; role: string }) => apiFetch<{ ok: boolean; uid: string; email: string; name: string; role: string }>('POST', '/auth/register', b)

// ── Exams ─────────────────────────────────────────────────
export const apiGetExams       = ()          => apiFetch<Exam[]>('GET', '/evaluaciones')
export const apiCreateExam     = (d: unknown) => apiFetch<Exam>('POST', '/evaluaciones', d)
export const apiUpdateExam     = (id: string, d: unknown) => apiFetch<{ ok: boolean }>('PUT', `/evaluaciones/${id}`, d)
export const apiDeleteExam     = (id: string) => apiFetch<{ ok: boolean }>('DELETE', `/evaluaciones/${id}`)
export const apiGetExamByCode  = (code: string) => apiFetch<{ ok: boolean; exam: Exam }>('GET', `/evaluaciones/code/${code}`)

// ── Submissions ───────────────────────────────────────────
export const apiGetSubmissions  = ()          => apiFetch<Submission[]>('GET', '/notas')
export const apiCreateSubmission = (d: unknown) => apiFetch<{ ok: boolean; id: string }>('POST', '/notas', d)

// ── AI ────────────────────────────────────────────────────
export const apiGenerateQuestions = (b: { text: string; numQuestions: number; distribution: Record<string, number> }) =>
  apiFetch<{ ok: boolean; questions: import('@/types').Question[] }>('POST', '/groq/generate', b)

export const apiChat = (messages: { role: string; content: string }[]) =>
  apiFetch<{ ok: boolean; message: string }>('POST', '/chat', { messages })
