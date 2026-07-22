import axios from 'axios'
import { API_BASE_URL } from './config'

export function parseApiFieldErrors(data) {
  if (!data?.errors || typeof data.errors !== 'object') return {}

  return Object.fromEntries(
    Object.entries(data.errors).map(([key, messages]) => {
      const value = Array.isArray(messages) ? messages[0] : messages
      return [key, value ? String(value) : '']
    }).filter(([, message]) => message),
  )
}

export function parseApiError(data, fallback = 'Error en la solicitud') {
  if (!data) return fallback
  if (data.errors) {
    const messages = Object.values(data.errors).flat()
    if (messages.length) return messages.join(', ')
  }
  return data.message || fallback
}

function createRequestError(data, fallback) {
  const message = parseApiError(data, fallback)
  const error = new Error(message)
  error.fieldErrors = parseApiFieldErrors(data)
  return error
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
      return Promise.reject(createRequestError(response.data))
    }

    return response
  },
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error)
    }

    const data = error.response?.data
    return Promise.reject(
      createRequestError(data, error.message || 'Error en la solicitud'),
    )
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

export async function apiPostForm(path, formData, token = null, config = {}) {
  const headers = {
    Accept: 'application/json',
    ...config.headers,
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await http.post(path, formData, {
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

export async function apiDelete(path, token = null, config = {}) {
  const headers = { ...config.headers }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await http.delete(path, {
    ...config,
    headers,
  })

  return response.data
}

export default http
