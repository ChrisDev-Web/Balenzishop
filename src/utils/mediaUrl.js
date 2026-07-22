const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1/'

export function getMediaOrigin() {
  try {
    return new URL(API_BASE).origin
  } catch {
    return 'http://localhost:8000'
  }
}

/**
 * En dev, sirve /storage vía proxy de Vite (mismo origen, menos latencia).
 */
export function normalizeMediaUrl(url) {
  if (!url || typeof url !== 'string') {
    return url
  }

  if (url.startsWith('/')) {
    return url
  }

  try {
    const parsed = new URL(url)

    if (parsed.pathname.startsWith('/storage/')) {
      if (import.meta.env.DEV) {
        return parsed.pathname
      }

      return url
    }
  } catch {
    return url
  }

  return url
}

export function ensureResourceHint(rel, href, crossOrigin = false) {
  if (!href || typeof document === 'undefined') {
    return
  }

  const selector = `link[rel="${rel}"][href="${href}"]`
  if (document.head.querySelector(selector)) {
    return
  }

  const link = document.createElement('link')
  link.rel = rel
  link.href = href

  if (crossOrigin) {
    link.crossOrigin = 'anonymous'
  }

  document.head.appendChild(link)
}

export function preloadHeroImage(url) {
  const normalized = normalizeMediaUrl(url)
  if (!normalized) {
    return
  }

  ensureResourceHint('preload', normalized, true)
}

export function preconnectMediaOrigin() {
  if (import.meta.env.DEV) {
    return
  }

  ensureResourceHint('preconnect', getMediaOrigin(), true)
  ensureResourceHint('dns-prefetch', getMediaOrigin())
}
