'use client'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, Shield, Sun, Moon, LogOut, User } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function Navbar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dark, setDark] = useState(false)

  const toggleTheme = () => {
    setDark(d => !d)
    document.documentElement.classList.toggle('dark')
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
    setMenuOpen(false)
  }

  return (
    <nav className="sticky top-0 z-50 h-16 border-b border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl">
      <div className="max-w-screen-xl mx-auto px-4 h-full flex items-center justify-between gap-4">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-blue-600 dark:text-blue-400 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-700 to-purple-600 flex items-center justify-center shadow-md shadow-blue-600/30">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="text-slate-900 dark:text-white">Aula<strong className="text-blue-600">Segura</strong></span>
        </Link>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {user ? (
            <>
              <Link href="/perfil" className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-sm font-semibold text-slate-700 dark:text-slate-200">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  {user.name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <span className="max-w-[120px] truncate">{user.name || user.email.split('@')[0]}</span>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-3.5 h-3.5" /> Salir
              </Button>
            </>
          ) : (
            <>
              <Link href="/login"><Button variant="primary" size="sm">Ingresar</Button></Link>
              <Link href="/register"><Button variant="outline" size="sm">Crear cuenta</Button></Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setMenuOpen(o => !o)}>
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden absolute top-16 inset-x-0 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-lg z-50 p-4 flex flex-col gap-2 animate-slide-up">
          {user ? (
            <>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 mb-1">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
                  {user.name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
              </div>
              <Link href="/perfil" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <User className="w-4 h-4 text-blue-500" /> Mi perfil
              </Link>
              {user.role === 'docente' && (
                <>
                  <Link href="/docente" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Panel docente
                  </Link>
                  <Link href="/monitor" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Monitoreo
                  </Link>
                </>
              )}
              <div className="h-px bg-slate-200 dark:bg-slate-800 my-1" />
              <button onClick={toggleTheme} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-200 w-full text-left">
                {dark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-500" />}
                {dark ? 'Modo claro' : 'Modo oscuro'}
              </button>
              <button onClick={handleLogout} className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-semibold text-red-600 w-full text-left">
                <LogOut className="w-4 h-4" /> Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)}><Button variant="primary" className="w-full">Ingresar</Button></Link>
              <Link href="/register" onClick={() => setMenuOpen(false)}><Button variant="outline" className="w-full">Crear cuenta</Button></Link>
              <button onClick={toggleTheme} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-200 w-full text-left">
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {dark ? 'Modo claro' : 'Modo oscuro'}
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
