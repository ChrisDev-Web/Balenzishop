import { apiGet } from './client'

export async function fetchLiveMinoristaPricingStatus() {
  return apiGet('catalog/live_minorista_pricing')
}
