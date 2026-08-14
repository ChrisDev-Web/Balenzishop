import { isCheckoutLegalViewActive, markCheckoutLegalView } from './checkoutReservationStorage'

export const CHECKOUT_RESERVATION_EXEMPT_PATHS = [
  '/terminos-y-condiciones',
  '/politica-de-privacidad',
]

export function normalizeAppPathname(pathname = '') {
  const raw = String(pathname || (typeof window !== 'undefined' ? window.location.pathname : '') || '/')
  const withoutQuery = raw.split('?')[0].split('#')[0]
  if (withoutQuery.length > 1 && withoutQuery.endsWith('/')) {
    return withoutQuery.slice(0, -1)
  }
  return withoutQuery || '/'
}

export function isCheckoutReservationExemptPath(pathname) {
  const normalized = normalizeAppPathname(pathname).toLowerCase()

  return CHECKOUT_RESERVATION_EXEMPT_PATHS.some(
    (path) => normalized === path || normalized.startsWith(`${path}/`),
  )
}

export function isCheckoutReservationGuardSuspended(pathname) {
  return isCheckoutReservationExemptPath(pathname) || isCheckoutLegalViewActive()
}

export function shouldRedirectActiveCheckoutDraft(pathname) {
  const normalized = normalizeAppPathname(pathname)
  if (isCheckoutReservationGuardSuspended(normalized)) return false

  return normalized !== '/pedido'
}

export function syncCheckoutLegalViewFromUrl() {
  if (typeof window === 'undefined') return

  const path = normalizeAppPathname(window.location.pathname)
  if (isCheckoutReservationExemptPath(path)) {
    markCheckoutLegalView()
  }
}

if (typeof window !== 'undefined') {
  syncCheckoutLegalViewFromUrl()
}
