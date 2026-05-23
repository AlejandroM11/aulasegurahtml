'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, User, Key } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { apiGetExamByCode } from '@/lib/api'
import { guestUid } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'

export default function GuestPage() {
  const { setUser } = useAuth()
  const router = useRouter()
  const [name, setName]   = useState('')
  const [code, setCode]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim().length < 3) { toast.error('El nombre debe tener al menos 3 caracteres'); return }
    setLoading(true)
    try {
      const res = await apiGetExamByCode(code.trim().toUpperCase())
      if (res?.ok && res.exam) {
        // Store exam for direct start (skip join screen)
        sessionStorage.setItem('_guestExam', JSON.stringify(res.exam))
        sessionStorage.removeItem('_examReloadFlag')
        setUser({
          uid:      guestUid(),
          email:    `invitado_${Date.now()}@temporal.local`,
          name:     name.trim(),
          role:     'estudiante',
          isGuest:  true,
          examCode: code.trim().toUpperCase(),
        })
        router.push('/estudiante')
      } else {
        toast.error('Código de examen inválido')
      }
    } catch {
      toast.error('Código de examen no encontrado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden">

          {/* Hero header */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <svg viewBox="0 0 200 100" className="w-full h-full"><circle cx="160" cy="20" r="60" stroke="white" strokeWidth="1" fill="none" strokeDasharray="8 5"/></svg>
            </div>
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-2xl">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-black text-white mb-1">Acceso Rápido</h1>
              <p className="text-slate-300 text-sm">Ingresa al examen sin necesidad de crear una cuenta</p>
            </div>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Tu nombre completo"
                type="text"
                placeholder="Juan Pérez"
                value={name}
                onChange={e => setName(e.target.value)}
                icon={<User className="w-4 h-4" />}
                required minLength={3} maxLength={50}
                autoFocus
              />
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                  <Key className="w-3.5 h-3.5 inline mr-1" />Código del examen
                </label>
                <input
                  type="text"
                  placeholder="ABC123"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  required maxLength={10}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-center text-2xl font-black tracking-widest font-mono placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all uppercase"
                />
              </div>
              <Button type="submit" variant="primary" className="w-full" size="lg" loading={loading}>
                <Zap className="w-4 h-4" /> Comenzar examen
              </Button>
            </form>

            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-2">
              {['No necesitas crear una cuenta', 'Tu sesión es temporal', 'Tus respuestas se guardan automáticamente'].map(t => (
                <p key={t} className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />{t}
                </p>
              ))}
            </div>

            <p className="text-center text-sm text-slate-500 mt-5">
              ¿Ya tienes cuenta?{' '}
              <a href="/login" className="text-blue-600 font-bold hover:underline">Inicia sesión</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
