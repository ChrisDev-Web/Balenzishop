import http, { apiGet, parseApiError } from './client'

async function parseBlobErrorMessage(error) {
  const data = error?.response?.data

  if (data instanceof Blob && data.type.includes('json')) {
    try {
      const text = await data.text()
      const parsed = JSON.parse(text)
      return parseApiError(parsed, error.message || 'No se pudo cargar la boleta.')
    } catch {
      return error.message || 'No se pudo cargar la boleta.'
    }
  }

  return parseApiError(data, error.message || 'No se pudo cargar la boleta.')
}

export async function fetchGuestOrderTrackingDetail(token) {
  return apiGet(`guest_order_tracking/${encodeURIComponent(token)}`)
}

export async function fetchGuestOrderTrackingShalom(token) {
  return apiGet(`guest_order_tracking/${encodeURIComponent(token)}/shalom_tracking`)
}

export async function fetchGuestOrderTrackingReceiptBlob(token, { download = false } = {}) {
  try {
    const response = await http.get(
      `guest_order_tracking/${encodeURIComponent(token)}/shalom_receipt`,
      {
        responseType: 'blob',
        params: download ? { download: 1 } : undefined,
        headers: {
          Accept: 'application/pdf,application/octet-stream,image/*,*/*',
        },
      },
    )

    const blob = response.data
    if (!(blob instanceof Blob)) {
      throw new Error('No se pudo cargar la boleta.')
    }

    return blob
  } catch (error) {
    throw new Error(await parseBlobErrorMessage(error))
  }
}
