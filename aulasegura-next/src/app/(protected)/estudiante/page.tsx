'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { apiGetExamByCode, apiCreateSubmission } from '@/lib/api'
import { registerActiveStudent, updateStudentStatus, blockStudent, removeActiveStudent, listenToBlockStatus, sendMessageToTeacher } from '@/lib/monitor'
import { useFraudGuard } from '@/hooks/useFraudGuard'
import { Exam, Question, Violation } from '@/types'
import { fmt, shuffle } from '@/lib/utils'
import Button from '@/components/ui/Button'
import { Shield, Clock, Send, Unlock } from 'lucide-react'
import toast from 'react-hot-toast'

type BlockState = { isBlocked: boolean; reason: string; remote: boolean; local: boolean }

export default function EstudiantePage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const [exam, setExam]           = useState<Exam | null>(null)
  const [phase, setPhase]         = useState<'join' | 'exam' | 'blocked' | 'done'>('join')
  const [answers, setAnswers]     = useState<Record<string, unknown>>({})
  const [violations, setViolations] = useState<Violation[]>([])
  const [timer, setTimer]         = useState(0)
  const [blockState, setBlockState] = useState<BlockState>({ isBlocked: false, reason: '', remote: false, local: false })
  const [guardActive, setGuardActive] = useState(false)
  const [guardPaused, setGuardPaused] = useState(false)
  const [msgText, setMsgText]     = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [joinName, setJoinName]   = useState(user?.name ?? '')
  const [joinCode, setJoinCode]   = useState(user?.examCode ?? '')

  const sessionId = useRef(`s${Date.now()}${Math.random().toString(36).slice(2, 14)}`)
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const statusRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const unsubBlock = useRef<(() => void) | null>(null)

  // ── Fraud guard ──
  const addViolation = useCallback((reason: string) => {
    const v: Violation = { reason, timestamp: new Date().toISOString() }
    setViolations(prev => [...prev, v])
    if (exam) updateStudentStatus(exam.code, sessionId.current, { violations: violations.length + 1 }).catch(() => {})
  }, [exam, violations.length])

  const triggerBlock = useCallback(async (reason: string) => {
    if (blockState.isBlocked || submitting) return
    setBlockState(prev => ({ ...prev, isBlocked: true, local: true, reason }))
    setGuardPaused(true)
    timerRef.current && clearInterval(timerRef.current)
    addViolation(reason)
    if (exam) await blockStudent(exam.code, sessionId.current, reason).catch(() => {})
    setPhase('blocked')
  }, [blockState.isBlocked, submitting, exam, addViolation])

  const { requestFullscreen, exitFullscreen } = useFraudGuard({
    active:  guardActive,
    paused:  guardPaused,
    onViolation: triggerBlock,
  })

  // ── Check for guest exam shortcut ──
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('_guestExam')
      if (!raw) return
      sessionStorage.removeItem('_guestExam')
      const guestExam: Exam = JSON.parse(raw)
      if (!guestExam?.id) return
      startExam(guestExam)
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startExam = useCallback((e: Exam) => {
    const shuffled = { ...e, questions: shuffle(e.questions) }
    setExam(shuffled)
    setTimer((e.durationMinutes ?? 0) * 60)
    setAnswers({})
    setViolations([])
    setBlockState({ isBlocked: false, reason: '', remote: false, local: false })

    registerActiveStudent(e.code, {
      uid: sessionId.current, displayUid: user?.uid ?? sessionId.current,
      email: user?.email ?? '', name: user?.name ?? joinName, timeLeft: (e.durationMinutes ?? 0) * 60,
    }).catch(() => {})

    unsubBlock.current = listenToBlockStatus(e.code, sessionId.current, (isBlocked, reason) => {
      if (isBlocked) {
        setBlockState(prev => ({ ...prev, isBlocked: true, remote: true, reason: reason ?? 'Bloqueado por el profesor' }))
        setGuardPaused(true)
        timerRef.current && clearInterval(timerRef.current)
        setPhase('blocked')
      } else {
        setBlockState({ isBlocked: false, reason: '', remote: false, local: false })
        setGuardPaused(false)
        setPhase('exam')
      }
    })

    statusRef.current = setInterval(() => {
      updateStudentStatus(e.code, sessionId.current, {
        timeLeft: timer, answeredCount: Object.keys(answers).length,
      }).catch(() => {})
    }, 5000)

    requestFullscreen()
    setGuardActive(true)
    setGuardPaused(false)
    setPhase('exam')
  }, [user, joinName, timer, answers, requestFullscreen])

  // ── Timer ──
  useEffect(() => {
    if (phase !== 'exam' || !exam) return
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { clearInterval(timerRef.current!); finishExam(true); return 0 }
        return t - 1
      })
    }, 1000)
    return () => { timerRef.current && clearInterval(timerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, exam])

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      timerRef.current  && clearInterval(timerRef.current)
      statusRef.current && clearInterval(statusRef.current)
      unsubBlock.current?.()
      if (exam) {
        sessionStorage.setItem('_examReloadFlag', '1')
        removeActiveStudent(exam.code, sessionId.current).catch(() => {})
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam])

  const finishExam = async (forced = false) => {
    if (!exam || submitting) return
    setSubmitting(true)
    timerRef.current  && clearInterval(timerRef.current)
    statusRef.current && clearInterval(statusRef.current)
    unsubBlock.current?.()
    setGuardActive(false)
    await removeActiveStudent(exam.code, sessionId.current).catch(() => {})

    try {
      await apiCreateSubmission({
        examId: exam.id, code: exam.code, title: exam.title,
        studentEmail: user?.email ?? 'anónimo', studentName: user?.name ?? joinName,
        submittedAt: new Date().toISOString(),
        answers: Object.fromEntries(Object.entries(answers).filter(([, v]) => v !== undefined && v !== '')),
        violations, wasBlocked: blockState.isBlocked, blockReason: blockState.reason || null, forced,
      })
      sessionStorage.removeItem('_examReloadFlag')
      exitFullscreen()
      setPhase('done')
    } catch {
      toast.error('Error al enviar el examen. Intenta de nuevo.')
      setSubmitting(false)
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode) { toast.error('Ingresa un código'); return }
    try {
      const res = await apiGetExamByCode(joinCode.trim().toUpperCase())
      if (res?.ok && res.exam) {
        if (joinName && !user?.name) {
          // update name for guest
        }
        startExam(res.exam)
      } else {
        toast.error('Código inválido')
      }
    } catch { toast.error('Código no encontrado') }
  }

  // ── JOIN SCREEN ──
  if (phase === 'join') return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-8 animate-slide-up">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center shadow-2xl shadow-blue-600/30">
            <Shield className="w-9 h-9 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-black text-center text-slate-900 dark:text-white mb-1">Aula Segura</h1>
        <p className="text-sm text-center text-slate-500 mb-8">Ingresa el código de tu examen para comenzar</p>
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Tu nombre completo</label>
            <input className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="Ej: Camila Torres" value={joinName} onChange={e => setJoinName(e.target.value)} maxLength={60} />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Código del examen</label>
            <input className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-center text-2xl font-black tracking-widest font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="XXXXX" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} maxLength={10} required />
          </div>
          <Button type="submit" variant="primary" className="w-full" size="lg">Iniciar examen →</Button>
        </form>
        <div className="mt-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-1.5">
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2">⚠ Antes de comenzar</p>
          {['Serás monitoreado en tiempo real','No salgas de la ventana del examen','No presiones Escape ni salgas de pantalla completa','Solo el docente puede desbloquearte si eres bloqueado'].map(t => (
            <p key={t} className="text-xs text-amber-700 dark:text-amber-300">• {t}</p>
          ))}
        </div>
      </div>
    </div>
  )

  // ── BLOCKED SCREEN ──
  if (phase === 'blocked') return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-red-900 via-red-700 to-red-600 flex items-center justify-center p-4 text-white">
      <div className="max-w-lg w-full space-y-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-3xl font-black mb-2">Examen bloqueado</h1>
          <p className="text-red-200">El docente ha sido notificado. Solo él puede desbloquearte.</p>
        </div>
        <div className="bg-white/15 border border-white/30 rounded-2xl p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-red-200 mb-2">Razón del bloqueo</p>
          <p>{blockState.reason}</p>
        </div>
        {violations.length > 0 && (
          <div className="bg-white/10 rounded-2xl p-4 max-h-40 overflow-y-auto">
            <p className="text-xs font-bold uppercase tracking-wider text-red-200 mb-2">Infracciones ({violations.length})</p>
            {violations.map((v, i) => <p key={i} className="text-sm bg-white/10 rounded-lg px-3 py-1.5 mb-1"><b>{i+1}.</b> {v.reason}</p>)}
          </div>
        )}
        {/* Message to teacher */}
        {exam && (
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4">
            <p className="text-sm font-bold mb-3 flex items-center gap-2"><Send className="w-4 h-4" />Mensaje al docente</p>
            <div className="flex gap-2">
              <input className="flex-1 px-3 py-2 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                placeholder="Explica tu situación..." value={msgText} onChange={e => setMsgText(e.target.value)} />
              <button onClick={async () => {
                if (!msgText.trim() || !exam) return
                await sendMessageToTeacher(exam.code, sessionId.current, msgText, user?.name ?? joinName, user?.email ?? '').catch(() => {})
                setMsgText('')
                toast.success('Mensaje enviado')
              }} className="px-4 py-2 bg-white text-red-700 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors">
                Enviar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // ── DONE SCREEN ──
  if (phase === 'done') return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center animate-slide-up">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-600 to-green-500 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-600/30 text-5xl">✅</div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">¡Examen enviado!</h1>
        <p className="text-slate-500 mb-8">Tus respuestas han sido guardadas correctamente.</p>
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { val: Object.keys(answers).length, lbl: 'Respondidas' },
            { val: violations.length,           lbl: 'Infracciones' },
            { val: exam?.questions.length ?? 0, lbl: 'Total' },
          ].map(s => (
            <div key={s.lbl} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <p className="text-2xl font-black text-slate-900 dark:text-white">{s.val}</p>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{s.lbl}</p>
            </div>
          ))}
        </div>
        <Button variant="primary" size="lg" className="w-full" onClick={() => { logout(); router.push('/') }}>
          Volver al inicio
        </Button>
      </div>
    </div>
  )

  // ── EXAM SCREEN ──
  if (!exam) return null
  const questions = exam.questions
  const answered  = Object.keys(answers).filter(k => {
    const v = answers[k]; return Array.isArray(v) ? (v as unknown[]).length > 0 : v !== undefined && v !== ''
  }).length

  return (
    <div className="max-w-3xl mx-auto pb-24">
      {/* Sticky header */}
      <div className="sticky top-16 z-10 bg-gradient-to-r from-slate-900 via-blue-900 to-blue-700 rounded-2xl p-4 mb-6 shadow-xl shadow-blue-900/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-black text-lg leading-tight">{exam.title}</p>
            <p className="text-blue-200 text-xs mt-0.5 font-mono">{exam.code}</p>
          </div>
          <div className="text-right">
            <p className={`font-black text-3xl font-mono leading-none ${timer < 120 ? 'text-red-400' : 'text-white'}`}>{fmt(timer)}</p>
            <p className="text-blue-200 text-xs mt-1">{answered}/{questions.length} respondidas</p>
          </div>
        </div>
        <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${questions.length ? (answered / questions.length) * 100 : 0}%` }} />
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, idx) => (
          <QuestionCard key={q.id} q={q} idx={idx} answer={answers[q.id]}
            onAnswer={val => setAnswers(prev => ({ ...prev, [q.id]: val }))} />
        ))}
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 p-4 flex gap-3 max-w-3xl mx-auto">
        <Button variant="outline" className="flex-1" onClick={() => {
          if (confirm('¿Seguro que quieres salir? Perderás tu progreso.')) {
            setGuardActive(false); exitFullscreen()
            removeActiveStudent(exam.code, sessionId.current).catch(() => {})
            logout(); router.push('/')
          }
        }}>Salir</Button>
        <Button variant="primary" className="flex-1" loading={submitting} onClick={() => {
          if (confirm(`¿Enviar el examen? Respondiste ${answered} de ${questions.length} preguntas.`)) finishExam()
        }}>
          Enviar examen
        </Button>
      </div>
    </div>
  )
}

function QuestionCard({ q, idx, answer, onAnswer }: {
  q: Question; idx: number; answer: unknown; onAnswer: (v: unknown) => void
}) {
  const typeColors: Record<string, string> = {
    mc:    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    multi: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
    open:  'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    eq:    'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  }
  const typeLabels: Record<string, string> = { mc: 'Múltiple', multi: 'Varias correctas', open: 'Abierta', eq: 'Ecuación' }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm animate-fade-in" style={{ animationDelay: `${idx * 0.04}s` }}>
      <div className="flex items-start gap-3 mb-4">
        <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-700 to-blue-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0">{idx + 1}</span>
        <div className="flex-1 min-w-0">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full mb-2 inline-block ${typeColors[q.type]}`}>{typeLabels[q.type]}</span>
          <p className="text-slate-900 dark:text-white font-medium leading-relaxed">{q.text}</p>
        </div>
      </div>

      {q.type === 'mc' && (
        <div className="space-y-2">
          {(q.options ?? []).map((opt, i) => (
            <label key={i} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${Number(answer) === i ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>
              <input type="radio" name={`q-${q.id}`} value={i} checked={Number(answer) === i} onChange={() => onAnswer(i)} className="sr-only" />
              <span className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center text-xs font-black flex-shrink-0 transition-all ${Number(answer) === i ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-600 text-slate-500'}`}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-sm text-slate-700 dark:text-slate-300">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {q.type === 'multi' && (
        <div className="space-y-2">
          {(q.options ?? []).map((opt, i) => {
            const selected = Array.isArray(answer) ? (answer as number[]).includes(i) : false
            return (
              <label key={i} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selected ? 'border-cyan-600 bg-cyan-50 dark:bg-cyan-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
                <input type="checkbox" checked={selected} onChange={() => {
                  const prev = Array.isArray(answer) ? (answer as number[]) : []
                  onAnswer(selected ? prev.filter(x => x !== i) : [...prev, i])
                }} className="sr-only" />
                <span className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center text-xs font-black flex-shrink-0 transition-all ${selected ? 'bg-cyan-600 border-cyan-600 text-white' : 'border-slate-300 dark:border-slate-600 text-slate-500'}`}>
                  {selected ? '✓' : String.fromCharCode(65 + i)}
                </span>
                <span className="text-sm text-slate-700 dark:text-slate-300">{opt}</span>
              </label>
            )
          })}
        </div>
      )}

      {q.type === 'open' && (
        <textarea
          className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          rows={3} placeholder="Escribe tu respuesta aquí..."
          value={typeof answer === 'string' ? answer : ''}
          onChange={e => onAnswer(e.target.value)}
        />
      )}

      {q.type === 'eq' && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
          {q.referenceLatex && <p className="text-xs font-bold text-purple-600 mb-2">Referencia: {q.referenceLatex}</p>}
          <textarea
            className="w-full px-3 py-2 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            rows={2} placeholder="Escribe en LaTeX (ej: \frac{x}{2})"
            value={typeof answer === 'string' ? answer : ''}
            onChange={e => onAnswer(e.target.value)}
          />
        </div>
      )}
    </div>
  )
}
