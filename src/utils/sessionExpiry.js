let isHandlingSessionExpiry = false

const AUTH_EXEMPT_PATHS = [
  'clients/login',
  'clients/register',
  'clients/logout',
]

function isAuthExemptRequest(url = '') {
  const normalized = String(url).toLowerCase()
  return AUTH_EXEMPT_PATHS.some((path) => normalized.includes(path))
}

export function isSessionExpiredError(error) {
  return error?.response?.status === 401 || error?.isSessionExpired === true
}

export function handleClientSessionExpired() {
  if (isHandlingSessionExpiry) return

  isHandlingSessionExpiry = true

  import('../stores/authStore.js')
    .then(({ useAuthStore }) => {
      const { isAuthenticated, logout } = useAuthStore.getState()
      if (!isAuthenticated) {
        isHandlingSessionExpiry = false
        return undefined
      }

      return logout()
    })
    .finally(() => {
      const path = window.location.pathname
      if (path.startsWith('/mi-cuenta') || path.startsWith('/pedido')) {
        window.location.replace('/')
        return
      }

      isHandlingSessionExpiry = false
    })
}

export function markSessionExpiredError(error) {
  if (!error || typeof error !== 'object') {
    return error
  }

  error.isSessionExpired = true
  return error
}

export { isAuthExemptRequest }
