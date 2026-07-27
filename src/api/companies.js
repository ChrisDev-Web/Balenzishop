import { apiGet } from './client'
import { dedupeRequest, buildRequestKey } from './requestDedupe'

export async function fetchActiveCompanyPublic() {
  const cacheKey = buildRequestKey('GET', 'companies/active_public')
  const response = await dedupeRequest(cacheKey, () => apiGet('companies/active_public'))
  return response.data ?? null
}
