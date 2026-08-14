import { apiGet, apiPost, apiPut } from './client'
import { buildRequestKey, dedupeRequest } from './requestDedupe'

export async function registerClient(payload) {
  return apiPost('clients/register', payload)
}

export async function loginClient(email, password) {
  return apiPost('clients/login', { email, password })
}

export async function fetchCurrentClient(token) {
  const cacheKey = buildRequestKey('GET', 'clients/me', { token: token ?? '' })
  return dedupeRequest(cacheKey, () => apiGet('clients/me', {}, token))
}

export async function updateClientProfile(payload, token) {
  return apiPut('clients/me/profile', payload, token)
}

export async function logoutClient(refreshToken, token) {
  return apiPost('clients/logout', { refresh_token: refreshToken }, token)
}

export async function sendClientPasswordResetCode(email) {
  return apiPost('clients/password/send-code', { email })
}

export async function verifyClientPasswordResetCode(email, code) {
  return apiPost('clients/password/verify-code', { email, code })
}

export async function resetClientPassword(payload) {
  return apiPost('clients/password/reset', payload)
}
