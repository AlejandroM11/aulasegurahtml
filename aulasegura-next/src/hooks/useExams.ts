'use client'
import { useState, useEffect, useCallback } from 'react'
import { Exam } from '@/types'
import { apiGetExams, apiCreateExam, apiUpdateExam, apiDeleteExam } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export function useExams() {
  const { user } = useAuth()
  const [exams, setExams]     = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const all = await apiGetExams()
      const mine = all.filter(e =>
        e.teacherId === user?.uid || e.teacherId === user?.email
      )
      setExams(mine.length > 0 ? mine : all)
    } catch {
      toast.error('Error al cargar exámenes')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { load() }, [load])

  const createExam = async (data: Omit<Exam, 'id' | 'createdAt'>) => {
    const res = await apiCreateExam({ ...data, teacherId: user?.uid })
    await load()
    return res
  }

  const updateExam = async (id: string, data: Partial<Exam>) => {
    await apiUpdateExam(id, data)
    await load()
  }

  const deleteExam = async (id: string) => {
    await apiDeleteExam(id)
    setExams(prev => prev.filter(e => e.id !== id))
  }

  return { exams, loading, reload: load, createExam, updateExam, deleteExam }
}
