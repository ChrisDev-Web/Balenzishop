import {
  PAYMENT_METHOD_TYPE_POS,
  PAYMENT_METHOD_TYPE_TRANSFER,
  PAYMENT_METHOD_TYPE_WALLET,
  resolvePaymentMethodType,
} from './paymentMethods'

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

export function filterCheckoutPaymentMethods(paymentMethods, { rainauDelivery = false } = {}) {
  if (rainauDelivery) {
    return paymentMethods
  }

  return paymentMethods.filter((method) => !isPosPaymentMethod(method))
}
