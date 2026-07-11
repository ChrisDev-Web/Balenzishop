import { apiGet } from './client'
import { buildRequestKey, dedupeRequest } from './requestDedupe'
import { buildCatalogApiParams } from '../utils/catalogApiParams'
import { mapCatalogProduct, mapCatalogProductDetail } from '../utils/catalogProductMapper'

export async function fetchCatalogProducts({ filters = {}, page = 1, pageSize = 20, token = null, wholesale = false, signal = null } = {}) {
  const params = buildCatalogApiParams(filters, page, pageSize)
  const path = wholesale ? 'products/list_active_wholesale' : 'products/list_active_public'
  const cacheKey = buildRequestKey('GET', path, params)

  const response = await dedupeRequest(cacheKey, () => apiGet(path, params, token, { signal }))

  return {
    items: (response.data.items ?? []).map(mapCatalogProduct),
    meta: response.data.meta ?? null,
  }
}

export async function fetchCatalogProductDetail(id, { token = null, wholesale = false, signal = null } = {}) {
  const path = wholesale
    ? `products/detail_wholesale/${id}`
    : `products/detail_public/${id}`
  const cacheKey = buildRequestKey('GET', path)

  const response = await dedupeRequest(cacheKey, () => apiGet(path, {}, token, { signal }))

  return mapCatalogProductDetail(response.data)
}
