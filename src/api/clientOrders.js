import http, { apiGet, apiPost, apiPostForm } from './client'

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

export function buildReserveCheckoutFormData({ items, delivery, discountCode, beneficiaryClientId }) {
  const formData = new FormData()

  const metadata = {
    items: buildCartItems(items),
    delivery,
    discount_code: discountCode || null,
  }

  if (beneficiaryClientId) {
    metadata.id_beneficiary_client = Number(beneficiaryClientId)
  }

  formData.append('metadata', JSON.stringify(metadata))

  return formData
}

export async function reserveCheckoutOrder(payload, token) {
  const formData = buildReserveCheckoutFormData(payload)
  return apiPostForm('client_orders/reserve_checkout', formData, token)
}

export function buildSubmitCheckoutFormData({ orderId, paymentMode, payments, paymentProofs, delivery, balancePaymentMethodId }) {
  const formData = new FormData()

  const metadata = {
    payment_mode: paymentMode,
    payments: payments.map((payment) => ({
      id_payment_method: Number(payment.id_payment_method),
      amount: Number(payment.amount),
    })),
  }

  if (balancePaymentMethodId) {
    metadata.balance_payment_method_id = Number(balancePaymentMethodId)
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

export async function submitCheckoutOrder(orderId, payload, token) {
  const formData = buildSubmitCheckoutFormData({ orderId, ...payload })
  return apiPostForm(`client_orders/submit_checkout/${orderId}`, formData, token)
}

export async function cancelCheckoutReservation(orderId, token) {
  return apiPostForm(`client_orders/cancel_checkout/${orderId}`, new FormData(), token)
}

export async function fetchCheckoutDraft(token) {
  return apiGet('client_orders/checkout_draft', {}, token)
}

export async function fetchMyClientOrders(token, params = {}) {
  return apiGet('client_orders/list_mine', params, token)
}

export async function fetchClientOrderDetail(id, token) {
  return apiGet(`client_orders/detail/${id}`, {}, token)
}

export async function cancelClientOrder(id, token) {
  return apiPost(`client_orders/cancel/${id}`, {}, token)
}

export async function fetchShalomTracking(orderId, token) {
  return apiGet(`client_orders/shalom_tracking/${orderId}`, {}, token)
}

export async function fetchShalomReceiptBlob(orderId, token, { download = false } = {}) {
  const response = await http.get(`client_orders/shalom_receipt/${orderId}`, {
    responseType: 'blob',
    params: download ? { download: 1 } : undefined,
    headers: {
      Accept: 'application/pdf,application/octet-stream,image/*,*/*',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  const blob = response.data
  if (!(blob instanceof Blob)) {
    throw new Error('No se pudo cargar la boleta.')
  }

  return blob
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
