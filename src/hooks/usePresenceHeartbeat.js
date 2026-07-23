import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { API_BASE_URL } from '../api/config'
import { useAuthStore } from '../stores/authStore'

const HEARTBEAT_INTERVAL_MS = 30_000
const SESSION_STORAGE_KEY = 'bz_presence_session'

function getSessionId() {
  try {
    let id = window.localStorage.getItem(SESSION_STORAGE_KEY)
    if (!id) {
      id = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
      window.localStorage.setItem(SESSION_STORAGE_KEY, id)
    }
    return id
  } catch {
    return null
  }
}

function sectionFromPathname(pathname) {
  if (pathname === '/') return 'inicio'
  if (pathname.startsWith('/mujeres')) return 'mujeres'
  if (pathname.startsWith('/hombres')) return 'hombres'
  if (pathname.startsWith('/promociones')) return 'promociones'
  if (pathname.startsWith('/catalogo')) return 'catalogo'
  if (pathname.startsWith('/producto')) return 'producto'
  if (pathname.startsWith('/pedido')) return 'pedido'
  if (pathname.startsWith('/mi-cuenta')) return 'cuenta'
  return 'otros'
}

function sendHeartbeat(sessionId, section, accessToken) {
  if (!sessionId) return

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  fetch(`${API_BASE_URL}presence/heartbeat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ session_id: sessionId, section }),
    keepalive: true,
  }).catch(() => {
    // La presencia es best-effort: nunca debe romper la navegación.
  })
}

export function usePresenceHeartbeat() {
  const { pathname } = useLocation()
  const accessToken = useAuthStore((state) => state.accessToken)
  const latestRef = useRef({ section: 'inicio', accessToken: null })

  latestRef.current = { section: sectionFromPathname(pathname), accessToken }

  useEffect(() => {
    const sessionId = getSessionId()
    if (!sessionId) return undefined

    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      sendHeartbeat(sessionId, latestRef.current.section, latestRef.current.accessToken)
    }, HEARTBEAT_INTERVAL_MS)

    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        sendHeartbeat(sessionId, latestRef.current.section, latestRef.current.accessToken)
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  useEffect(() => {
    const sessionId = getSessionId()
    if (!sessionId) return
    sendHeartbeat(sessionId, sectionFromPathname(pathname), accessToken)
  }, [pathname, accessToken])
}

export default function PresenceTracker() {
  usePresenceHeartbeat()
  return null
}
