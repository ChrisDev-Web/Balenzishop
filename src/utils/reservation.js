export const RESERVATION_UNIT_AMOUNT = 20

function normalizeCartItems(cartItems) {
  return Array.isArray(cartItems) ? cartItems : []
}

function isDecantCartItem(item) {
  return Boolean(item?.isDecant || item?.idProductDecant)
}

export function getReservationBreakdown(cartItems) {
  const items = normalizeCartItems(cartItems)
  const hasDecants = items.some(isDecantCartItem)
  const regularQuantity = items
    .filter((item) => !isDecantCartItem(item))
    .reduce((sum, item) => sum + Number(item.quantity || 0), 0)

  const decantReservation = hasDecants ? RESERVATION_UNIT_AMOUNT : 0
  const regularReservation = regularQuantity * RESERVATION_UNIT_AMOUNT

  return {
    hasDecants,
    regularQuantity,
    decantReservation,
    regularReservation,
    total: decantReservation + regularReservation,
  }
}

export function calculateReservationAmount(cartItems) {
  return getReservationBreakdown(cartItems).total
}

export function formatReservationHint(cartItems) {
  const { hasDecants, regularQuantity, total } = getReservationBreakdown(cartItems)

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
