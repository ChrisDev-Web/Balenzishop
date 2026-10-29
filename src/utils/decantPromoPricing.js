/**
 * Promociones de decants: descuento por bundle a nivel carrito (bruto − descuento).
 * No reparte centavos por línea; el subtotal cuadra con el backend (bundle_price).
 */

import { getCartLineTotal } from './pricing'

function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100
}

function expandDecantUnits(cartItems, brandSegments) {
  const units = []

  for (let lineIndex = 0; lineIndex < cartItems.length; lineIndex += 1) {
    const item = cartItems[lineIndex]
    if (!item?.isDecant && !item?.idProductDecant) continue

    const brandId = Number(item.idBrand ?? item.id_brand ?? 0)
    const segment = brandSegments?.[brandId] ?? brandSegments?.[String(brandId)] ?? null
    if (!segment) continue

    const sizeMl = Number(item.decantSizeMl ?? item.sizeMl ?? 0)
    const unitPrice = Number(item.price ?? item.basePrice ?? 0)
    const quantity = Number(item.quantity ?? 0)

    if (sizeMl <= 0 || unitPrice <= 0 || quantity <= 0) continue

    for (let i = 0; i < quantity; i += 1) {
      units.push({
        lineIndex,
        segment,
        sizeMl,
        unitPrice,
      })
    }
  }

  return units
}

function groupUnits(units) {
  const groups = {}

  units.forEach((unit) => {
    const key = `${unit.segment}|${unit.sizeMl}`
    if (!groups[key]) groups[key] = []
    groups[key].push(unit)
  })

  return groups
}

function calculateGroupDiscount(units, promotions) {
  if (!units.length || !promotions.length) {
    return 0
  }

  const segment = units[0].segment
  const sizeMl = units[0].sizeMl

  const promos = promotions
    .filter(
      (promo) =>
        promo.segment === segment
        && Number(promo.size_ml) === sizeMl
        && promo.is_active !== false,
    )
    .sort((a, b) => Number(b.quantity) - Number(a.quantity))

  if (!promos.length) {
    return 0
  }

  const pool = [...units].sort((a, b) => b.unitPrice - a.unitPrice)
  let totalDiscount = 0

  while (pool.length > 0) {
    let applied = false

    for (const promo of promos) {
      const needed = Number(promo.quantity)
      if (pool.length < needed) continue

      const bundleUnits = pool.splice(0, needed)
      const bundleSubtotal = roundMoney(
        bundleUnits.reduce((sum, unit) => sum + unit.unitPrice, 0),
      )
      const bundlePrice = roundMoney(Number(promo.bundle_price))
      const bundleDiscount = roundMoney(Math.max(0, bundleSubtotal - bundlePrice))

      if (bundleDiscount <= 0) continue

      totalDiscount = roundMoney(totalDiscount + bundleDiscount)
      applied = true
      break
    }

    if (!applied) break
  }

  return totalDiscount
}

/** Descuento total de promos decants (suma de bundles), sin prorrateo por línea. */
export function calculateDecantPromotionDiscount(cartItems, promotions = [], brandSegments = {}) {
  const units = expandDecantUnits(cartItems, brandSegments)
  const groups = groupUnits(units)

  let totalDiscount = 0

  Object.values(groups).forEach((groupUnits) => {
    totalDiscount = roundMoney(
      totalDiscount + calculateGroupDiscount(groupUnits, promotions),
    )
  })

  return totalDiscount
}

export function getCartDecantPromotionSummary(cartItems, promotions = [], brandSegments = {}) {
  const grossSubtotal = roundMoney(
    cartItems.reduce((sum, item) => sum + getCartLineTotal(item), 0),
  )
  const decantPromoDiscount = calculateDecantPromotionDiscount(
    cartItems,
    promotions,
    brandSegments,
  )
  const subtotal = roundMoney(Math.max(0, grossSubtotal - decantPromoDiscount))

  return {
    promoResult: { discount: decantPromoDiscount, lineDiscounts: {} },
    subtotal,
    decantPromoDiscount,
  }
}
