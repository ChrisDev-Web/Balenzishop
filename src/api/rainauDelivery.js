import { apiGet } from './client'

export async function fetchRainauAvailableDeliveryDates({ bustCache = false, deliveryMode = 'delivery' } = {}) {
  const params = { delivery_mode: deliveryMode }
  if (bustCache) {
    params._ = Date.now()
  }

  return apiGet('rainau_delivery/available_dates', params)
}