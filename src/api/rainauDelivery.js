import { apiGet } from './client'

export async function fetchRainauAvailableDeliveryDates({
  bustCache = false,
  deliveryMode = 'delivery',
  geoLat = null,
  geoLng = null,
} = {}) {
  const params = { delivery_mode: deliveryMode }
  if (geoLat != null && geoLng != null && Number.isFinite(Number(geoLat)) && Number.isFinite(Number(geoLng))) {
    params.geo_lat = Number(geoLat)
    params.geo_lng = Number(geoLng)
  }
  if (bustCache) {
    params._ = Date.now()
  }

  return apiGet('rainau_delivery/available_dates', params)
}

export async function fetchShalomAvailableDeliveryDates({ bustCache = false } = {}) {
  const params = {}
  if (bustCache) {
    params._ = Date.now()
  }

  return apiGet('shalom_delivery/available_dates', params)
}