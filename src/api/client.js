import axios from 'axios'
import { API_BASE_URL } from './config'

export function parseApiError(data, fallback = 'Error en la solicitud') {
  if (!data) return fallback
  if (data.errors) {
    const messages = Object.values(data.errors).flat()
    if (messages.length) return messages.join(', ')
  }
  return data.message || fallback
}

function serializeParams(params) {
  const parts = []

  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === '') return

    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry == null || entry === '') return
        parts.push(`${encodeURIComponent(`${key}[]`)}=${encodeURIComponent(String(entry))}`)
      })
      return
    }

    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
  })

  return parts.join('&')
}

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    Accept: 'application/json',
  },
  paramsSerializer: {
    serialize: serializeParams,
  },
})

http.interceptors.response.use(
  (response) => {
    if (response.data?.success === false) {
      return Promise.reject(new Error(parseApiError(response.data)))
    }

    return response
  },
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error)
    }

    const data = error.response?.data
    const message = parseApiError(data, error.message || 'Error en la solicitud')
    return Promise.reject(new Error(message))
  },
)

export async function apiGet(path, params = {}, token = null, config = {}) {
  const headers = { ...config.headers }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await http.get(path, {
    ...config,
    params,
    headers,
  })

  return response.data
}

export async function apiPost(path, body = {}, token = null, config = {}) {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...config.headers,
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await http.post(path, body, {
    ...config,
    headers,
  })

  return response.data
}

export async function apiPut(path, body = {}, token = null, config = {}) {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...config.headers,
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await http.put(path, body, {
    ...config,
    headers,
  })

  return response.data
}

export default http
