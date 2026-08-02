import http from '../api/client'

export const PAYMENT_METHOD_TYPE_WALLET = 'digital_wallet'
export const PAYMENT_METHOD_TYPE_TRANSFER = 'bank_transfer'
export const PAYMENT_METHOD_TYPE_POS = 'pos'

export function resolvePaymentMethodType(method) {
  if (method?.type) {
    return method.type
  }

  const name = (method?.name ?? '').toLowerCase()

  if (name.includes('yape') || name.includes('plin')) {
    return PAYMENT_METHOD_TYPE_WALLET
  }

  if (name.includes('transfer')) {
    return PAYMENT_METHOD_TYPE_TRANSFER
  }

  return null
}

export function findPaymentMethodById(paymentMethods, id) {
  if (!id) return null

  return paymentMethods.find(
    (method) => String(method.id ?? method.id_payment_method) === String(id),
  ) ?? null
}

function resolveFilenameExtension(contentType, fallback = 'jpg') {
  if (contentType.includes('png')) return 'png'
  if (contentType.includes('webp')) return 'webp'
  if (contentType.includes('gif')) return 'gif'
  return fallback
}

export async function downloadPaymentMethodQr(paymentMethodId, filename = 'codigo-qr') {
  const response = await http.get(`payment_methods/${paymentMethodId}/photo/download`, {
    responseType: 'blob',
    headers: {
      Accept: 'application/octet-stream',
    },
  })

  const blob = response.data
  const contentType = response.headers['content-type'] || blob.type || 'image/jpeg'
  const extension = resolveFilenameExtension(contentType)
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = `${filename}.${extension}`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}
