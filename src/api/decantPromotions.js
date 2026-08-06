import { apiGet } from './client'

export async function fetchActiveDecantPromotions() {
  const response = await apiGet('decant_promotions/list_active_public')
  return response?.data ?? []
}

export async function fetchBrandSegmentMap() {
  const response = await apiGet('decant_promotions/brand_segments_public')
  return response?.data?.segments ?? {}
}
