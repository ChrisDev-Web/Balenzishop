export const DELIVERY_MODES = {
  DELIVERY: 'delivery',
  SHALON_PAID: 'shalon_paid',
  SHALON_FREE: 'shalon_free',
}

export function getDeliveryFeeForAddress(address) {
  if (!address) {
    return { fee: 0, label: 'Sin dirección', zone: null, mode: DELIVERY_MODES.SHALON_FREE }
  }

  if (address.deliveryScope === 'provincia') {
    return { fee: 0, label: 'Recojo en Shalon (provincia)', zone: null, mode: DELIVERY_MODES.SHALON_FREE }
  }

  if (address.deliveryScope === 'lima') {
    return { fee: 0, label: 'Recojo en Shalon (Lima)', zone: null, mode: DELIVERY_MODES.SHALON_FREE }
  }

  return { fee: 0, label: 'Recojo en Shalon', zone: null, mode: DELIVERY_MODES.SHALON_FREE }
}

export function computeOrderTotal(subtotal, discount, deliveryFee, deliveryMode) {
  const productsTotal = Math.max(0, subtotal - discount)
  if (deliveryMode === DELIVERY_MODES.DELIVERY && deliveryFee > 0) {
    return productsTotal + deliveryFee
  }
  return productsTotal
}
