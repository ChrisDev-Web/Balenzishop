import { CART_MODES } from './shoppingMode'

export const WHOLESALE_PACKAGING_FEE = 15

export function getPackagingFeeForMode(mode) {
  return mode === CART_MODES.MAYORISTA ? WHOLESALE_PACKAGING_FEE : 0
}

export function formatPackagingFeeLabel() {
  return 'Empaquetado'
}
