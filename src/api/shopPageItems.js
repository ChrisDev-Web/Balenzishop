import { apiGet } from './client'
import { buildRequestKey, dedupeRequest } from './requestDedupe'

export async function fetchActiveShopPageItems(section) {
  const params = { section }
  const cacheKey = buildRequestKey('GET', 'shop_page_items/list_active_public', params)
  const response = await dedupeRequest(cacheKey, () =>
    apiGet('shop_page_items/list_active_public', params),
  )

  return Array.isArray(response.data) ? response.data : []
}
