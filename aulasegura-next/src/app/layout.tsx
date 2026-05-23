import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/context/AuthContext'

export const metadata: Metadata = {
  title: 'AulaSegura — Exámenes seguros con IA',
  description: 'Plataforma de exámenes online con monitoreo anti-fraude en tiempo real y generación de preguntas con IA.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#f1f5f9',
                borderRadius: '12px',
                border: '1px solid #334155',
                fontSize: '0.875rem',
                fontWeight: '500',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
