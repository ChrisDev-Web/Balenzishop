import {
  PAYMENT_METHOD_TYPE_POS,
  isCashPaymentMethod,
  resolvePaymentMethodType,
} from './paymentMethods'
import { DELIVERY_MODES } from './deliveryFee'
import { isRainauDeliveryType } from './deliveryTypes'

export const POS_SURCHARGE_RATE = 0.05

export function isPosPaymentMethod(method) {
  return resolvePaymentMethodType(method) === PAYMENT_METHOD_TYPE_POS
}

export function calculatePosSurcharge(baseTotal) {
  const amount = Math.max(0, Number(baseTotal) || 0)
  return Math.round(amount * POS_SURCHARGE_RATE * 100) / 100
}

export function applyPosSurcharge(baseTotal) {
  const surcharge = calculatePosSurcharge(baseTotal)
  return {
    surcharge,
    total: Math.round((Math.max(0, Number(baseTotal) || 0) + surcharge) * 100) / 100,
  }
}

export function allowsCashBalancePayment(deliveryMode) {
  return deliveryMode === DELIVERY_MODES.DELIVERY
    || deliveryMode === DELIVERY_MODES.CUSTOMER_DELIVERY
}

export function allowsPosBalancePayment(deliveryMode, deliveryType) {
  return deliveryMode === DELIVERY_MODES.DELIVERY && isRainauDeliveryType(deliveryType)
}

export function filterCheckoutPaymentMethods(
  paymentMethods,
  { rainauDelivery = false, allowCash = false } = {},
) {
  let methods = paymentMethods

  if (!rainauDelivery) {
    methods = methods.filter((method) => !isPosPaymentMethod(method))
  }

  if (!allowCash) {
    methods = methods.filter((method) => !isCashPaymentMethod(method))
  }

  return methods
}

/** Métodos para el pago inicial (reserva o pago completo): nunca incluye tarjeta POS ni efectivo. */
export function filterInitialPaymentMethods(paymentMethods) {
  return paymentMethods.filter(
    (method) => !isPosPaymentMethod(method) && !isCashPaymentMethod(method),
  )
}
