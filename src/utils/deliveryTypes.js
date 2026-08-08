export const BALENZI_DELIVERY_LABEL = 'Delivery Balenzi'

export const OWN_DELIVERY_PICKUP_POINT_URL = 'https://maps.app.goo.gl/ZBRMAf39YREJ6cMJA'

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

export function isOwnDeliveryType(deliveryType) {
  return deliveryType === DELIVERY_TYPES.OWN
}

export function getOwnDeliveryPickupFormValues() {
  return {
    fullAddress: OWN_DELIVERY_PICKUP_POINT_URL,
    googleMapsLink: OWN_DELIVERY_PICKUP_POINT_URL,
    geoLat: null,
    geoLng: null,
  }
}

export function getDeliveryProviderLabel(deliveryType) {
  if (deliveryType === DELIVERY_TYPES.OWN) {
    return 'Delivery propio (Lima)'
  }

  if (isRainauDeliveryType(deliveryType)) {
    return `${BALENZI_DELIVERY_LABEL} (Lima)`
  }

  return 'Delivery en Lima'
}
