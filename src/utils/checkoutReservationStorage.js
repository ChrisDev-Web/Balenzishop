const STORAGE_KEY = 'balenzishop_pending_checkout_draft'

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
