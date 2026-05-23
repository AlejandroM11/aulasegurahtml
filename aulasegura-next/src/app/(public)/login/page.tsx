'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Zap } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { apiLogin } from '@/lib/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { setUser } = useAuth()
  const router = useRouter()
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await apiLogin({ email, password })
      if (res.ok && res.user) {
        setUser(res.user)
        router.push(res.user.role === 'docente' ? '/docente' : '/estudiante')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-8">

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-900 to-blue-600 flex items-center justify-center shadow-2xl shadow-blue-600/30">
                <svg width="40" height="40" viewBox="0 0 110 110" fill="none">
                  <circle cx="55" cy="55" r="50" fill="url(#lgBg)" />
                  <defs>
                    <linearGradient id="lgBg" x1="0" y1="0" x2="110" y2="110" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#1e3a5f"/><stop offset="100%" stopColor="#2563eb"/>
                    </linearGradient>
                  </defs>
                  <rect x="36" y="52" width="38" height="28" rx="7" fill="white" opacity=".95"/>
                  <path d="M44 52 v-10 a11 11 0 0 1 22 0V52" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none"/>
                  <circle cx="55" cy="64" r="4" fill="#1e3a5f"/>
                  <rect x="53.5" y="64" width="3" height="7" rx="1.5" fill="#1e3a5f"/>
                </svg>
              </div>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
            </div>
          </div>

          <h1 className="text-2xl font-black text-center text-slate-900 dark:text-white mb-1">Iniciar sesión</h1>
          <p className="text-sm text-center text-slate-500 mb-8">Accede a tu cuenta para continuar</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
              autoComplete="email"
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
              autoComplete="current-password"
            />
            <Button type="submit" variant="primary" className="w-full" size="lg" loading={loading}>
              Entrar
            </Button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">O continúa con</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          </div>

          <Link href="/invitado">
            <Button variant="gradient" className="w-full" size="lg">
              <Zap className="w-4 h-4" /> Acceso rápido (sin cuenta)
            </Button>
          </Link>

          <p className="text-center text-sm text-slate-500 mt-6">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-blue-600 font-bold hover:underline">Regístrate</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
