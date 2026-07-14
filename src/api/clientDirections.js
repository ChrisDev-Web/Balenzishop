import { apiDelete, apiGet, apiPost, apiPut } from './client'
import { buildRequestKey, dedupeRequest } from './requestDedupe'

function dedupedGet(path, params, token) {
  const cacheKey = buildRequestKey('GET', path, { ...params, token: token ?? '' })
  return dedupeRequest(cacheKey, () => apiGet(path, params, token))
}

export async function fetchClientDirections(token) {
  return dedupedGet('client_directions/list', {}, token)
}

export async function fetchClientDirectionDetail(id, token) {
  return dedupedGet(`client_directions/detail/${id}`, {}, token)
}

export async function createClientDirection(payload, token) {
  return apiPost('client_directions/create', payload, token)
}

export async function updateClientDirection(id, payload, token) {
  return apiPut(`client_directions/edit/${id}`, payload, token)
}

export async function deleteClientDirection(id, token) {
  return apiDelete(`client_directions/delete/${id}`, token)
}

export async function listRegionsPublic({ page = 1, page_size = 50, name } = {}) {
  const params = { page, page_size }
  if (name?.trim()) params.name = name.trim()
  return dedupedGet('regions/list_active_public', params)
}

export async function listDistrictsPublic({
  page = 1,
  page_size = 50,
  name,
  id_region,
  id_province,
  id_provinces,
} = {}) {
  const params = { page, page_size }
  if (name?.trim()) params.name = name.trim()
  if (id_region) params.id_region = id_region
  if (id_province) params.id_province = id_province
  if (Array.isArray(id_provinces) && id_provinces.length > 0) {
    params.id_provinces = id_provinces
  }
  return dedupedGet('districts/list_active_public', params)
}

export async function listProvincesPublic({ page = 1, page_size = 50, name, id_region } = {}) {
  const params = { page, page_size }
  if (name?.trim()) params.name = name.trim()
  if (id_region) params.id_region = id_region
  return dedupedGet('provinces/list_active_public', params)
}

export async function listShalonsPublic({ page = 1, page_size = 50, id_district } = {}) {
  const params = { page, page_size }
  if (id_district) params.id_district = id_district
  return dedupedGet('shalons/list_active_public', params)
}
