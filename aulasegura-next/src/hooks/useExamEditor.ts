'use client'
import { useState, useCallback } from 'react'
import { Question, QuestionType } from '@/types'

function newId() { return crypto.randomUUID() }

export function useExamEditor(initial?: {
  title?: string; code?: string; dur?: number
  showCorrectAnswers?: boolean; questions?: Question[]
}) {
  const [title,              setTitle]              = useState(initial?.title              ?? '')
  const [code,               setCode]               = useState(initial?.code               ?? randomCode())
  const [dur,                setDur]                = useState(initial?.dur                ?? 30)
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(initial?.showCorrectAnswers ?? false)
  const [questions,          setQuestions]          = useState<Question[]>(initial?.questions ?? [])

  // ── Question form state ──
  const [qtext,         setQtext]         = useState('')
  const [qtype,         setQtype]         = useState<QuestionType>('mc')
  const [options,       setOptions]       = useState(['', '', '', ''])
  const [correctIndex,  setCorrectIndex]  = useState(0)
  const [correctIndexes,setCorrectIndexes]= useState<number[]>([0, 1])
  const [refLatex,      setRefLatex]      = useState('')

  const regenCode = () => setCode(randomCode())

  const addOption    = () => { if (options.length < 6) setOptions(o => [...o, '']) }
  const removeOption = (i: number) => {
    setOptions(o => o.filter((_, idx) => idx !== i))
    setCorrectIndex(c => (c >= i && c > 0 ? c - 1 : c))
    setCorrectIndexes(ci => ci.filter(x => x !== i).map(x => x > i ? x - 1 : x))
  }
  const setOption = (i: number, val: string) => setOptions(o => o.map((v, idx) => idx === i ? val : v))

  const toggleCorrectIndex = (i: number) => {
    setCorrectIndexes(ci => ci.includes(i) ? ci.filter(x => x !== i) : [...ci, i])
  }

  const addQuestion = useCallback(() => {
    if (!qtext.trim()) return false
    const base: Question = { id: newId(), text: qtext.trim(), type: qtype }
    if (qtype === 'mc') {
      const opts = options.filter(o => o.trim())
      if (opts.length < 2) return false
      Object.assign(base, { options: opts, correctIndex, isMath: false })
    } else if (qtype === 'multi') {
      const opts = options.filter(o => o.trim())
      if (opts.length < 2 || correctIndexes.length < 2) return false
      Object.assign(base, { options: opts, correctIndexes: correctIndexes.filter(i => i < opts.length), isMath: false })
    } else if (qtype === 'eq') {
      if (!refLatex.trim()) return false
      Object.assign(base, { isMath: true, referenceLatex: refLatex.trim() })
    }
    setQuestions(q => [...q, base])
    // reset form
    setQtext(''); setOptions(['', '', '', '']); setCorrectIndex(0)
    setCorrectIndexes([0, 1]); setRefLatex('')
    return true
  }, [qtext, qtype, options, correctIndex, correctIndexes, refLatex])

  const removeQuestion = (id: string) => setQuestions(q => q.filter(x => x.id !== id))

  const addGeneratedQuestions = (newQ: Question[]) => {
    const existingTexts = new Set(questions.map(q => q.text.trim().toLowerCase()))
    const unique = newQ.filter(q => !existingTexts.has(q.text.trim().toLowerCase()))
    setQuestions(q => [...q, ...unique])
    return unique.length
  }

  const reset = () => {
    setTitle(''); setCode(randomCode()); setDur(30)
    setShowCorrectAnswers(false); setQuestions([])
    setQtext(''); setOptions(['', '', '', '']); setCorrectIndex(0)
    setCorrectIndexes([0, 1]); setRefLatex('')
  }

  const loadExam = (e: { title: string; code: string; durationMinutes: number; showCorrectAnswers: boolean; questions: Question[] }) => {
    setTitle(e.title); setCode(e.code); setDur(e.durationMinutes)
    setShowCorrectAnswers(e.showCorrectAnswers); setQuestions(e.questions ?? [])
  }

  return {
    // exam fields
    title, setTitle, code, setCode, regenCode,
    dur, setDur, showCorrectAnswers, setShowCorrectAnswers,
    questions, setQuestions, removeQuestion, addGeneratedQuestions, reset, loadExam,
    // question form
    qtext, setQtext, qtype, setQtype,
    options, setOption, addOption, removeOption,
    correctIndex, setCorrectIndex,
    correctIndexes, toggleCorrectIndex,
    refLatex, setRefLatex,
    addQuestion,
  }
}

function randomCode() {
  return Math.random().toString(36).slice(2, 7).toUpperCase()
}
