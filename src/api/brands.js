import { apiGet } from './client'
import { buildRequestKey, dedupeRequest } from './requestDedupe'

export async function fetchActiveBrands({ page = 1, pageSize = 100 } = {}) {
  const params = { page, page_size: pageSize }
  const cacheKey = buildRequestKey('GET', 'brands/list_active_public', params)
  const response = await dedupeRequest(cacheKey, () => apiGet('brands/list_active_public', params))

  return response.data.items.map((brand) => ({
    value: String(brand.id_brand),
    label: brand.name,
    ...brand,
  }))
}
