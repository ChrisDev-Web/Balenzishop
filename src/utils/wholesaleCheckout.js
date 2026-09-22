import { CART_MODES } from './shoppingMode'
import { getWholesalePackagingFee, getWholesaleMinOrderQuantity } from './pricing'

export { getWholesaleMinOrderQuantity, getWholesalePackagingFee }

export function getPackagingFeeForMode(mode, totalQuantity = 0) {
  if (mode !== CART_MODES.MAYORISTA) {
    return 0
  }

  return getWholesalePackagingFee(totalQuantity)
}

export function formatPackagingFeeLabel() {
  return 'Empaquetado'
}
