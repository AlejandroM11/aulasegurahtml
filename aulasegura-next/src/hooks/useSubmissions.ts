'use client'
import { useState, useEffect, useCallback } from 'react'
import { Submission, Exam } from '@/types'
import { apiGetSubmissions, apiGetExams } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export function useSubmissions() {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [subs, allExams] = await Promise.all([apiGetSubmissions(), apiGetExams()])

      let fbUid = ''
      try {
        const { auth } = await import('@/lib/firebase')
        fbUid = auth.currentUser?.uid ?? ''
      } catch {}

      const myUids = new Set([user?.uid, user?.email, fbUid].filter(Boolean))
      let myExams: Exam[] = allExams.filter(e => e.teacherId && myUids.has(e.teacherId))
      if (!myExams.length) myExams = allExams

      const examMap: Record<string, Exam> = {}
      myExams.forEach(e => {
        if (e.id)   examMap[e.id] = e
        if (e.code) examMap[e.code.trim().toUpperCase()] = e
      })

      const myIds   = new Set(myExams.map(e => e.id).filter(Boolean))
      const myCodes = new Set(myExams.map(e => e.code?.trim().toUpperCase()).filter(Boolean))

      const filtered = subs
        .filter(s => {
          if (myExams === allExams) return true
          return (s.examId && myIds.has(s.examId)) ||
                 (s.code   && myCodes.has(s.code?.trim().toUpperCase()))
        })
        .map(s => {
          const exam = examMap[s.examId] ?? examMap[s.code?.trim().toUpperCase() ?? '']
          return { ...s, examQuestions: exam?.questions ?? [], showCorrectAnswers: exam?.showCorrectAnswers ?? false }
        })

      setSubmissions(filtered)
    } catch {
      toast.error('Error al cargar resultados')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { load() }, [load])

  return { submissions, loading, reload: load }
}
