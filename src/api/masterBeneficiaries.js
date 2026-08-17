import { apiGet, apiPost, apiPut } from './client'
import { buildRequestKey, dedupeRequest } from './requestDedupe'

function dedupedGet(path, params, token) {
  const cacheKey = buildRequestKey('GET', path, { ...params, token: token ?? '' })
  return dedupeRequest(cacheKey, () => apiGet(path, params, token))
}

export async function listMasterBeneficiaries({ search } = {}, token) {
  const params = {}
  if (search?.trim()) params.search = search.trim()
  return dedupedGet('master_beneficiaries/list', params, token)
}

export async function getMasterBeneficiaryDetail(id, token) {
  return dedupedGet(`master_beneficiaries/detail/${id}`, {}, token)
}

export async function createMasterBeneficiary(payload, token) {
  return apiPost('master_beneficiaries/create', payload, token)
}

export async function listMasterBeneficiaryDirections(beneficiaryId, token) {
  return dedupedGet(`master_beneficiaries/${beneficiaryId}/directions/list`, {}, token)
}

export async function createMasterBeneficiaryDirection(beneficiaryId, payload, token) {
  return apiPost(`master_beneficiaries/${beneficiaryId}/directions/create`, payload, token)
}

export async function updateMasterBeneficiaryDirection(beneficiaryId, directionId, payload, token) {
  return apiPut(`master_beneficiaries/${beneficiaryId}/directions/edit/${directionId}`, payload, token)
}
