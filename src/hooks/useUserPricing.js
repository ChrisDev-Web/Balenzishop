import { useAuthStore } from '../stores/authStore'
import {
  getProductPrice,
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
    getPrice: (basePrice) => getProductPrice(basePrice, role),
  }
}
