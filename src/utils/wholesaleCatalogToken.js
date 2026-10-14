import { useWholesaleGuestStore } from '../stores/wholesaleGuestStore'
import { useUiStore } from '../stores/uiStore'

const WHOLESALE_CATALOG_PATHS = [
  'products/list_active_wholesale',
  'products/detail_wholesale',
  'catalog/bootstrap_wholesale',
]

export function isWholesaleCatalogApiPath(url = '') {
  const normalized = String(url).toLowerCase()
  return WHOLESALE_CATALOG_PATHS.some((path) => normalized.includes(path))
}

export function recoverWholesaleCatalogAccess() {
  useWholesaleGuestStore.getState().clearGuestAccess()
  useUiStore.getState().openWholesaleModal()
}

export function shouldRecoverWholesaleCatalogAccess(error) {
  if (error?.response?.status !== 401) return false
  if (!isWholesaleCatalogApiPath(error.config?.url ?? '')) return false

  const message = String(error.response?.data?.message ?? '').toLowerCase()
  const hadStoredToken = Boolean(useWholesaleGuestStore.getState().guestToken)
  const hadGuestHeader = Boolean(error.config?.headers?.['X-Wholesale-Guest-Token'])

  if (hadStoredToken || hadGuestHeader) return true

  return message.includes('clave de acceso mayorista')
}

export function persistWholesaleCatalogToken(payload) {
  if (!payload || typeof payload !== 'object') return

  const token = payload.wholesale_catalog_token ?? payload.guest_token ?? null

  if (token) {
    useWholesaleGuestStore.getState().setGuestToken(token)
  }
}

export function clearWholesaleCatalogTokenOnLogout() {
  useWholesaleGuestStore.getState().clearGuestAccess()
}
