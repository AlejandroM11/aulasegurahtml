'use client'
import { useState, useRef } from 'react'
import { X, Wand2, FileText, Upload, ChevronDown, Send, Bot, User, Check } from 'lucide-react'
import { Question } from '@/types'
import { apiGenerateQuestions, apiChat } from '@/lib/api'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Props {
  onAdd:   (questions: Question[]) => void
  onClose: () => void
}

type InputMode = 'text' | 'pdf'
type Step      = 1 | 2

interface ChatMsg { role: 'user' | 'bot'; content: string }

function calcDistribution(n: number, hasMath: boolean) {
  const types = hasMath ? ['mc','multi','open','eq'] : ['mc','multi','open']
  const dist: Record<string, number> = {}
  types.forEach(t => { dist[t] = 0 })
  if (n <= 0) return dist
  const guaranteed = Math.min(n, types.length)
  for (let i = 0; i < guaranteed; i++) dist[types[i]] = 1
  let remaining = n - guaranteed
  const weights = hasMath ? { mc:3,multi:2,open:2,eq:2 } : { mc:3,multi:2,open:2 }
  const total = types.reduce((s,t) => s + (weights as Record<string,number>)[t], 0)
  while (remaining > 0) {
    let r = Math.random() * total
    for (const t of types) {
      r -= (weights as Record<string,number>)[t]
      if (r <= 0) { dist[t]++; remaining--; break }
    }
  }
  return dist
}

