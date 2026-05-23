'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Mail, Lock, Camera, ArrowLeft, Save, Shield, Calendar } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { db, auth } from '@/lib/firebase'
import { ref, update } from 'firebase/database'
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

type Tab = 'info' | 'foto' | 'password'

export default function PerfilPage() {
  const { user, setUser } = useAuth()
  const router = useRouter()
  const [tab, setTab]         = useState<Tab>('info')
  const [name, setName]       = useState(user?.name ?? '')
  const [photoUrl, setPhotoUrl] = useState(user?.photo ?? '')
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew]     = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [saving, setSaving]   = useState(false)

  if (!user) return null

  const initials = user.name?.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) ?? '?'
  const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Desconocido'

  const saveInfo = async () => {
    if (!name.trim()) { toast.error('El nombre no puede estar vacío'); return }
    setSaving(true)
    try {
      await update(ref(db, `users/${user.uid}`), { name: name.trim() })
      setUser({ ...user, name: name.trim() })
      toast.success('Nombre actualizado')
    } catch { toast.error('Error al guardar') }
    finally { setSaving(false) }
  }

  const savePhoto = async () => {
    setSaving(true)
    try {
      await update(ref(db, `users/${user.uid}`), { photo: photoUrl })
      setUser({ ...user, photo: photoUrl })
      toast.success('Foto actualizada')
    } catch { toast.error('Error al guardar') }
    finally { setSaving(false) }
  }

  const savePassword = async () => {
    if (pwNew.length < 6) { toast.error('Mínimo 6 caracteres'); return }
    if (pwNew !== pwConfirm) { toast.error('Las contraseñas no coinciden'); return }
    setSaving(true)
    try {
      const fbUser = auth.currentUser
      if (!fbUser) throw new Error('No hay sesión activa')
      if (pwCurrent) {
        const cred = EmailAuthProvider.credential(user.email, pwCurrent)
        await reauthenticateWithCredential(fbUser, cred)
      }
      await updatePassword(fbUser, pwNew)
      await update(ref(db, `users/${user.uid}`), { hasPassword: true })
      setUser({ ...user, hasPassword: true })
      setPwCurrent(''); setPwNew(''); setPwConfirm('')
      toast.success('Contraseña actualizada')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error'
      toast.error(msg.includes('wrong-password') ? 'Contraseña actual incorrecta' : msg)
    } finally { setSaving(false) }
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'info',     label: 'Mi perfil',   icon: User },
    { id: 'foto',     label: 'Foto',        icon: Camera },
    { id: 'password', label: 'Contraseña',  icon: Lock },
  ]

  return (
    <div className="max-w-3xl mx-auto">
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 p-8 mb-0 rounded-b-none">
        <button onClick={() => router.push(user.role === 'docente' ? '/docente' : '/estudiante')}
          className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-semibold bg-white/15 border border-white/25 rounded-lg px-3 py-1.5 mb-6 transition-colors backdrop-blur-sm">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full ring-4 ring-white/30 overflow-hidden bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl">
              {user.photo
                ? <img src={user.photo} alt={user.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                : <span className="text-white text-2xl font-black">{initials}</span>
              }
            </div>
            <button onClick={() => setTab('foto')} className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-colors shadow-md">
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">{user.name || 'Sin nombre'}</h1>
            <p className="text-white/70 text-sm">{user.email}</p>
            <span className={`inline-flex items-center gap-1.5 mt-2 px-3 py-0.5 rounded-full text-xs font-bold ${user.role === 'docente' ? 'bg-blue-500/30 text-blue-200' : 'bg-green-500/30 text-green-200'}`}>
              <Shield className="w-3 h-3" />{user.role === 'docente' ? 'Docente' : 'Estudiante'}
            </span>
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-b-3xl shadow-xl overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn('flex items-center gap-2 px-4 py-4 text-sm font-semibold border-b-2 -mb-px transition-colors',
                tab === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              )}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Info tab */}
          {tab === 'info' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Card className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">{user.role === 'docente' ? 'Docente' : 'Estudiante'}</p>
                    <p className="text-xs text-slate-500">Rol en la plataforma</p>
                  </div>
                </Card>
                <Card className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">{joinDate}</p>
                    <p className="text-xs text-slate-500">Miembro desde</p>
                  </div>
                </Card>
              </div>
              <Input label="Nombre completo" type="text" value={name} onChange={e => setName(e.target.value)} icon={<User className="w-4 h-4" />} />
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Correo electrónico</label>
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600 dark:text-slate-400 flex-1">{user.email}</span>
                  <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-500 px-2 py-0.5 rounded-full">No editable</span>
                </div>
              </div>
              <Button variant="primary" className="w-full" size="lg" loading={saving} onClick={saveInfo}>
                <Save className="w-4 h-4" /> Guardar cambios
              </Button>
            </div>
          )}

          {/* Foto tab */}
          {tab === 'foto' && (
            <div className="space-y-5">
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-xl">
                  {photoUrl
                    ? <img src={photoUrl} alt="preview" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    : <span className="text-white text-3xl font-black">{initials}</span>
                  }
                </div>
              </div>
              <Input label="URL de la foto" type="url" placeholder="https://ejemplo.com/foto.jpg" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} icon={<Camera className="w-4 h-4" />} />
              <p className="text-xs text-slate-400">Usa una imagen pública (Imgur, GitHub, Google Photos, etc.)</p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => { setPhotoUrl(''); setUser({ ...user, photo: '' }) }}>Quitar foto</Button>
                <Button variant="primary" className="flex-1" loading={saving} onClick={savePhoto}><Save className="w-4 h-4" />Guardar foto</Button>
              </div>
            </div>
          )}

          {/* Password tab */}
          {tab === 'password' && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-300">
                Ingresa tu contraseña actual para poder cambiarla.
              </div>
              {!user.fromGoogle || user.hasPassword ? (
                <Input label="Contraseña actual" type="password" placeholder="Tu contraseña actual" value={pwCurrent} onChange={e => setPwCurrent(e.target.value)} icon={<Lock className="w-4 h-4" />} />
              ) : null}
              <Input label="Nueva contraseña" type="password" placeholder="Mínimo 6 caracteres" value={pwNew} onChange={e => setPwNew(e.target.value)} icon={<Lock className="w-4 h-4" />} />
              <Input label="Confirmar contraseña" type="password" placeholder="Repite la nueva contraseña" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} icon={<Lock className="w-4 h-4" />}
                error={pwConfirm && pwNew !== pwConfirm ? 'Las contraseñas no coinciden' : undefined} />
              <Button variant="primary" className="w-full" size="lg" loading={saving} onClick={savePassword}>
                <Shield className="w-4 h-4" /> Cambiar contraseña
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
