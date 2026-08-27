export const CART_STORAGE_KEY = 'balenzi-carts'
export const LEGACY_CART_STORAGE_KEY = 'balenzi-cart'

export function hasPersistedCartStorage() {
  if (typeof window === 'undefined') return false

  try {
    return Boolean(localStorage.getItem(CART_STORAGE_KEY))
  } catch {
    return false
  }
}

export function readLegacyCartItems() {
  if (typeof window === 'undefined') return null

  try {
    const legacyRaw = localStorage.getItem(LEGACY_CART_STORAGE_KEY)
    if (!legacyRaw) return null

    const legacyState = JSON.parse(legacyRaw)?.state
    if (!Array.isArray(legacyState?.items) || legacyState.items.length === 0) {
      return null
    }

    return legacyState.items
  } catch {
    return null
  }
}

export function clearLegacyCartStorage() {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(LEGACY_CART_STORAGE_KEY)
  } catch {
    // Ignore storage access errors.
  }
}

/**
 * One-time legacy import: only when the new storage key does not exist yet.
 * Always removes the stale legacy key so empty carts stay empty after refresh.
 */
export function applyLegacyCartMigration(state) {
  if (!state || typeof state !== 'object') {
    clearLegacyCartStorage()
    return state
  }

  const hasNewCartData =
    (state.minoristaItems?.length ?? 0) > 0 || (state.mayoristaItems?.length ?? 0) > 0

  if (!hasPersistedCartStorage() && !hasNewCartData) {
    const legacyItems = readLegacyCartItems()
    if (legacyItems) {
      state.minoristaItems = legacyItems
    }
  }

  clearLegacyCartStorage()
  return state
}

export function stripLegacyCartFields(state) {
  if (!state || typeof state !== 'object' || !('items' in state)) {
    return state
  }

  const { items: _legacyItems, ...rest } = state
  return rest
}
