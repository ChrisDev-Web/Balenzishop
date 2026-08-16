export const RESERVATION_UNIT_AMOUNT = 20

function normalizeCartItems(cartItems) {
  return Array.isArray(cartItems) ? cartItems : []
}

function isDecantCartItem(item) {
  return Boolean(item?.isDecant || item?.idProductDecant)
}

export function isLimaDeliveryScope(deliveryScope) {
  return deliveryScope === 'lima'
}

export function getReservationBreakdown(cartItems, { deliveryScope } = {}) {
  const items = normalizeCartItems(cartItems)
  const hasDecants = items.some(isDecantCartItem)
  const regularQuantity = items
    .filter((item) => !isDecantCartItem(item))
    .reduce((sum, item) => sum + Number(item.quantity || 0), 0)

  if (isLimaDeliveryScope(deliveryScope)) {
    return {
      isLimaFlat: true,
      hasDecants,
      regularQuantity,
      decantReservation: 0,
      regularReservation: 0,
      total: RESERVATION_UNIT_AMOUNT,
    }
  }

  const decantReservation = hasDecants ? RESERVATION_UNIT_AMOUNT : 0
  const regularReservation = regularQuantity * RESERVATION_UNIT_AMOUNT

  return {
    isLimaFlat: false,
    hasDecants,
    regularQuantity,
    decantReservation,
    regularReservation,
    total: decantReservation + regularReservation,
  }
}

export function calculateReservationAmount(cartItems, options = {}) {
  return getReservationBreakdown(cartItems, options).total
}

export function formatReservationHint(cartItems, { deliveryScope } = {}) {
  const breakdown = getReservationBreakdown(cartItems, { deliveryScope })

  if (breakdown.isLimaFlat) {
    return 'tarifa fija S/ 20 en Lima'
  }

  const { hasDecants, regularQuantity, total } = breakdown

  if (hasDecants && regularQuantity === 0) {
    return 'tarifa fija por decants'
  }

  if (hasDecants && regularQuantity > 0) {
    return `S/ ${RESERVATION_UNIT_AMOUNT} decants + ${regularQuantity} producto${regularQuantity === 1 ? '' : 's'} × S/ ${RESERVATION_UNIT_AMOUNT}`
  }

  const quantity = regularQuantity || normalizeCartItems(cartItems).reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  )

  return `${quantity} × S/ ${RESERVATION_UNIT_AMOUNT}`
}
