export const SHIPPING_NOTICE_INTERVAL_MS = 2 * 60 * 60 * 1000
export const SHIPPING_NOTICE_DISPLAY_MS = 15000
export const SHIPPING_NOTICE_LAST_SHOWN_KEY = 'balenzishop_shipping_notice_last_shown'
export const SHIPPING_CUTOFF_HOUR = 14
export const SHIPPING_CUTOFF_MINUTE = 30

const LIMA_TIMEZONE = 'America/Lima'

export function getLimaTimeParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: LIMA_TIMEZONE,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(date)

  return {
    hour: Number(parts.find((part) => part.type === 'hour')?.value ?? 0),
    minute: Number(parts.find((part) => part.type === 'minute')?.value ?? 0),
  }
}

export function isAfterShippingCutoff(date = new Date()) {
  const { hour, minute } = getLimaTimeParts(date)

  if (hour > SHIPPING_CUTOFF_HOUR) return true
  if (hour < SHIPPING_CUTOFF_HOUR) return false

  return minute > SHIPPING_CUTOFF_MINUTE
}

export function getShippingNoticeContent(date = new Date()) {
  if (isAfterShippingCutoff(date)) {
    return getShippingNoticeContentAfterCutoff()
  }

  return getShippingNoticeContentBeforeCutoff()
}

export function getShippingNoticeContentBeforeCutoff() {
  return {
    title: 'Horario de despacho',
    message:
      'Estimado cliente: todo pedido realizado como máximo hasta las 2:30 p. m. de hoy será enviado el mismo día. Pasada esa hora, su pedido será enviado el día de mañana.',
  }
}

export function getShippingNoticeContentAfterCutoff() {
  return {
    title: 'Horario de despacho',
    message:
      'Estimado cliente: todo pedido realizado a partir de las 2:30 p. m. será enviado el día de mañana.',
  }
}

export function isShippingNoticePreviewMode(search = '') {
  if (import.meta.env.PROD) {
    return false
  }

  if (typeof window !== 'undefined') {
    return new URLSearchParams(window.location.search).get('previewAvisosDespacho') === '1'
  }

  return search.includes('previewAvisosDespacho=1')
}

export function getShippingNoticePreviewSequence() {
  return [getShippingNoticeContentBeforeCutoff(), getShippingNoticeContentAfterCutoff()]
}

export function shouldShowShippingNotice(now = Date.now()) {
  const lastShown = Number(localStorage.getItem(SHIPPING_NOTICE_LAST_SHOWN_KEY) || 0)

  if (!lastShown) {
    return true
  }

  return now - lastShown >= SHIPPING_NOTICE_INTERVAL_MS
}

export function markShippingNoticeShown(at = Date.now()) {
  localStorage.setItem(SHIPPING_NOTICE_LAST_SHOWN_KEY, String(at))
}
