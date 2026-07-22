export const AUTH_INTENT = {
  CHECKOUT: 'checkout',
  ONBOARDING: 'onboarding',
  ORDERS: 'orders',
}

const DEFAULT_RETURN = '/mi-cuenta'

const BLOCKED_RETURN_PREFIXES = ['/mi-cuenta/completar-perfil']

export function normalizeReturnTo(path) {
  if (!path || typeof path !== 'string') return null
  if (!path.startsWith('/') || path.startsWith('//')) return null
  if (BLOCKED_RETURN_PREFIXES.some((prefix) => path.startsWith(prefix))) return null
  return path
}

export function captureAuthReturnTo() {
  const { pathname, search } = window.location
  return normalizeReturnTo(pathname + search)
}

export function resolveReturnTo(returnTo, fallback = DEFAULT_RETURN) {
  return normalizeReturnTo(returnTo) ?? fallback
}

export function isAuthSetupRoute(route) {
  return (
    route === '/mi-cuenta/completar-perfil' ||
    route.startsWith('/mi-cuenta/direcciones')
  )
}

export function getRouteAfterLogin(user, authIntent, returnTo = null) {
  if (!user?.profileComplete) {
    return '/mi-cuenta/completar-perfil'
  }

  if (authIntent === AUTH_INTENT.ORDERS) {
    return '/mi-cuenta/pedidos'
  }

  if (!user.addresses?.length) {
    return authIntent === AUTH_INTENT.CHECKOUT
      ? '/mi-cuenta/direcciones?flujo=pedido'
      : '/mi-cuenta/direcciones?flujo=onboarding'
  }

  if (authIntent === AUTH_INTENT.CHECKOUT) {
    return '/pedido'
  }

  return resolveReturnTo(returnTo, DEFAULT_RETURN)
}

export function getRouteAfterProfile(user, authIntent, returnTo = null) {
  if (!user?.addresses?.length) {
    return authIntent === AUTH_INTENT.CHECKOUT
      ? '/mi-cuenta/direcciones?flujo=pedido'
      : '/mi-cuenta/direcciones?flujo=onboarding'
  }

  if (authIntent === AUTH_INTENT.ORDERS) {
    return '/mi-cuenta/pedidos'
  }

  if (authIntent === AUTH_INTENT.CHECKOUT) {
    return '/pedido'
  }

  return resolveReturnTo(returnTo, DEFAULT_RETURN)
}

export function getRouteAfterAddress(authIntent, returnTo = null) {
  if (authIntent === AUTH_INTENT.CHECKOUT) {
    return '/pedido'
  }

  if (authIntent === AUTH_INTENT.ORDERS) {
    return '/mi-cuenta/pedidos'
  }

  return resolveReturnTo(returnTo, DEFAULT_RETURN)
}
