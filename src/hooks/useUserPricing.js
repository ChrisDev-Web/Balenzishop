import { useAuthStore } from '../stores/authStore'
import {
  getCatalogDisplayPrices,
  getMinQuantity,
  getRoleLabel,
  isMayorista,
} from '../utils/pricing'

export function useUserPricing() {
  const role = useAuthStore((s) => s.user?.role) || 'minorista'

  return {
    role,
    roleLabel: getRoleLabel(role),
    isMayorista: isMayorista(role),
    minQuantity: getMinQuantity(role),
    getCatalogDisplayPrices: (product) => getCatalogDisplayPrices(product, role),
  }
}
