export const AUTH_INTENT = {
  CHECKOUT: 'checkout',
  ONBOARDING: 'onboarding',
  ORDERS: 'orders',
}

export function getRouteAfterLogin(user, authIntent) {
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

  return '/mi-cuenta'
}

export function getRouteAfterProfile(authIntent) {
  return authIntent === AUTH_INTENT.CHECKOUT
    ? '/mi-cuenta/direcciones?flujo=pedido'
    : '/mi-cuenta/direcciones?flujo=onboarding'
}

export function getRouteAfterAddress(authIntent) {
  return authIntent === AUTH_INTENT.CHECKOUT ? '/pedido' : '/mi-cuenta'
}
