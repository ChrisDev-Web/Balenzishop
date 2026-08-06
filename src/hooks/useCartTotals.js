import { useEffect, useMemo } from 'react'
import { useCartStore } from '../stores/cartStore'
import { useDecantPromoStore } from '../stores/decantPromoStore'
import { getCartDecantPromotionSummary } from '../utils/decantPromoPricing'
import { getCartLineTotal } from '../utils/pricing'

export function useCartTotals() {
  const items = useCartStore((state) => state.items)
  const promotions = useDecantPromoStore((state) => state.promotions)
  const brandSegments = useDecantPromoStore((state) => state.brandSegments)
  const ensureLoaded = useDecantPromoStore((state) => state.ensureLoaded)

  useEffect(() => {
    ensureLoaded()
  }, [ensureLoaded])

  return useMemo(() => {
    const hasDecants = items.some((item) => item.isDecant || item.idProductDecant)

    if (!hasDecants) {
      const subtotal = items.reduce((sum, item) => sum + getCartLineTotal(item), 0)
      return {
        items,
        grossSubtotal: subtotal,
        subtotal,
        decantPromoDiscount: 0,
        promoResult: { discount: 0, lineDiscounts: {} },
      }
    }

    const summary = getCartDecantPromotionSummary(items, promotions, brandSegments)
    const grossSubtotal = items.reduce((sum, item) => sum + getCartLineTotal(item), 0)

    return {
      items,
      grossSubtotal,
      subtotal: summary.subtotal,
      decantPromoDiscount: summary.decantPromoDiscount,
      promoResult: summary.promoResult,
    }
  }, [items, promotions, brandSegments])
}

export function getLinePromoDiscount(lineIndex, promoResult) {
  return Number(promoResult?.lineDiscounts?.[lineIndex] ?? 0)
}

export function getLineDisplayTotal(item, lineIndex, promoResult) {
  const gross = getCartLineTotal(item)
  const promoDiscount = getLinePromoDiscount(lineIndex, promoResult)
  return Math.round(Math.max(0, gross - promoDiscount) * 100) / 100
}
