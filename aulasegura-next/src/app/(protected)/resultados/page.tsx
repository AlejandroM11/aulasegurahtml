'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart3, Search, Eye, Lock, Clock, CheckCircle, ArrowLeft, FileDown, X } from 'lucide-react'
import { useSubmissions } from '@/hooks/useSubmissions'
import { calcScore } from '@/lib/score'
import { fmtDate } from '@/lib/utils'
import { Submission } from '@/types'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

export default function ResultadosPage() {
  const router = useRouter()
  const { submissions, loading } = useSubmissions()
  const [filter, setFilter]       = useState('')
  const [selected, setSelected]   = useState<Submission | null>(null)

  const filtered = submissions.filter(s =>
    `${s.studentName ?? ''}${s.studentEmail ?? ''}${s.title ?? ''}${s.code ?? ''}`
      .toLowerCase().includes(filter.toLowerCase())
  )

  const totalSubs = submissions.length
  const blocked   = submissions.filter(s => s.wasBlocked).length
  const avgPct    = (() => {
    const scored = submissions.map(calcScore).filter(Boolean) as { pct: number }[]
    if (!scored.length) return null
    return Math.round(scored.reduce((a, b) => a + b.pct, 0) / scored.length)
  })()

  const exportPDF = (subs: Submission[]) => {
    if (!subs.length) return
    const now = new Date().toLocaleString('es-ES')
    const rows = subs.map(s => {
      const sc = calcScore(s)
      return `<tr style="border-bottom:1px solid #e2e8f0">
        <td style="padding:.5rem">${s.studentName ?? 'Anónimo'}</td>
        <td style="padding:.5rem">${s.title ?? s.code ?? '—'}</td>
        <td style="padding:.5rem;font-weight:700;color:${sc ? (sc.pct >= 60 ? '#16a34a' : '#dc2626') : '#94a3b8'}">${sc ? sc.pct + '%' : '—'}</td>
        <td style="padding:.5rem">${s.violations?.length ?? 0}</td>
        <td style="padding:.5rem">${s.wasBlocked ? 'Bloqueado' : s.forced ? 'Tiempo' : 'Completado'}</td>
        <td style="padding:.5rem">${fmtDate(s.submittedAt)}</td>
      </tr>`
    }).join('')
    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><title>Resultados AulaSegura</title>
    <style>body{font-family:sans-serif;padding:2rem;font-size:14px}table{width:100%;border-collapse:collapse}th{background:#1e3a5f;color:#fff;padding:.6rem;text-align:left;font-size:.75rem;text-transform:uppercase}</style>
    </head><body>
    <h1 style="color:#1e3a5f;margin-bottom:.25rem">AulaSegura — Resultados</h1>
    <p style="color:#64748b;margin-bottom:1.5rem">Generado el ${now} · ${subs.length} entrega${subs.length !== 1 ? 's' : ''}</p>
    <table><thead><tr><th>Estudiante</th><th>Examen</th><th>Nota</th><th>Infracciones</th><th>Estado</th><th>Fecha</th></tr></thead>
    <tbody>${rows}</tbody></table></body></html>`
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    setTimeout(() => win.print(), 400)
  }

  if (selected) return <DetailView sub={selected} onBack={() => setSelected(null)} onExport={() => exportPDF([selected])} />

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-500" /> Resultados
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{totalSubs} entrega{totalSubs !== 1 ? 's' : ''} registrada{totalSubs !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportPDF(filtered)}>
            <FileDown className="w-4 h-4" /> Exportar PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push('/docente')}>
            <ArrowLeft className="w-4 h-4" /> Volver
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="text-center py-5">
          <p className="text-2xl font-black text-blue-600">{totalSubs}</p>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Entregas</p>
        </Card>
        <Card className="text-center py-5">
          <p className={`text-2xl font-black ${avgPct == null ? 'text-slate-400' : avgPct >= 60 ? 'text-green-600' : 'text-red-600'}`}>
            {avgPct != null ? avgPct + '%' : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Promedio MC</p>
        </Card>
        <Card className="text-center py-5">
          <p className={`text-2xl font-black ${blocked > 0 ? 'text-red-600' : 'text-slate-400'}`}>{blocked}</p>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Bloqueados</p>
        </Card>
      </div>

      {/* Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="Buscar por nombre, correo o código..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
            {filter && (
              <button onClick={() => setFilter('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="font-semibold">{filter ? 'Sin resultados para esa búsqueda' : 'No hay entregas aún'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  {['Estudiante','Examen','Nota','Infracciones','Estado','Fecha',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const sc = calcScore(s)
                  const violations = s.violations?.length ?? 0
                  return (
                    <tr key={s.id ?? s.submittedAt} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900 dark:text-white">{s.studentName || 'Anónimo'}</p>
                        <p className="text-xs text-slate-400">{s.studentEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900 dark:text-white">{s.title || s.code || '—'}</p>
                        {s.code && <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">{s.code}</span>}
                      </td>
                      <td className="px-4 py-3">
                        {sc ? (
                          <>
                            <span className={`font-bold text-sm px-2.5 py-0.5 rounded-full ${sc.pct >= 60 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'}`}>{sc.pct}%</span>
                            <p className="text-xs text-slate-400 mt-1">{sc.correct}/{sc.total} correctas</p>
                          </>
                        ) : <span className="text-xs text-slate-400 italic">Solo abiertas</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold text-sm ${violations > 0 ? 'text-red-600' : 'text-slate-400'}`}>{violations}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={s.wasBlocked ? 'red' : s.forced ? 'gray' : 'green'}>
                          {s.wasBlocked ? <><Lock className="w-3 h-3" />Bloqueado</> : s.forced ? <><Clock className="w-3 h-3" />Tiempo</> : <><CheckCircle className="w-3 h-3" />Completado</>}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{fmtDate(s.submittedAt)}</td>
                      <td className="px-4 py-3">
                        <Button variant="outline" size="sm" onClick={() => setSelected(s)}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

function DetailView({ sub, onBack, onExport }: { sub: Submission; onBack: () => void; onExport: () => void }) {
  const sc         = calcScore(sub)
  const questions  = sub.examQuestions ?? []
  const violations = sub.violations ?? []
  const answers    = sub.answers ?? {}

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">Detalle de entrega</h1>
          <p className="text-sm text-slate-500 mt-0.5">{sub.studentName} · {fmtDate(sub.submittedAt)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onExport}><FileDown className="w-4 h-4" />PDF</Button>
          <Button variant="outline" size="sm" onClick={onBack}><ArrowLeft className="w-4 h-4" />Volver</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="text-center py-5">
          <p className={`text-2xl font-black ${sc ? (sc.pct >= 60 ? 'text-green-600' : 'text-red-600') : 'text-slate-400'}`}>{sc ? sc.pct + '%' : '—'}</p>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Nota MC</p>
        </Card>
        <Card className="text-center py-5">
          <p className={`text-2xl font-black ${violations.length > 0 ? 'text-red-600' : 'text-green-600'}`}>{violations.length}</p>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Infracciones</p>
        </Card>
        <Card className="text-center py-5">
          <p className="text-2xl font-black">{sub.wasBlocked ? '🔒' : sub.forced ? '⏱️' : '✅'}</p>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">{sub.wasBlocked ? 'Bloqueado' : sub.forced ? 'Tiempo agotado' : 'Completado'}</p>
        </Card>
      </div>

      {/* Violations */}
      {violations.length > 0 && (
        <Card className="mb-4 border-red-200 dark:border-red-800 border-l-4 border-l-red-500">
          <p className="text-xs font-bold uppercase tracking-wider text-red-600 mb-3">Infracciones ({violations.length})</p>
          <div className="space-y-2">
            {violations.map((v, i) => (
              <div key={i} className="flex gap-2 text-sm bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                <span className="font-bold text-red-600 flex-shrink-0">{i + 1}.</span>
                <span className="text-red-700 dark:text-red-300">{typeof v === 'string' ? v : v.reason}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Questions */}
      <Card padding="none" className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <p className="font-bold text-sm">Respuestas — {questions.length} pregunta{questions.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="p-4 space-y-3">
          {questions.length === 0 ? (
            <p className="text-center text-slate-400 py-6 text-sm">Examen eliminado — las respuestas siguen guardadas</p>
          ) : questions.map((q, idx) => {
            const given    = answers[q.id]
            const answered = Array.isArray(given) ? given.length > 0 : (given !== undefined && given !== '')
            let isCorrect: boolean | null = null
            if (q.type === 'mc' && answered) isCorrect = Number(given) === q.correctIndex
            else if (q.type === 'multi') {
              const ga = Array.isArray(given) ? given : []
              const ex = q.correctIndexes ?? []
              isCorrect = ex.length > 0 && ga.length === ex.length && ex.every((i: number) => ga.includes(i))
            }

            const typeColors: Record<string, string> = { mc: 'bg-blue-100 text-blue-700', multi: 'bg-cyan-100 text-cyan-700', open: 'bg-green-100 text-green-700', eq: 'bg-purple-100 text-purple-700' }

            return (
              <div key={q.id} className={`rounded-xl border p-4 ${!answered ? 'border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800' : isCorrect === true ? 'border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800' : isCorrect === false ? 'border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800' : 'border-slate-200 bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700'}`}>
                <div className="flex items-start gap-3 mb-2">
                  <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-700 to-blue-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${typeColors[q.type] ?? 'bg-slate-100 text-slate-600'}`}>{q.type.toUpperCase()}</span>
                      {isCorrect === true  && <span className="text-xs font-bold text-green-600">✓ Correcto</span>}
                      {isCorrect === false && <span className="text-xs font-bold text-red-600">✗ Incorrecto</span>}
                      {!answered           && <span className="text-xs font-bold text-amber-600">— Sin responder</span>}
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{q.text}</p>
                  </div>
                </div>
                {q.type === 'mc' && answered && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 ml-9">
                    Respondió: <strong>{q.options?.[Number(given)]}</strong>
                    {isCorrect === false && q.options && <span className="text-green-600 ml-2">· Correcta: {q.options[q.correctIndex ?? 0]}</span>}
                  </p>
                )}
                {q.type === 'open' && answered && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 ml-9 italic">"{String(given)}"</p>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
