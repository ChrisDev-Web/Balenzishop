import { CART_STORAGE_KEY, LEGACY_CART_STORAGE_KEY } from './cartStorage.js'

export const USER_SESSION_KEYS = {
  auth: 'balenzi-auth',
  cart: LEGACY_CART_STORAGE_KEY,
  carts: CART_STORAGE_KEY,
  ui: 'balenzi-ui',
  deliveryZone: 'balenzishop-delivery-zone',
}

export function clearUserSessionsCache() {
  localStorage.removeItem(USER_SESSION_KEYS.auth)
  localStorage.removeItem(USER_SESSION_KEYS.cart)
  localStorage.removeItem(USER_SESSION_KEYS.carts)
  sessionStorage.removeItem(USER_SESSION_KEYS.ui)
  sessionStorage.removeItem(USER_SESSION_KEYS.deliveryZone)
}
