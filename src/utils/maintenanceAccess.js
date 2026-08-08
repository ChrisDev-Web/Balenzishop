const STORAGE_KEY = 'balenzishop_preview_access'
const PREVIEW_PARAM = 'preview'

export function isMaintenanceModeEnabled() {
  const raw = import.meta.env.VITE_MAINTENANCE_MODE
  return raw === true || raw === 'true' || raw === '1'
}

export function getPreviewSecret() {
  return (import.meta.env.VITE_MAINTENANCE_PREVIEW_SECRET || '').trim()
}

export function hasMaintenanceBypass() {
  if (!isMaintenanceModeEnabled()) {
    return true
  }

  if (typeof window === 'undefined') {
    return false
  }

  return localStorage.getItem(STORAGE_KEY) === 'granted'
}

export function grantMaintenanceBypass() {
  localStorage.setItem(STORAGE_KEY, 'granted')
}

export function revokeMaintenanceBypass() {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Si la URL trae ?preview=SECRETO válido, guarda el acceso y limpia la query.
 * Llamar antes del primer render para evitar un flash de la pantalla de mantenimiento.
 */
export function processPreviewAccessFromUrl() {
  if (typeof window === 'undefined' || !isMaintenanceModeEnabled()) {
    return false
  }

  const secret = getPreviewSecret()
  if (!secret) {
    return false
  }

  const params = new URLSearchParams(window.location.search)
  const token = params.get(PREVIEW_PARAM)

  if (!token || token !== secret) {
    return false
  }

  grantMaintenanceBypass()

  params.delete(PREVIEW_PARAM)
  const query = params.toString()
  const cleanUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
  window.history.replaceState({}, '', cleanUrl)

  return true
}

export function buildPreviewAccessUrl(origin = typeof window !== 'undefined' ? window.location.origin : '') {
  const secret = getPreviewSecret()
  if (!origin || !secret) {
    return origin || '/'
  }

  return `${origin}/?preview=${encodeURIComponent(secret)}`
}
