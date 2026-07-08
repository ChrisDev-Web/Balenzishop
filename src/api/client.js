import { API_BASE_URL } from './config'

export function parseApiError(data, fallback = 'Error en la solicitud') {
  if (!data) return fallback
  if (data.errors) {
    const messages = Object.values(data.errors).flat()
    if (messages.length) return messages.join(', ')
  }
  return data.message || fallback
}

async function parseResponse(res) {
  const data = await res.json().catch(() => ({}))

  if (!res.ok || data.success === false) {
    throw new Error(parseApiError(data))
  }

  return data
}

function buildUrl(path, params = {}) {
  const url = new URL(path, API_BASE_URL)
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') url.searchParams.set(key, String(value))
  })
  return url
}

export async function apiGet(path, params = {}, token = null) {
  const headers = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(buildUrl(path, params).toString(), { headers })
  return parseResponse(res)
}

export async function apiPost(path, body = {}, token = null) {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(buildUrl(path).toString(), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  return parseResponse(res)
}

export async function apiPut(path, body = {}, token = null) {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(buildUrl(path).toString(), {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  })
  return parseResponse(res)
}
