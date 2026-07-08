export const USER_SESSION_KEYS = {
  auth: 'balenzi-auth',
  cart: 'balenzi-cart',
  ui: 'balenzi-ui',
  deliveryZone: 'balenzishop-delivery-zone',
}

export function clearUserSessionsCache() {
  localStorage.removeItem(USER_SESSION_KEYS.auth)
  localStorage.removeItem(USER_SESSION_KEYS.cart)
  sessionStorage.removeItem(USER_SESSION_KEYS.ui)
  sessionStorage.removeItem(USER_SESSION_KEYS.deliveryZone)
}
