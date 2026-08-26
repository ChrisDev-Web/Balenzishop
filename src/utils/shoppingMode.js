export const CART_MODES = {
  MINORISTA: 'minorista',
  MAYORISTA: 'mayorista',
}

export function isWholesaleCartMode(mode) {
  return mode === CART_MODES.MAYORISTA
}

export function resolveShoppingModeFromPath(pathname = '') {
  if (pathname === '/mayorista' || pathname.startsWith('/mayorista/')) {
    return CART_MODES.MAYORISTA
  }

  return CART_MODES.MINORISTA
}

export function resolvePricingRoleForMode(mode) {
  return isWholesaleCartMode(mode) ? 'mayorista' : 'minorista'
}

export function resolveCheckoutChannelFromSearch(searchParams) {
  const channel = searchParams?.get?.('canal') ?? searchParams?.canal
  return channel === CART_MODES.MAYORISTA ? CART_MODES.MAYORISTA : CART_MODES.MINORISTA
}

export function resolvePreferredCheckoutMode({
  searchParams = null,
  minoristaCount = 0,
  mayoristaCount = 0,
  canUseDualCarts = false,
} = {}) {
  const channel = searchParams?.get?.('canal') ?? searchParams?.canal

  if (channel === CART_MODES.MAYORISTA) {
    return CART_MODES.MAYORISTA
  }

  if (channel === CART_MODES.MINORISTA) {
    return CART_MODES.MINORISTA
  }

  if (canUseDualCarts) {
    if (mayoristaCount > 0 && minoristaCount === 0) {
      return CART_MODES.MAYORISTA
    }

    if (minoristaCount > 0 && mayoristaCount === 0) {
      return CART_MODES.MINORISTA
    }
  }

  return CART_MODES.MINORISTA
}

export function buildCheckoutPath(mode = CART_MODES.MINORISTA) {
  if (mode === CART_MODES.MAYORISTA) {
    return '/pedido?canal=mayorista'
  }

  return '/pedido'
}

export function buildWhatsappAccessMessage(user) {
  const name = [user?.firstName, user?.lastNamePaternal, user?.lastNameMaternal]
    .filter(Boolean)
    .join(' ')
    .trim()
  const email = user?.email ?? ''
  const phone = user?.phone ?? ''

  return [
    'Hola, solicito mi clave de acceso mayorista.',
    name ? `Nombre: ${name}` : null,
    email ? `Correo: ${email}` : null,
    phone ? `Teléfono: ${phone}` : null,
  ]
    .filter(Boolean)
    .join('\n')
}

export function buildWhatsappAccessUrl(user) {
  const message = encodeURIComponent(buildWhatsappAccessMessage(user))
  return `https://wa.me/51924341477?text=${message}`
}

export function productLinkForMode(productId, mode = CART_MODES.MINORISTA) {
  if (isWholesaleCartMode(mode)) {
    return `/mayorista/producto/${productId}`
  }

  return `/producto/${productId}`
}

export function catalogLinkForMode(mode = CART_MODES.MINORISTA) {
  return isWholesaleCartMode(mode) ? '/mayorista' : '/catalogo'
}
