import { API_BASE_URL } from './config'

export async function apiGet(path, params = {}) {
  const url = new URL(path, API_BASE_URL)

  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') url.searchParams.set(key, String(value))
  })

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  })

  const data = await res.json()

  if (!res.ok || data.success === false) {
    const detail = data.errors ? Object.values(data.errors).flat().join(', ') : null
    throw new Error(detail || data.message || 'Error en la solicitud')
  }

  return data
}
