import { useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import {
  CART_MODES,
  isWholesaleCartMode,
  resolveCheckoutChannelFromSearch,
  resolvePricingRoleForMode,
  resolveShoppingModeFromPath,
} from '../utils/shoppingMode'
import { isMayorista } from '../utils/pricing'

export function useShoppingMode() {
  const { pathname, search } = useLocation()
  const searchParams = new URLSearchParams(search)
  const mode = resolveShoppingModeFromPath(pathname)

  return {
    mode,
    isWholesaleMode: isWholesaleCartMode(mode),
    pricingRole: resolvePricingRoleForMode(mode),
  }
}

export function useCheckoutCartMode() {
  const { search } = useLocation()
  const searchParams = new URLSearchParams(search)

  return resolveCheckoutChannelFromSearch(searchParams)
}

export function useCanUseDualCarts() {
  const user = useAuthStore((state) => state.user)
  return isMayorista(user?.role)
}

export { CART_MODES }
