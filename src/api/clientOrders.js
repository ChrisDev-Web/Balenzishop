import { apiGet, apiPostForm } from './client'

function buildCartItems(items) {
  return items.map((item) => ({
    id_product: Number(item.id),
    quantity: Number(item.quantity),
    unit_price: Number(item.price),
  }))
}

export function buildCreateOrderFormData({
  paymentMode,
  items,
  payments,
  paymentProofs,
  delivery,
  discountCode,
}) {
  const formData = new FormData()

  const metadata = {
    payment_mode: paymentMode,
    items: buildCartItems(items),
    payments: payments.map((payment) => ({
      id_payment_method: Number(payment.id_payment_method),
      amount: Number(payment.amount),
    })),
    delivery,
    discount_code: discountCode || null,
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

export async function createClientOrder(payload, token) {
  const formData = buildCreateOrderFormData(payload)
  return apiPostForm('client_orders/create', formData, token)
}

export function buildReserveCheckoutFormData({ items, delivery, discountCode }) {
  const formData = new FormData()

  const metadata = {
    items: buildCartItems(items),
    delivery,
    discount_code: discountCode || null,
  }

  formData.append('metadata', JSON.stringify(metadata))

  return formData
}

export async function reserveCheckoutOrder(payload, token) {
  const formData = buildReserveCheckoutFormData(payload)
  return apiPostForm('client_orders/reserve_checkout', formData, token)
}

export function buildSubmitCheckoutFormData({ orderId, paymentMode, payments, paymentProofs }) {
  const formData = new FormData()

  const metadata = {
    payment_mode: paymentMode,
    payments: payments.map((payment) => ({
      id_payment_method: Number(payment.id_payment_method),
      amount: Number(payment.amount),
    })),
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

export async function submitCheckoutOrder(orderId, payload, token) {
  const formData = buildSubmitCheckoutFormData({ orderId, ...payload })
  return apiPostForm(`client_orders/submit_checkout/${orderId}`, formData, token)
}

export async function cancelCheckoutReservation(orderId, token) {
  return apiPostForm(`client_orders/cancel_checkout/${orderId}`, new FormData(), token)
}

export async function fetchMyClientOrders(token, params = {}) {
  return apiGet('client_orders/list_mine', params, token)
}

export async function fetchClientOrderDetail(id, token) {
  return apiGet(`client_orders/detail/${id}`, {}, token)
}

export function buildBalancePaymentFormData({ payments, paymentProofs }) {
  const formData = new FormData()

  const metadata = {
    payments: payments.map((payment) => ({
      id_payment_method: Number(payment.id_payment_method),
      amount: Number(payment.amount),
    })),
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

export async function submitBalancePayment(orderId, payload, token) {
  const formData = buildBalancePaymentFormData(payload)
  return apiPostForm(`client_orders/submit_balance_payment/${orderId}`, formData, token)
}
