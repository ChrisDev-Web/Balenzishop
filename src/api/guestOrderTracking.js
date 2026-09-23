import http, { apiGet } from './client'

export async function fetchGuestOrderTrackingDetail(token) {
  return apiGet(`guest_order_tracking/${encodeURIComponent(token)}`)
}

export async function fetchGuestOrderTrackingShalom(token) {
  return apiGet(`guest_order_tracking/${encodeURIComponent(token)}/shalom_tracking`)
}

export async function fetchGuestOrderTrackingReceiptBlob(token, { download = false } = {}) {
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
}
