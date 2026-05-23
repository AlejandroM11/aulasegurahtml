import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmt(seconds: number): string {
  if (!seconds || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function fmtDate(iso: string | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function fmtTs(ts: number | undefined): string {
  if (!ts) return ''
  const diff = Date.now() - ts
  if (diff < 60000)   return 'Ahora'
  if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`
  return new Date(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

export function safeText(value: unknown): string {
  if (value == null) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function guestUid(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/** Fisher-Yates shuffle — returns a new array */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
