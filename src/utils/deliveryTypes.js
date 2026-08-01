export const DELIVERY_TYPES = {
  SHALON: 'shalon',
  DELIVERY: 'delivery',
  RAINAU: 'delivery_rainau',
  OWN: 'delivery_own',
}

export function isHomeDeliveryType(deliveryType) {
  return (
    deliveryType === DELIVERY_TYPES.DELIVERY
    || deliveryType === DELIVERY_TYPES.RAINAU
    || deliveryType === DELIVERY_TYPES.OWN
  )
}

export function isRainauDeliveryType(deliveryType) {
  return deliveryType === DELIVERY_TYPES.DELIVERY || deliveryType === DELIVERY_TYPES.RAINAU
}

export function getDeliveryProviderLabel(deliveryType) {
  if (deliveryType === DELIVERY_TYPES.OWN) {
    return 'Delivery propio (Lima)'
  }

  if (isRainauDeliveryType(deliveryType)) {
    return 'Delivery Rainau (Lima)'
  }

  return 'Delivery en Lima'
}
