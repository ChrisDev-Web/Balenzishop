import { apiGet } from './client'

export async function fetchRainauAvailableDeliveryDates({ bustCache = false } = {}) {
  const params = bustCache ? { _: Date.now() } : {}

  return apiGet('rainau_delivery/available_dates', params)
}