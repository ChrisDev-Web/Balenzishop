import { useAuthStore } from '../stores/authStore'
import {
  getCatalogDisplayPrices,
  getMinQuantity,
  getRoleLabel,
  isMayorista,
} from '../utils/pricing'
import { resolvePricingRoleForMode } from '../utils/shoppingMode'
import { useShoppingMode } from './useShoppingMode'

export function useUserPricing(modeOverride = null) {
  const { pricingRole: routePricingRole } = useShoppingMode()
  const role = modeOverride ? resolvePricingRoleForMode(modeOverride) : routePricingRole

  return {
    role,
    roleLabel: getRoleLabel(role),
    isMayorista: isMayorista(role),
    minQuantity: getMinQuantity(role),
    getCatalogDisplayPrices: (product) => getCatalogDisplayPrices(product, role),
  }
}

export function useAccountClientTypeLabel() {
  const user = useAuthStore((state) => state.user)
  return getRoleLabel(user?.role)
}
