'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, List, BarChart3, Radio, Search, Trash2, Pen, Copy, Clock, HelpCircle, Eye, EyeOff, RefreshCw, Wand2, X, Check, ChevronDown } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useExams } from '@/hooks/useExams'
import { useExamEditor } from '@/hooks/useExamEditor'
import { fmtDate } from '@/lib/utils'
import { QuestionType } from '@/types'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import QuestionChip from '@/components/dashboard/QuestionChip'
import RAGModal from '@/components/dashboard/RAGModal'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

type Tab = 'crear' | 'lista'

const QTYPES: { id: QuestionType; label: string; color: string }[] = [
  { id: 'mc',    label: 'Una correcta',    color: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' },
  { id: 'multi', label: 'Varias correctas',color: 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20' },
  { id: 'open',  label: 'Abierta',         color: 'border-green-500 bg-green-50 dark:bg-green-900/20' },
  { id: 'eq',    label: 'Ecuación',        color: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' },
]

export default function DocentePage() {
  const { user } = useAuth()
  const router   = useRouter()
  const { exams, loading, reload, createExam, updateExam, deleteExam } = useExams()
  const [tab,        setTab]        = useState<Tab>('crear')
  const [filter,     setFilter]     = useState('')
  const [saving,     setSaving]     = useState(false)
  const [showRAG,    setShowRAG]    = useState(false)
  const [editingId,  setEditingId]  = useState<string | null>(null)

  const ed = useExamEditor()

  const filtered = exams.filter(e =>
    (e.code + e.title).toLowerCase().includes(filter.toLowerCase())
  )

  // Load exam for editing
  const startEdit = (id: string) => {
    const exam = exams.find(e => e.id === id)
    if (!exam) return
    ed.loadExam(exam)
    setEditingId(id)
    setTab('crear')
  }

  const cancelEdit = () => { ed.reset(); setEditingId(null) }

  const handleSave = async () => {
    if (!ed.title.trim()) { toast.error('El título es obligatorio'); return }
    if (!ed.code.trim())  { toast.error('El código es obligatorio'); return }
    if (!ed.questions.length) { toast.error('Agrega al menos una pregunta'); return }

    setSaving(true)
    try {
      const payload = {
        title: ed.title.trim(), code: ed.code.trim().toUpperCase(),
        durationMinutes: ed.dur, showCorrectAnswers: ed.showCorrectAnswers,
        questions: ed.questions, teacherId: user?.uid ?? '',
      }
      if (editingId) {
        await updateExam(editingId, payload)
        toast.success('Examen actualizado')
      } else {
        await createExam(payload as Parameters<typeof createExam>[0])
        toast.success('Examen creado')
      }
      ed.reset(); setEditingId(null); setTab('lista')
    } catch { toast.error('Error al guardar') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`¿Eliminar "${title}"?`)) return
    try { await deleteExam(id); toast.success('Examen eliminado') }
    catch { toast.error('Error al eliminar') }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {})
    toast.success(`Código ${code} copiado`)
  }

  const handleAddQuestion = () => {
    const ok = ed.addQuestion()
    if (!ok) toast.error('Completa todos los campos requeridos')
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Panel Docente</h1>
          <p className="text-sm text-slate-500 mt-0.5">Bienvenido, {user?.name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/monitor')}><Radio className="w-4 h-4" />Monitoreo</Button>
          <Button variant="outline" size="sm" onClick={() => router.push('/resultados')}><BarChart3 className="w-4 h-4" />Resultados</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6 w-fit">
        {([
          { id: 'crear', label: editingId ? 'Editando examen' : 'Crear examen', icon: Plus },
          { id: 'lista', label: `Mis exámenes (${exams.length})`, icon: List },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              tab === id ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            )}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* ── TAB CREAR ── */}
      {tab === 'crear' && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-5 items-start">

          {/* Left column */}
          <div className="space-y-5">

            {/* Exam info */}
            <Card>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-500" />
                  {editingId ? <span className="text-blue-600">Editando: {ed.title || '...'}</span> : 'Información del examen'}
                </h2>
                {editingId && <Button variant="outline" size="sm" onClick={cancelEdit}><X className="w-3.5 h-3.5" />Cancelar</Button>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Título del examen</label>
                  <input className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="Ej: Parcial de Matemáticas" value={ed.title} onChange={e => ed.setTitle(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Código</label>
                  <div className="flex gap-2">
                    <input className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      value={ed.code} onChange={e => ed.setCode(e.target.value.toUpperCase())} maxLength={10} readOnly={!!editingId} />
                    {!editingId && (
                      <button onClick={ed.regenCode} className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 transition-colors text-slate-500">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Duración (min)</label>
                  <input type="number" min={1} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={ed.dur} onChange={e => ed.setDur(Number(e.target.value))} />
                </div>
              </div>

              <label className="flex items-center gap-3 mt-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:border-blue-400 transition-colors">
                <input type="checkbox" checked={ed.showCorrectAnswers} onChange={e => ed.setShowCorrectAnswers(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">Mostrar respuestas al finalizar</p>
                  <p className="text-xs text-slate-500">El estudiante verá las correctas al terminar</p>
                </div>
              </label>
            </Card>

            {/* Question form */}
            <Card>
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-5">
                <Plus className="w-5 h-5 text-blue-500" /> Nueva pregunta
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 mb-4">
                {/* Question text */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Texto de la pregunta</label>
                  <textarea className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    rows={4} placeholder="Escribe aquí la pregunta..." value={ed.qtext} onChange={e => ed.setQtext(e.target.value)} />
                </div>

                {/* Type selector */}
                <div className="min-w-[180px]">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Tipo</label>
                  <div className="flex flex-col gap-2">
                    {QTYPES.map(({ id, label, color }) => (
                      <label key={id} className={cn('flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all',
                        ed.qtype === id ? color : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      )}>
                        <input type="radio" name="qtype" value={id} checked={ed.qtype === id} onChange={() => ed.setQtype(id)} className="sr-only" />
                        <div className={cn('w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 transition-all',
                          ed.qtype === id ? 'bg-current border-current' : 'border-slate-300 dark:border-slate-600'
                        )} />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* MC options */}
              {(ed.qtype === 'mc' || ed.qtype === 'multi') && (
                <div className="mb-4">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                    Opciones de respuesta
                    {ed.qtype === 'mc' ? ' (marca la correcta)' : ' (marca las correctas)'}
                  </label>
                  <div className="space-y-2">
                    {ed.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {ed.qtype === 'mc' ? (
                          <input type="radio" name="correct" checked={ed.correctIndex === i} onChange={() => ed.setCorrectIndex(i)}
                            className="w-4 h-4 accent-blue-600 flex-shrink-0" />
                        ) : (
                          <input type="checkbox" checked={ed.correctIndexes.includes(i)} onChange={() => ed.toggleCorrectIndex(i)}
                            className="w-4 h-4 accent-cyan-600 flex-shrink-0" />
                        )}
                        <input className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          placeholder={`Opción ${String.fromCharCode(65 + i)}`} value={opt} onChange={e => ed.setOption(i, e.target.value)} />
                        {ed.options.length > 2 && (
                          <button onClick={() => ed.removeOption(i)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {ed.options.length < 6 && (
                    <button onClick={ed.addOption} className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" /> Agregar opción
                    </button>
                  )}
                </div>
              )}

              {/* Equation */}
              {ed.qtype === 'eq' && (
                <div className="mb-4">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">LaTeX de referencia</label>
                  <input className="w-full px-4 py-2.5 rounded-xl border border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    placeholder="Ej: \frac{d}{dx}(x^2) o x^2-4=0" value={ed.refLatex} onChange={e => ed.setRefLatex(e.target.value)} />
                  <p className="text-xs text-slate-400 mt-1">El estudiante verá esta ecuación como referencia y responderá con el teclado matemático.</p>
                </div>
              )}

              {/* Open */}
              {ed.qtype === 'open' && (
                <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-sm text-green-700 dark:text-green-300">
                  El estudiante responderá con texto libre. No se requieren opciones.
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="gradient" className="flex-1" onClick={() => setShowRAG(true)}>
                  <Wand2 className="w-4 h-4" /> Generar con IA
                </Button>
                <Button variant="primary" className="flex-1" onClick={handleAddQuestion}>
                  <Plus className="w-4 h-4" /> Agregar pregunta
                </Button>
              </div>
            </Card>
          </div>

          {/* Right column — sticky questions panel */}
          <div className="xl:sticky xl:top-20 space-y-4">
            <Card padding="none" className="overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
                <p className="font-bold text-sm flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-500" /> Preguntas
                  <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold px-2 py-0.5 rounded-full">{ed.questions.length}</span>
                </p>
              </div>
              <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                {ed.questions.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-semibold">Sin preguntas aún</p>
                    <p className="text-xs mt-1">Agrégalas desde el panel izquierdo</p>
                  </div>
                ) : (
                  ed.questions.map((q, idx) => (
                    <QuestionChip key={q.id} q={q} idx={idx} onDelete={ed.removeQuestion} />
                  ))
                )}
              </div>
            </Card>

            <Button
              variant="primary" className="w-full" size="lg"
              loading={saving}
              disabled={saving || !ed.questions.length || !ed.title.trim() || !ed.code.trim()}
              onClick={handleSave}
            >
              <Check className="w-4 h-4" />
              {editingId ? 'Guardar cambios' : 'Crear examen'}
            </Button>
            {!ed.questions.length && <p className="text-center text-xs text-slate-400">Agrega al menos una pregunta</p>}
          </div>
        </div>
      )}

      {/* ── TAB LISTA ── */}
      {tab === 'lista' && (
        <div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="Buscar por título o código..." value={filter}
              onChange={e => setFilter(e.target.value)} />
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-slate-500 font-semibold">No hay exámenes{filter ? ' para esa búsqueda' : ' registrados'}</p>
            </Card>
          ) : (
            <div className="grid gap-3">
              {filtered.map(e => (
                <Card key={e.id} className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-600/20">
                      <HelpCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{e.title}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <button onClick={() => copyCode(e.code)} className="flex items-center gap-1 font-mono text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full hover:bg-blue-100 transition-colors">
                          {e.code} <Copy className="w-3 h-3" />
                        </button>
                        <span className="flex items-center gap-1 text-xs text-slate-500"><Clock className="w-3 h-3" />{e.durationMinutes} min</span>
                        <span className="flex items-center gap-1 text-xs text-slate-500"><HelpCircle className="w-3 h-3" />{e.questions?.length ?? 0} preguntas</span>
                        <Badge variant={e.showCorrectAnswers ? 'green' : 'gray'}>
                          {e.showCorrectAnswers ? <><Eye className="w-3 h-3" />Muestra</> : <><EyeOff className="w-3 h-3" />Oculta</>}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-slate-400">{fmtDate(e.createdAt)}</span>
                    <Button variant="outline" size="sm" onClick={() => startEdit(e.id)}><Pen className="w-3.5 h-3.5" />Editar</Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(e.id, e.title)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RAG Modal */}
      {showRAG && (
        <RAGModal
          onAdd={newQ => {
            const added = ed.addGeneratedQuestions(newQ)
            toast.success(`${added} pregunta${added !== 1 ? 's' : ''} agregada${added !== 1 ? 's' : ''}`)
          }}
          onClose={() => setShowRAG(false)}
        />
      )}
    </div>
  )
}
