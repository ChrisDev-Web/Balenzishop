export const DEFAULT_NAVBAR_LOGO = '/Logo/Balenzi - Logo.png'
export const DEFAULT_TAB_LOGO = '/Logo/Logo Blanco - Balenzi.png'
export const DEFAULT_COMPANY_NAME = 'BalenziShop'
export const DEFAULT_WHATSAPP_DIGITS = '51924341477'

export function normalizeWhatsAppDigits(value) {
  if (!value) return null

  const digits = String(value).replace(/\D/g, '')
  return digits || null
}

export function formatWhatsAppDisplay(value) {
  const digits = normalizeWhatsAppDigits(value)
  if (!digits) return null

  const local = digits.startsWith('51') && digits.length >= 11
    ? digits.slice(2)
    : digits

  if (local.length === 9) {
    return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`
  }

  return local
}

export function buildWhatsAppUrl(value, message = '') {
  const digits = normalizeWhatsAppDigits(value) ?? DEFAULT_WHATSAPP_DIGITS
  const base = `https://api.whatsapp.com/send?phone=${digits}`

  if (!message) {
    return base
  }

  return `${base}&text=${encodeURIComponent(message)}`
}

export function extractSocialHandle(url, fallback = '') {
  if (!url) return fallback

  try {
    const parsed = new URL(url)
    const segments = parsed.pathname.split('/').filter(Boolean)
    const last = segments.at(-1)

    if (!last) return fallback

    return last.startsWith('@') ? last : `@${last.replace(/^@/, '')}`
  } catch {
    return fallback
  }
}

export function applyCompanyBranding(company) {
  const faviconUrl = company?.tab_photo || DEFAULT_TAB_LOGO
  const title = company?.name || DEFAULT_COMPANY_NAME

  document.title = title

  let faviconLink = document.querySelector("link[rel='icon']")

  if (!faviconLink) {
    faviconLink = document.createElement('link')
    faviconLink.rel = 'icon'
    document.head.appendChild(faviconLink)
  }

  faviconLink.type = faviconUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/png'
  faviconLink.href = faviconUrl
}
