import { getDeliveryFeeForZone, getCoverageInfo } from '../data/rainauCoverage'

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

  const zone = address.coverageZone
    || getCoverageInfo(address.district, address.geoLat, address.geoLng).zone
  const fee = getDeliveryFeeForZone(zone)

  if (zone === 'green') {
    return { fee, label: 'Delivery Lima — zona regular (L–S)', zone, mode: DELIVERY_MODES.DELIVERY }
  }
  if (zone === 'green_dark') {
    return { fee, label: 'Delivery Lima — zona extendida (L–S)', zone, mode: DELIVERY_MODES.DELIVERY }
  }
  if (zone === 'blue') {
    return { fee, label: 'Delivery Lima — zona programada (M–J–S)', zone, mode: DELIVERY_MODES.DELIVERY }
  }
  if (zone === 'red') {
    return {
      fee: 0,
      label: 'Recojo en Shalon (con cargo)',
      zone,
      mode: DELIVERY_MODES.SHALON_PAID,
    }
  }

  return { fee: 0, label: 'Recojo en Shalon', zone: zone || 'unknown', mode: DELIVERY_MODES.SHALON_FREE }
}

export function computeOrderTotal(subtotal, discount, deliveryFee, deliveryMode) {
  const productsTotal = Math.max(0, subtotal - discount)
  if (deliveryMode === DELIVERY_MODES.DELIVERY && deliveryFee > 0) {
    return productsTotal + deliveryFee
  }
  return productsTotal
}
