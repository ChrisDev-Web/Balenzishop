export const USER_ROLES = {
  MINORISTA: 'minorista',
  MAYORISTA: 'mayorista',
}

export const WHOLESALE_DISCOUNT = 0.1
export const WHOLESALE_MIN_QTY = 6

export function resolveUserRole(_email, currentRole) {
  return currentRole || USER_ROLES.MINORISTA
}

export function getRoleLabel(role) {
  return role === USER_ROLES.MAYORISTA ? 'MAYORISTA' : 'MINORISTA'
}

export function isMayorista(role) {
  return role === USER_ROLES.MAYORISTA
}

export function getMinQuantity(role) {
  return isMayorista(role) ? WHOLESALE_MIN_QTY : 1
}

export function getProductPrice(basePrice, role) {
  if (isMayorista(role)) {
    return Math.round(basePrice * (1 - WHOLESALE_DISCOUNT) * 100) / 100
  }
  return basePrice
}

export function getOriginalPriceForRole(originalPrice, role) {
  if (!originalPrice) return null
  if (isMayorista(role)) {
    return Math.round(originalPrice * (1 - WHOLESALE_DISCOUNT) * 100) / 100
  }
  return originalPrice
}

export function prepareCartItem(perfume, role, quantity = 1) {
  const minQty = getMinQuantity(role)
  const basePrice = perfume.basePrice ?? perfume.price

  return {
    ...perfume,
    basePrice,
    price: getProductPrice(basePrice, role),
    quantity: Math.max(quantity, minQty),
  }
}

export function normalizeCartQuantity(quantity, role) {
  const minQty = getMinQuantity(role)
  if (quantity < minQty) return 0
  return quantity
}
