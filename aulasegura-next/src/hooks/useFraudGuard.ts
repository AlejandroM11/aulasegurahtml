'use client'
import { useEffect, useRef, useCallback } from 'react'

interface FraudGuardOptions {
  active:    boolean
  paused:    boolean
  onViolation: (reason: string) => void
}

const BLOCKED_KEYS: Record<string, string> = {
  Escape:      'Presionaste Escape',
  F11:         'Intentaste cambiar pantalla completa (F11)',
  F12:         'Intentaste abrir DevTools (F12)',
  PrintScreen: 'Intentaste tomar captura de pantalla',
}

export function useFraudGuard({ active, paused, onViolation }: FraudGuardOptions) {
  const enteringFullscreen = useRef(false)

  const requestFullscreen = useCallback(() => {
    enteringFullscreen.current = true
    const el = document.documentElement
    const p  = el.requestFullscreen?.() ?? (el as unknown as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen?.()
    const clear = () => { enteringFullscreen.current = false }
    if (p && typeof p.then === 'function') p.then(clear).catch(clear)
    else setTimeout(clear, 800)
  }, [])

  const exitFullscreen = useCallback(() => {
    document.exitFullscreen?.().catch(() => {})
  }, [])

  useEffect(() => {
    if (!active) return

    const isReloading = () => {
      try { return !!sessionStorage.getItem('_examReloadFlag') } catch { return false }
    }

    const onKey = (e: KeyboardEvent) => {
      if (paused || isReloading()) return
      if (BLOCKED_KEYS[e.key]) { e.preventDefault(); e.stopPropagation(); onViolation(BLOCKED_KEYS[e.key]); return }
      if (e.key === 'Meta' || e.metaKey) { e.preventDefault(); onViolation('Presionaste la tecla Windows/Meta') }
      else if (e.altKey && e.key === 'Tab') { e.preventDefault(); onViolation('Intentaste cambiar de ventana (Alt+Tab)') }
      else if (e.ctrlKey && e.shiftKey && ['Escape','I','J'].includes(e.key)) { e.preventDefault(); onViolation('Intentaste abrir herramientas del navegador') }
      else if (e.ctrlKey && e.key === 'p') { e.preventDefault(); onViolation('Intentaste imprimir') }
      else if (e.ctrlKey && ['c','C'].includes(e.key)) { e.preventDefault(); onViolation('Intentaste copiar contenido') }
    }

    const onBlur = () => {
      if (paused || enteringFullscreen.current || isReloading()) return
      onViolation('Saliste de la ventana del examen')
    }

    const onVisibility = () => {
      if (paused || enteringFullscreen.current || isReloading()) return
      if (document.hidden) onViolation('Cambiaste de pestaña o minimizaste el navegador')
    }

    const onFullscreen = () => {
      if (paused || enteringFullscreen.current || isReloading()) return
      if (!document.fullscreenElement) onViolation('Saliste del modo pantalla completa')
    }

    const onContext = (e: MouseEvent) => {
      const isMQ = (e.target as Element)?.closest?.('.mq-editable-field')
      if (!isMQ) e.preventDefault()
      if (!paused && !isMQ) onViolation('Intentaste abrir el menú contextual')
    }

    const onCopy = (e: ClipboardEvent) => { e.preventDefault(); if (!paused) onViolation('Intentaste copiar contenido del examen') }

    document.addEventListener('keydown', onKey, { capture: true })
    window.addEventListener('blur', onBlur)
    document.addEventListener('visibilitychange', onVisibility)
    document.addEventListener('fullscreenchange', onFullscreen)
    document.addEventListener('webkitfullscreenchange', onFullscreen)
    document.addEventListener('contextmenu', onContext, { capture: true })
    document.addEventListener('copy', onCopy, { capture: true })

    return () => {
      document.removeEventListener('keydown', onKey, { capture: true })
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('visibilitychange', onVisibility)
      document.removeEventListener('fullscreenchange', onFullscreen)
      document.removeEventListener('webkitfullscreenchange', onFullscreen)
      document.removeEventListener('contextmenu', onContext, { capture: true })
      document.removeEventListener('copy', onCopy, { capture: true })
    }
  }, [active, paused, onViolation])

  return { requestFullscreen, exitFullscreen }
}
