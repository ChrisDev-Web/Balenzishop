import { useCallback } from 'react'
import { useCartStore } from '../stores/cartStore'
import { triggerFlyToCartAnimation } from '../utils/cartAnimation'

export function useAddToCart() {
  const addItem = useCartStore((s) => s.addItem)

  return useCallback(
    (product, event, quantity = 1) => {
      addItem(product, quantity)
      triggerFlyToCartAnimation({
        image: product?.image,
        event,
      })
    },
    [addItem],
  )
}
