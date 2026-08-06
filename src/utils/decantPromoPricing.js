/**
 * Calcula descuento por promociones de decants configuradas en admin.
 * Agrupa unidades elegibles por segmento + ml y aplica bundles activos.
 */

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
    return { discount: 0, lineDiscounts: {} }
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
    return { discount: 0, lineDiscounts: {} }
  }

  const pool = [...units].sort((a, b) => b.unitPrice - a.unitPrice)
  let totalDiscount = 0
  const lineDiscounts = {}

  while (pool.length > 0) {
    let applied = false

    for (const promo of promos) {
      const needed = Number(promo.quantity)
      if (pool.length < needed) continue

      const bundleUnits = pool.splice(0, needed)
      const bundleSubtotal = bundleUnits.reduce((sum, unit) => sum + unit.unitPrice, 0)
      const bundlePrice = Number(promo.bundle_price)
      const bundleDiscount = Math.max(0, Math.round((bundleSubtotal - bundlePrice) * 100) / 100)

      if (bundleDiscount <= 0) continue

      totalDiscount = Math.round((totalDiscount + bundleDiscount) * 100) / 100

      const countsByLine = {}
      bundleUnits.forEach((unit) => {
        countsByLine[unit.lineIndex] = (countsByLine[unit.lineIndex] ?? 0) + 1
      })

      Object.entries(countsByLine).forEach(([lineIndex, count]) => {
        const share = Math.round((bundleDiscount * (count / needed)) * 100) / 100
        lineDiscounts[lineIndex] = Math.round(((lineDiscounts[lineIndex] ?? 0) + share) * 100) / 100
      })

      applied = true
      break
    }

    if (!applied) break
  }

  return { discount: totalDiscount, lineDiscounts }
}

export function calculateDecantPromotionDiscount(cartItems, promotions = [], brandSegments = {}) {
  const units = expandDecantUnits(cartItems, brandSegments)
  const groups = groupUnits(units)

  let totalDiscount = 0
  const lineDiscounts = {}

  Object.values(groups).forEach((groupUnits) => {
    const result = calculateGroupDiscount(groupUnits, promotions)
    totalDiscount = Math.round((totalDiscount + result.discount) * 100) / 100

    Object.entries(result.lineDiscounts).forEach(([lineIndex, amount]) => {
      lineDiscounts[lineIndex] = Math.round(((lineDiscounts[lineIndex] ?? 0) + amount) * 100) / 100
    })
  })

  return {
    discount: totalDiscount,
    lineDiscounts,
  }
}

export function getDecantLineGrossTotal(unitPrice, quantity) {
  const price = Number(unitPrice) || 0
  const qty = Math.max(0, Number(quantity) || 0)
  return Math.round(price * qty * 100) / 100
}

export function getDecantLinePromoDiscount(lineIndex, promoResult) {
  return Number(promoResult?.lineDiscounts?.[lineIndex] ?? 0)
}

export function getDecantLineNetTotal(unitPrice, quantity, lineIndex, promoResult) {
  const gross = getDecantLineGrossTotal(unitPrice, quantity)
  const discount = getDecantLinePromoDiscount(lineIndex, promoResult)
  return Math.round(Math.max(0, gross - discount) * 100) / 100
}

export function getCartDecantPromotionSummary(cartItems, promotions = [], brandSegments = {}) {
  const promoResult = calculateDecantPromotionDiscount(cartItems, promotions, brandSegments)

  const lineTotals = cartItems.map((item, index) => {
    if (!item?.isDecant && !item?.idProductDecant) {
      return (Number(item?.price) || 0) * (Number(item?.quantity) || 0)
    }

    return getDecantLineNetTotal(
      item.price ?? item.basePrice,
      item.quantity,
      index,
      promoResult,
    )
  })

  const subtotal = Math.round(lineTotals.reduce((sum, value) => sum + value, 0) * 100) / 100

  return {
    promoResult,
    subtotal,
    decantPromoDiscount: promoResult.discount,
  }
}
