import { apiGet, apiPost, apiPut } from './client'

export async function registerClient(payload) {
  return apiPost('clients/register', payload)
}

export async function loginClient(email, password) {
  return apiPost('clients/login', { email, password })
}

export async function fetchCurrentClient(token) {
  return apiGet('clients/me', {}, token)
}

export async function updateClientProfile(payload, token) {
  return apiPut('clients/me/profile', payload, token)
}

export async function logoutClient(refreshToken, token) {
  return apiPost('clients/logout', { refresh_token: refreshToken }, token)
}
