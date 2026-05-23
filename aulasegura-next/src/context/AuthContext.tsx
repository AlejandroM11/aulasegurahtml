'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@/types'

interface AuthContextType {
  user:    User | null
  setUser: (u: User | null) => void
  logout:  () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null, setUser: () => {}, logout: () => {}, loading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user')
      if (raw) setUserState(JSON.parse(raw))
    } catch {}
    setLoading(false)
  }, [])

  const setUser = (u: User | null) => {
    setUserState(u)
    if (u) localStorage.setItem('user', JSON.stringify(u))
    else    localStorage.removeItem('user')
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
