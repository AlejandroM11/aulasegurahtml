'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, GraduationCap, BookOpen } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { apiRegister } from '@/lib/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

type Role = 'estudiante' | 'docente'

export default function RegisterPage() {
  const { setUser } = useAuth()
  const router = useRouter()
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole]         = useState<Role>('estudiante')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await apiRegister({ email, password, name, role })
      if (res.ok) {
        setUser({ uid: res.uid, email: res.email, name: res.name, role: res.role as Role })
        toast.success('¡Cuenta creada exitosamente!')
        router.push(role === 'docente' ? '/docente' : '/estudiante')
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-8">

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-700 to-blue-600 flex items-center justify-center shadow-2xl shadow-purple-600/30">
              <User className="w-9 h-9 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-black text-center text-slate-900 dark:text-white mb-1">Crear cuenta</h1>
          <p className="text-sm text-center text-slate-500 mb-8">Únete a Aula Segura</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Nombre completo" type="text" placeholder="Juan Pérez" value={name} onChange={e => setName(e.target.value)} icon={<User className="w-4 h-4" />} required />
            <Input label="Correo" type="email" placeholder="correo@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} icon={<Mail className="w-4 h-4" />} required />
            <Input label="Contraseña" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} icon={<Lock className="w-4 h-4" />} required minLength={6} />

            {/* Role selector */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">Rol</label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: 'estudiante', label: 'Estudiante', Icon: GraduationCap, color: 'text-green-600' },
                  { value: 'docente',    label: 'Docente',    Icon: BookOpen,      color: 'text-blue-600'  },
                ] as const).map(({ value, label, Icon, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                      role === value
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-sm shadow-blue-600/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    )}
                  >
                    <Icon className={cn('w-6 h-6', role === value ? color : 'text-slate-400')} />
                    <span className={cn('text-sm font-bold', role === value ? 'text-slate-900 dark:text-white' : 'text-slate-500')}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" variant="gradient" className="w-full" size="lg" loading={loading}>
              Registrarme
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-blue-600 font-bold hover:underline">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
