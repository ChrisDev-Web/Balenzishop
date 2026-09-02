import { apiGet, apiPostForm } from './client'

function buildCartItems(items) {
  return items.map((item) => {
    const payload = {
      id_product: Number(item.id),
      quantity: Number(item.quantity),
      unit_price: Number(item.price),
    }

    if (item.idProductDecant) {
      payload.id_product_decant = Number(item.idProductDecant)
    }

    return payload
  })
}

export function buildGuestReserveFormData({ items, customer, delivery, discountCode }) {
  const formData = new FormData()

  formData.append(
    'metadata',
    JSON.stringify({
      items: buildCartItems(items),
      customer,
      delivery,
      discount_code: discountCode || null,
      sale_client_type: 'minorista',
    }),
  )

  return formData
}

export function buildGuestSubmitFormData({
  guestToken,
  paymentMode,
  payments,
  paymentProofs,
  delivery,
  balancePaymentMethodId,
  cashPaidWith,
}) {
  const formData = new FormData()

  const metadata = {
    guest_token: guestToken,
    payment_mode: paymentMode,
    payments: payments.map((payment) => ({
      id_payment_method: Number(payment.id_payment_method),
      amount: Number(payment.amount),
    })),
  }

  if (balancePaymentMethodId) {
    metadata.balance_payment_method_id = Number(balancePaymentMethodId)
  }

  if (cashPaidWith != null && cashPaidWith !== '') {
    metadata.cash_paid_with = Number(cashPaidWith)
  }

  if (delivery) {
    metadata.delivery = delivery
  }

  formData.append('metadata', JSON.stringify(metadata))

  payments.forEach((_, index) => {
    const files = paymentProofs[index] || []
    files.forEach((file) => {
      if (file instanceof File) {
        formData.append(`payment_proofs[${index}][]`, file)
      }
    })
  })

  return formData
}

export async function reserveGuestCheckout(payload) {
  const formData = buildGuestReserveFormData(payload)
  return apiPostForm('guest_checkout/reserve', formData)
}

export async function submitGuestCheckout(orderId, payload) {
  const formData = buildGuestSubmitFormData(payload)
  return apiPostForm(`guest_checkout/submit/${orderId}`, formData)
}

export async function cancelGuestCheckoutReservation(orderId, guestToken) {
  const formData = new FormData()
  formData.append('guest_token', guestToken)
  return apiPostForm(`guest_checkout/cancel_checkout/${orderId}`, formData)
}

export async function cancelGuestOrder(orderId, guestToken) {
  const formData = new FormData()
  formData.append('guest_token', guestToken)
  return apiPostForm(`guest_checkout/cancel/${orderId}`, formData)
}

export async function fetchGuestOrderDetail(orderId, guestToken) {
  return apiGet(`guest_checkout/detail/${orderId}`, { guest_token: guestToken })
}
