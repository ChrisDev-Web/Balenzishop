const STORAGE_KEY = 'balenzishop_pending_checkout_draft'
const LEGAL_VIEW_KEY = 'balenzishop_checkout_legal_view'
const LEGAL_VIEW_MAX_AGE_MS = 10 * 60 * 1000

export function savePendingCheckoutDraft({ orderId, clientId }) {
  if (!orderId || !clientId) return

  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      orderId: Number(orderId),
      clientId: String(clientId),
      interrupted: false,
      savedAt: Date.now(),
    }),
  )
}

export function markPendingCheckoutDraftInterrupted() {
  const current = readPendingCheckoutDraft()
  if (!current) return

  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...current,
      interrupted: true,
      savedAt: Date.now(),
    }),
  )
}

export function readPendingCheckoutDraft(clientId = null) {
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    if (!parsed?.orderId) return null

    if (clientId !== null && String(parsed.clientId) !== String(clientId)) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function clearPendingCheckoutDraft() {
  sessionStorage.removeItem(STORAGE_KEY)
}

export function markCheckoutLegalView() {
  try {
    localStorage.setItem(LEGAL_VIEW_KEY, String(Date.now()))
  } catch {
    // ignore storage failures
  }
}

export function isCheckoutLegalViewActive() {
  try {
    const raw = localStorage.getItem(LEGAL_VIEW_KEY)
    if (!raw) return false

    const age = Date.now() - Number(raw)
    if (!Number.isFinite(age) || age > LEGAL_VIEW_MAX_AGE_MS) {
      localStorage.removeItem(LEGAL_VIEW_KEY)
      return false
    }

    return true
  } catch {
    return false
  }
}

export function clearCheckoutLegalView() {
  try {
    localStorage.removeItem(LEGAL_VIEW_KEY)
  } catch {
    // ignore storage failures
  }
}
