export const BALENZI_DELIVERY_LABEL = 'Delivery Balenzi'

export const OWN_DELIVERY_PICKUP_POINT_URL = "https://www.google.com/maps/place/11%C2%B059'41.2%22S+77%C2%B006'21.3%22W/@-11.994771,-77.105908,17z/data=!3m1!4b1!4m4!3m3!8m2!3d-11.994771!4d-77.105908!5m1!1e1!18m1!1e1?entry=ttu&g_ep=EgoyMDI2MDkxNi4wIKXMDSoASAFQAw%3D%3D"

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