export default function RAGModal({ onAdd, onClose }: Props) {
  const [step,       setStep]       = useState<Step>(1)
  const [mode,       setMode]       = useState<InputMode>('text')
  const [textInput,  setTextInput]  = useState('')
  const [pdfText,    setPdfText]    = useState('')
  const [pdfName,    setPdfName]    = useState('')
  const [numQ,       setNumQ]       = useState(5)
  const [generating, setGenerating] = useState(false)
  const [generated,  setGenerated]  = useState<Question[]>([])
  const [selected,   setSelected]   = useState<Set<number>>(new Set())
  const [chatMsgs,   setChatMsgs]   = useState<ChatMsg[]>([{
    role: 'bot',
    content: 'Hola 👋 Puedo ayudarte a editar las preguntas. Por ejemplo:\n• "Haz la pregunta 2 más difícil"\n• "Convierte la pregunta 1 en ecuación"\n• "Agrega una pregunta de integral"'
  }])
  const [chatInput,  setChatInput]  = useState('')
  const [chatLoading,setChatLoading]= useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const loadPDF = async (file: File) => {
    setPdfName(`⏳ Leyendo: ${file.name}...`)
    try {
      const pdfjsLib = (window as unknown as { pdfjsLib: { getDocument: (o: { data: ArrayBuffer }) => { promise: Promise<{ numPages: number; getPage: (n: number) => Promise<{ getTextContent: () => Promise<{ items: { str: string }[] }> }> }> } } }).pdfjsLib
      if (!pdfjsLib) { toast.error('PDF.js no disponible'); return }
      const buffer = await file.arrayBuffer()
      const pdf    = await pdfjsLib.getDocument({ data: buffer }).promise
      let text = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page    = await pdf.getPage(i)
        const content = await page.getTextContent()
        text += content.items.map((it: { str: string }) => it.str).join(' ') + '\n'
      }
      setPdfText(text.trim())
      setPdfName(`✅ ${file.name} (${text.length} caracteres)`)
    } catch { setPdfName('❌ Error al leer el PDF') }
  }

  const generate = async () => {
    const text = mode === 'text' ? textInput.trim() : pdfText
    if (!text || text.length < 50) { toast.error('Agrega más contenido (mínimo 50 caracteres)'); return }
    setGenerating(true)
    try {
      const mathKw = /integral|derivad|ecuaci[oó]n|f[oó]rmula|[aá]lgebra|trigonometr|c[aá]lculo|l[ií]mite|matriz|vector|[∫∑∂√π∞]/i
      const hasMath = mathKw.test(text)
      const distribution = calcDistribution(numQ, hasMath)
      const res = await apiGenerateQuestions({ text, numQuestions: numQ, distribution })
      if (!res.ok || !res.questions.length) throw new Error('No se generaron preguntas')
      setGenerated(res.questions)
      setSelected(new Set(res.questions.map((_, i) => i)))
      setStep(2)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al generar')
    } finally {
      setGenerating(false)
    }
  }

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return
    const msg = chatInput.trim()
    setChatInput('')
    setChatMsgs(m => [...m, { role: 'user', content: msg }])
    setChatLoading(true)

    const ctx = generated.map((q, i) => {
      let line = `Pregunta ${i+1} [${q.type.toUpperCase()}]: ${q.text}`
      if (q.type === 'mc' && q.options) line += `\nOpciones: ${q.options.map((o,j) => `${j===q.correctIndex?'✓':''}${o}`).join(' | ')}`
      return line
    }).join('\n\n')

    const systemPrompt = `Eres un asistente educativo. El docente tiene estas preguntas:\n${ctx}\n\nSi pide editar, devuelve SOLO el array JSON de TODAS las preguntas actualizado. Sin texto extra, sin markdown.\nSi hace una pregunta general, responde brevemente en español.`

    try {
      const res = await apiChat([{ role: 'user', content: systemPrompt + '\n\nMensaje: ' + msg }])
      const reply = res.message.trim()
      const s = reply.indexOf('['), e = reply.lastIndexOf(']')
      if (s !== -1 && e !== -1) {
        try {
          const parsed = JSON.parse(reply.slice(s, e + 1)) as Question[]
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].text) {
            setGenerated(parsed)
            setSelected(new Set(parsed.map((_, i) => i)))
            setChatMsgs(m => [...m, { role: 'bot', content: `✅ Actualicé ${parsed.length} pregunta${parsed.length !== 1 ? 's' : ''}. Revísalas en el panel izquierdo.` }])
            return
          }
        } catch {}
      }
      setChatMsgs(m => [...m, { role: 'bot', content: reply }])
    } catch {
      setChatMsgs(m => [...m, { role: 'bot', content: '❌ Error de conexión.' }])
    } finally {
      setChatLoading(false)
    }
  }

  const handleAdd = () => {
    const sel = generated.filter((_, i) => selected.has(i)).map(q => ({
      ...q,
      id: crypto.randomUUID(),
      type: (q.isMath && q.latex) ? 'eq' as const : q.type,
      referenceLatex: (q.isMath && q.latex) ? q.latex : q.referenceLatex,
    }))
    if (!sel.length) { toast.error('Selecciona al menos una pregunta'); return }
    onAdd(sel)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div>
            <h2 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-purple-500" /> Generar preguntas con IA
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Powered by Groq + LLaMA 3</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Step 1 */}
          {step === 1 && (
            <div className="p-6 space-y-5">
              {/* Mode toggle */}
              <div className="grid grid-cols-2 gap-3">
                {([
                  { id: 'text', label: 'Pegar texto', icon: FileText },
                  { id: 'pdf',  label: 'Subir PDF',   icon: Upload },
                ] as const).map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => setMode(id)}
                    className={cn('flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left',
                      mode === id ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    )}>
                    <Icon className={cn('w-5 h-5', mode === id ? 'text-purple-600' : 'text-slate-400')} />
                    <span className={cn('font-semibold text-sm', mode === id ? 'text-slate-900 dark:text-white' : 'text-slate-500')}>{label}</span>
                  </button>
                ))}
              </div>

              {/* Text input */}
              {mode === 'text' && (
                <textarea
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  rows={8} placeholder="Pega aquí el contenido del temario, apuntes o cualquier material de clase..."
                  value={textInput} onChange={e => setTextInput(e.target.value)}
                />
              )}

              {/* PDF input */}
              {mode === 'pdf' && (
                <div>
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={async e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type === 'application/pdf') await loadPDF(f) }}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-10 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all"
                  >
                    <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="font-semibold text-slate-600 dark:text-slate-400">Arrastra un PDF aquí</p>
                    <p className="text-xs text-slate-400 mt-1">o haz clic para seleccionar</p>
                    <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) await loadPDF(f) }} />
                  </div>
                  {pdfName && <p className="text-sm text-slate-500 mt-2 text-center">{pdfName}</p>}
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Número de preguntas</label>
                  <select
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    value={numQ} onChange={e => setNumQ(Number(e.target.value))}
                  >
                    {[3,5,8,10].map(n => <option key={n} value={n}>{n} preguntas</option>)}
                  </select>
                </div>
                <div className="flex-1 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl px-4 py-3 text-xs text-purple-700 dark:text-purple-300 flex items-center gap-2">
                  <Wand2 className="w-4 h-4 flex-shrink-0" />
                  La IA generará automáticamente una mezcla de todos los tipos: opción múltiple, varias correctas, abierta y ecuación.
                </div>
                <Button variant="gradient" loading={generating} onClick={generate}>
                  <Wand2 className="w-4 h-4" /> Generar preguntas
                </Button>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="p-6">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3 text-sm text-green-700 dark:text-green-300 flex items-center gap-2 mb-5">
                <Check className="w-4 h-4 flex-shrink-0" />
                Preguntas generadas. Selecciona las que quieras y usa el asistente para editarlas.
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
                {/* Questions list */}
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {generated.map((q, idx) => {
                    const isSel = selected.has(idx)
                    return (
                      <div key={idx}
                        onClick={() => setSelected(s => { const n = new Set(s); isSel ? n.delete(idx) : n.add(idx); return n })}
                        className={cn('p-4 rounded-xl border-2 cursor-pointer transition-all',
                          isSel ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn('w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all',
                            isSel ? 'bg-purple-600 border-purple-600' : 'border-slate-300 dark:border-slate-600'
                          )}>
                            {isSel && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                {q.type.toUpperCase()}
                              </span>
                              <span className="text-xs text-slate-400">#{idx + 1}</span>
                            </div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white break-words">{q.text}</p>
                            {(q.type === 'mc' || q.type === 'multi') && q.options && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {q.options.map((o, i) => {
                                  const correct = q.type === 'mc' ? i === q.correctIndex : (q.correctIndexes ?? []).includes(i)
                                  return <span key={i} className={cn('text-xs px-2 py-0.5 rounded-full', correct ? 'bg-green-100 text-green-700 font-bold' : 'bg-slate-100 text-slate-500')}>{correct && '✓ '}{o}</span>
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Chat */}
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col h-[480px]">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 rounded-t-2xl flex-shrink-0">
                    <p className="text-white font-bold text-sm flex items-center gap-2"><Bot className="w-4 h-4" />Asistente ARDI</p>
                    <p className="text-white/70 text-xs">Pídeme que edite cualquier pregunta</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {chatMsgs.map((m, i) => (
                      <div key={i} className={cn('flex gap-2 items-end', m.role === 'user' && 'flex-row-reverse')}>
                        <div className={cn('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                          m.role === 'bot' ? 'bg-gradient-to-br from-purple-600 to-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                        )}>
                          {m.role === 'bot' ? <Bot className="w-3 h-3 text-white" /> : <User className="w-3 h-3 text-slate-600 dark:text-slate-300" />}
                        </div>
                        <div className={cn('px-3 py-2 rounded-xl text-xs leading-relaxed max-w-[85%] whitespace-pre-wrap',
                          m.role === 'bot'
                            ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-sm'
                            : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-br-sm'
                        )}>
                          {m.content}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex gap-2 items-end">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-3 h-3 text-white" />
                        </div>
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl rounded-bl-sm px-3 py-2 flex gap-1">
                          {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex gap-2 flex-shrink-0">
                    <textarea
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 max-h-16"
                      rows={1} placeholder="Ej: convierte la pregunta 2 en ecuación..."
                      value={chatInput} onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() } }}
                    />
                    <button onClick={sendChat} disabled={chatLoading}
                      className="w-8 h-8 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 flex-shrink-0 self-end">
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex-shrink-0 gap-3">
          {step === 2 && (
            <Button variant="outline" onClick={() => setStep(1)}>← Volver</Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          {step === 2 && (
            <Button variant="gradient" onClick={handleAdd}>
              <Check className="w-4 h-4" /> Agregar seleccionadas ({selected.size})
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
