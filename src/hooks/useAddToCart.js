import { useCallback } from 'react'
import { useCartStore } from '../stores/cartStore'
import { triggerFlyToCartAnimation } from '../utils/cartAnimation'
import { useShoppingMode } from './useShoppingMode'

export function useAddToCart(modeOverride = null) {
  const addItem = useCartStore((state) => state.addItem)
  const { mode: routeMode } = useShoppingMode()
  const mode = modeOverride ?? routeMode

  return useCallback(
    (product, event, quantity = 1) => {
      addItem(product, quantity, mode)
      triggerFlyToCartAnimation({
        image: product?.image,
        event,
      })
    },
    [addItem, mode],
  )
}
