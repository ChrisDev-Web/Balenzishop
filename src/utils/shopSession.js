const SESSION_STORAGE_KEY = 'bz_presence_session'

export function getShopSessionId() {
  try {
    let id = window.localStorage.getItem(SESSION_STORAGE_KEY)
    if (!id) {
      id = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
      window.localStorage.setItem(SESSION_STORAGE_KEY, id)
    }
    return id
  } catch {
    return null
  }
}
