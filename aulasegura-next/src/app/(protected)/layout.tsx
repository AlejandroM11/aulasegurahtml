'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Navbar from '@/components/layout/Navbar'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-64px)] max-w-screen-xl mx-auto px-4 py-6">
        {children}
      </main>
    </>
  )
}
