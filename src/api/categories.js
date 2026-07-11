import { apiGet } from './client'
import { buildRequestKey, dedupeRequest } from './requestDedupe'

export async function fetchActiveCategories({ page = 1, pageSize = 100 } = {}) {
  const params = { page, page_size: pageSize }
  const cacheKey = buildRequestKey('GET', 'categories/list_active_public', params)
  const response = await dedupeRequest(cacheKey, () => apiGet('categories/list_active_public', params))

  return response.data.items.map((category) => ({
    value: String(category.id_category),
    label: category.name,
    ...category,
  }))
}
