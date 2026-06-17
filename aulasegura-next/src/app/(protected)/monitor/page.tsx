'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useExams } from '@/hooks/useExams'
import { listenToActiveStudents, listenToMessages, blockStudent, unblockStudent, purgeGhosts, respondToStudent, deleteMessage } from '@/lib/monitor'
import { ActiveStudent, Exam, Message } from '@/types'
import { fmt, fmtTs } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { Radio, RefreshCw, ArrowLeft, Lock, Unlock, Users, MessageSquare, ChevronRight, Trash2, Send } from 'lucide-react'
import toast from 'react-hot-toast'

export default function MonitorPage() {
  const { user } = useAuth()
  const { exams, loading: examsLoading } = useExams()
  const [selected, setSelected]   = useState<Exam | null>(null)
  const [students, setStudents]   = useState<ActiveStudent[]>([])
  const [messages, setMessages]   = useState<Message[]>([])
  const [unblocking, setUnblocking] = useState(false)
  const [replyId, setReplyId]     = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  useEffect(() => {
    if (!selected) return
    const unsub1 = listenToActiveStudents(selected.code, async (s) => {
      await purgeGhosts(selected.code, s)
      setStudents(s.filter(st => (Date.now() - (st.lastActivity || st.joinedAt || 0)) <= 5 * 60 * 1000))
    })
    const unsub2 = listenToMessages(selected.code, setMessages)
    return () => { unsub1(); unsub2() }
  }, [selected])

  const handleUnblock = async (s: ActiveStudent) => {
    if (!selected || !confirm(`¿Desbloquear a ${s.name}?`)) return
    setUnblocking(true)
    try { await unblockStudent(selected.code, s.id); toast.success(`${s.name} desbloqueado`) }
    catch { toast.error('Error al desbloquear') }
    finally { setUnblocking(false) }
  }

  const handleBlock = async (s: ActiveStudent) => {
    if (!selected || !confirm(`¿Bloquear a ${s.name}?`)) return
    try { await blockStudent(selected.code, s.id, 'Bloqueado por el docente'); toast.success(`${s.name} bloqueado`) }
    catch { toast.error('Error al bloquear') }
  }

  const handleRespond = async (msgId: string) => {
    if (!selected || !replyText.trim()) return
    try { await respondToStudent(selected.code, msgId, replyText); setReplyId(null); setReplyText('') }
    catch { toast.error('Error al responder') }
  }

  const handleDeleteMsg = async (msgId: string) => {
    if (!selected || !confirm('¿Eliminar mensaje?')) return
    try { await deleteMessage(selected.code, msgId) }
    catch { toast.error('Error al eliminar') }
  }

  const blocked = students.filter(s => s.isBlocked)
  const unread  = messages.filter(m => !m.read)

  if (examsLoading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" /></div>

  // ── Exam selection ──
  if (!selected) return (
    <div className="max-w-3xl mx-auto">
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 p-8 mb-6">
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10">
          <svg width="160" height="120" viewBox="0 0 160 120" fill="none">
            <circle cx="80" cy="60" r="55" stroke="white" strokeWidth="1.5" strokeDasharray="8 5"/>
            <circle cx="80" cy="60" r="35" stroke="white" strokeWidth="1" strokeDasharray="5 4"/>
            <circle cx="135" cy="60" r="6" fill="white"/>
          </svg>
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              <Radio className="w-6 h-6" /> Monitoreo
            </h1>
            <p className="text-slate-300 text-sm mt-1">Supervisa tus exámenes en tiempo real</p>
            <div className="inline-flex items-center gap-2 mt-3 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-3 py-1 text-xs font-semibold text-white">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Sistema activo · {exams.length} examen{exams.length !== 1 ? 'es' : ''} disponible{exams.length !== 1 ? 's' : ''}
            </div>
          </div>
          <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4" /> Volver
          </Button>
        </div>
      </div>

      <Card>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Selecciona un examen para comenzar</p>
        {exams.length === 0 ? (
          <p className="text-center text-slate-500 py-8">No hay exámenes disponibles</p>
        ) : (
          <div className="space-y-2">
            {exams.map((e, i) => (
              <button key={e.id} onClick={() => setSelected(e)}
                className="w-full flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:shadow-md hover:shadow-blue-600/10 hover:-translate-y-0.5 transition-all text-left group"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-600/20">
                    <Radio className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{e.title}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">{e.code}</span>
                      <span className="text-xs text-slate-500">{e.durationMinutes} min</span>
                      <span className="text-xs text-slate-500">{e.questions?.length ?? 0} preguntas</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    Monitorear
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  )

  // ── Dashboard ──
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-blue-500" /> {selected.title}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            <span className="font-mono font-bold text-blue-600">{selected.code}</span>
            {' · '}{selected.durationMinutes} min{' · '}{selected.questions?.length ?? 0} preguntas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={async () => {
            const { db } = await import('@/lib/firebase')
            const { ref, get } = await import('firebase/database')
            const snap = await get(ref(db, `active_exams/${selected.code}/students`))
            const raw = snap.val()
            const s: ActiveStudent[] = raw ? Object.entries(raw).map(([id, v]) => ({ id, ...(v as object) } as ActiveStudent)) : []
            await purgeGhosts(selected.code, s)
            setStudents(s.filter(st => (Date.now() - (st.lastActivity || st.joinedAt || 0)) <= 5 * 60 * 1000))
            toast.success('Lista actualizada')
          }}>
            <RefreshCw className="w-4 h-4" /> Actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setSelected(null); setStudents([]); setMessages([]) }}>
            <ArrowLeft className="w-4 h-4" /> Cambiar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { val: students.length, lbl: 'Activos',    color: 'text-blue-600',  bg: 'bg-blue-50 dark:bg-blue-900/20',  icon: Users },
          { val: blocked.length,  lbl: 'Bloqueados', color: 'text-red-600',   bg: 'bg-red-50 dark:bg-red-900/20',    icon: Lock },
          { val: unread.length,   lbl: 'Sin leer',   color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: MessageSquare },
        ].map(s => (
          <Card key={s.lbl} className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className={`text-2xl font-black leading-none ${s.color}`}>{s.val}</p>
              <p className="text-xs text-slate-500 mt-0.5 uppercase tracking-wider font-semibold">{s.lbl}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Students table */}
      <Card padding="none" className="mb-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <p className="font-bold text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" /> Estudiantes en examen
            <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold px-2 py-0.5 rounded-full">{students.length}</span>
          </p>
        </div>
        {students.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold">Esperando estudiantes...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  {['Estudiante','Estado','Tiempo','Progreso','Infracciones','Actividad','Acción'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id} className={`border-t border-slate-100 dark:border-slate-800 ${s.isBlocked ? 'bg-red-50/50 dark:bg-red-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0 ${s.isBlocked ? 'bg-red-500' : 'bg-gradient-to-br from-blue-600 to-blue-500'}`}>
                          {(s.name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{s.name || 'Sin nombre'}</p>
                          <p className="text-xs text-slate-400">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={s.isBlocked ? 'red' : 'green'}>
                        {s.isBlocked ? <><Lock className="w-3 h-3" />Bloqueado</> : <>● Activo</>}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-sm" style={{ color: (s.timeLeft ?? 0) < 120 ? '#dc2626' : undefined }}>
                      {fmt(s.timeLeft ?? 0)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full min-w-[48px]">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${selected.questions?.length ? Math.round(((s.answeredCount||0)/selected.questions.length)*100) : 0}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 whitespace-nowrap">{s.answeredCount||0}/{selected.questions?.length||0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-bold text-sm ${(s.violations||0) > 0 ? 'text-red-600' : 'text-slate-400'}`}>{s.violations||0}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{fmtTs(s.lastActivity || s.joinedAt)}</td>
                    <td className="px-4 py-3">
                      {s.isBlocked
                        ? <Button variant="primary" size="sm" loading={unblocking} onClick={() => handleUnblock(s)}><Unlock className="w-3.5 h-3.5" />Desbloquear</Button>
                        : <Button variant="danger" size="sm" onClick={() => handleBlock(s)}><Lock className="w-3.5 h-3.5" />Bloquear</Button>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Messages */}
      <Card padding="none" className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <p className="font-bold text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-500" /> Mensajes
            {unread.length > 0 && <Badge variant="red">{unread.length} sin leer</Badge>}
          </p>
        </div>
        <div className="p-4 space-y-3 max-h-[480px] overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-6">No hay mensajes</p>
          ) : messages.map(m => (
            <div key={m.id} className={`rounded-xl border p-4 ${!m.read ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 border-l-4 border-l-blue-500' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${!m.read ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                    {(m.studentName||'?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">{m.studentName}</p>
                    <p className="text-xs text-slate-400">{fmtTs(m.timestamp)}</p>
                  </div>
                </div>
                <button onClick={() => handleDeleteMsg(m.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">{m.message}</p>
              {m.response ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-xs font-bold text-green-700 dark:text-green-400 mb-1">Tu respuesta</p>
                  <p className="text-sm text-green-800 dark:text-green-300">{m.response}</p>
                </div>
              ) : replyId === m.id ? (
                <div className="flex gap-2">
                  <input
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Escribe tu respuesta..."
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleRespond(m.id)}
                    autoFocus
                  />
                  <Button variant="primary" size="sm" onClick={() => handleRespond(m.id)}><Send className="w-3.5 h-3.5" /></Button>
                  <Button variant="outline" size="sm" onClick={() => { setReplyId(null); setReplyText('') }}>✕</Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => { setReplyId(m.id); setReplyText('') }}>
                  Responder
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
