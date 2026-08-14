import { getDeliveryProviderLabel, isHomeDeliveryType, isRainauDeliveryType } from './deliveryTypes'

export const DELIVERY_MODES = {
  DELIVERY: 'delivery',
  CUSTOMER_DELIVERY: 'customer_delivery',
  SHALON_PAID: 'shalon_paid',
  SHALON_FREE: 'shalon_free',
}

export { isHomeDeliveryType, isRainauDeliveryType }

export function getDeliveryFeeForAddress(address) {
  if (!address) {
    return { fee: 0, label: 'Sin dirección', zone: null, mode: DELIVERY_MODES.SHALON_FREE }
  }

  if (address.deliveryScope === 'provincia') {
    return { fee: 0, label: 'Recojo en Shalon (provincia)', zone: null, mode: DELIVERY_MODES.SHALON_FREE }
  }

  if (address.deliveryScope === 'lima') {
    if (address.deliveryType === 'delivery_own') {
      return {
        fee: 0,
        label: getDeliveryProviderLabel(address.deliveryType),
        zone: null,
        mode: DELIVERY_MODES.CUSTOMER_DELIVERY,
      }
    }

    if (isRainauDeliveryType(address.deliveryType)) {
      return {
        fee: Number(address.deliveryFee || 0),
        label: getDeliveryProviderLabel(address.deliveryType),
        zone: address.coverageZone || null,
        mode: DELIVERY_MODES.DELIVERY,
      }
    }

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

export function formatShippingDisplay({ deliveryFee }) {
  if (deliveryFee > 0) {
    return `S/ ${deliveryFee.toFixed(2)}`
  }

  return 'Con cargo'
}

export function getShippingChargeHintMessage(deliveryMode) {
  if (deliveryMode === DELIVERY_MODES.CUSTOMER_DELIVERY) {
    return 'El envío lo paga usted al repartidor.'
  }

  if (deliveryMode === DELIVERY_MODES.DELIVERY) {
    return 'El costo del envío se define según su zona.'
  }

  return 'El costo lo define Shalom al recoger su pedido.'
}

export function isShippingChargeHintApplicable({ deliveryFee } = {}) {
  return formatShippingDisplay({ deliveryFee }) === 'Con cargo'
}
