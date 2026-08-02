export const USER_ROLES = {
  MINORISTA: 'minorista',
  MAYORISTA: 'mayorista',
}

export const WHOLESALE_DISCOUNT = 0.1
export const WHOLESALE_MIN_QTY = 6

export const DECANT_BULK_EVERY = 3
export const DECANT_BULK_DISCOUNT = 10

export function getDecantBulkDiscount(quantity) {
  const qty = Math.max(0, Number(quantity) || 0)
  return Math.floor(qty / DECANT_BULK_EVERY) * DECANT_BULK_DISCOUNT
}

export function getDecantLineTotal(unitPrice, quantity) {
  const price = Number(unitPrice) || 0
  const qty = Math.max(0, Number(quantity) || 0)
  const gross = price * qty
  const discount = getDecantBulkDiscount(qty)
  return Math.round(Math.max(0, gross - discount) * 100) / 100
}

export function getCartLineTotal(item) {
  if (item?.isDecant || item?.idProductDecant) {
    return getDecantLineTotal(item.price ?? item.basePrice, item.quantity)
  }

  return (Number(item?.price) || 0) * (Number(item?.quantity) || 0)
}

export function resolveUserRole(_email, currentRole) {
  return currentRole || USER_ROLES.MINORISTA
}

export function getRoleLabel(role) {
  return role === USER_ROLES.MAYORISTA ? 'MAYORISTA' : 'MINORISTA'
}

export function isMayorista(role) {
  return role === USER_ROLES.MAYORISTA
}

export function getMinQuantity(role) {
  return isMayorista(role) ? WHOLESALE_MIN_QTY : 1
}

export function getCatalogPricePresentation(product, role) {
  const displayPrice = Number(product?.price ?? 0)

  if (isMayorista(role)) {
    const strikePrice = product?.referencePrice ?? null

    return {
      displayPrice,
      priceLabel: 'Precio mayorista',
      isLive: false,
      strikePrices:
        strikePrice != null && strikePrice > displayPrice
          ? [{ label: null, amount: strikePrice }]
          : [],
      discountReference: strikePrice,
    }
  }

  const fakePrice = product?.fakePrice
  const onlinePrice = product?.onlinePrice ?? displayPrice
  const isLive = Boolean(product?.isLivePrice)
  const strikePrices = []

  if (isLive && onlinePrice != null && onlinePrice > displayPrice) {
    strikePrices.push({ label: 'Precio online', amount: onlinePrice })
  }

  if (fakePrice != null && onlinePrice != null && fakePrice > onlinePrice) {
    strikePrices.push({ label: null, amount: fakePrice })
  } else if (!isLive && fakePrice != null && fakePrice > displayPrice) {
    strikePrices.push({ label: null, amount: fakePrice })
  }

  const discountReference = strikePrices.reduce(
    (max, strike) => (strike.amount > max ? strike.amount : max),
    0,
  ) || null

  return {
    displayPrice,
    priceLabel: isLive ? 'Precio live' : 'Precio online',
    isLive,
    strikePrices,
    discountReference,
  }
}

export function getCatalogDisplayPrices(product, role) {
  const presentation = getCatalogPricePresentation(product, role)
  const topStrike = presentation.strikePrices[0]?.amount ?? null

  return {
    displayPrice: presentation.displayPrice,
    strikePrice: topStrike,
    presentation,
  }
}

/** Porcentaje de descuento real entre precio tachado y precio actual (1 decimal). */
export function getDiscountPercent(displayPrice, strikePrice) {
  const current = Number(displayPrice)
  const original = Number(strikePrice)
  if (!Number.isFinite(current) || !Number.isFinite(original) || original <= 0 || current >= original) {
    return null
  }
  const percent = Math.round(((original - current) / original) * 1000) / 10
  return percent > 0 ? percent : null
}

/** Etiqueta de descuento: -10% o -6.3% (sin decimal si es entero). */
export function formatDiscountLabel(percent) {
  if (percent == null || percent <= 0) return null
  const text = Number.isInteger(percent) ? String(percent) : percent.toFixed(1)
  return `-${text}%`
}

export function getLiveDiscountLabel(product, role) {
  if (isMayorista(role) || !product?.isLivePrice) return null

  const { displayPrice, discountReference } = getCatalogPricePresentation(product, role)
  const percent = getDiscountPercent(displayPrice, discountReference)
  const discountText = formatDiscountLabel(percent)

  return discountText ? `Live ${discountText}` : 'Live'
}

export function getPromoDiscountLabel(product, role) {
  if (isMayorista(role)) return null

  const { displayPrice, discountReference, isLive } = getCatalogPricePresentation(product, role)
  const percent = getDiscountPercent(displayPrice, discountReference)
  const discountText = formatDiscountLabel(percent)

  if (!discountText) return null
  if (isLive) return `Live ${discountText}`

  return discountText
}

export function getProductPrice(basePrice, role) {
  if (isMayorista(role)) {
    return Math.round(basePrice * (1 - WHOLESALE_DISCOUNT) * 100) / 100
  }
  return basePrice
}

export function getOriginalPriceForRole(originalPrice, role) {
  if (!originalPrice) return null
  if (isMayorista(role)) {
    return Math.round(originalPrice * (1 - WHOLESALE_DISCOUNT) * 100) / 100
  }
  return originalPrice
}

export function getDecantCartOptions(item, cartContext = null) {
  if (!item) return null

  return {
    decantSizeMl: item.decantSizeMl ?? item.sizeMl ?? null,
    availableMl: item.availableMl ?? null,
    ...cartContext,
  }
}

export function getDecantMlUsedInCart(cartItems, productId, excludeDecantId = null) {
  return (cartItems ?? [])
    .filter(
      (item) =>
        String(item.id) === String(productId)
        && (item.isDecant || item.idProductDecant),
    )
    .filter(
      (item) =>
        excludeDecantId == null
        || (item.idProductDecant ?? null) !== (excludeDecantId ?? null),
    )
    .reduce(
      (sum, item) => sum + (Number(item.decantSizeMl) || 0) * (Number(item.quantity) || 0),
      0,
    )
}

export function getMaxCartQuantity(stock, role, isDecant = false, decantOptions = null) {
  if (isDecant) {
    const sizeMl = Number(decantOptions?.decantSizeMl) || 0
    let availableMl = Number(decantOptions?.availableMl) || 0

    if (decantOptions?.items && decantOptions?.productId != null) {
      const usedMl = getDecantMlUsedInCart(
        decantOptions.items,
        decantOptions.productId,
        decantOptions.excludeDecantId,
      )
      availableMl = Math.max(0, availableMl - usedMl)
    }

    if (sizeMl <= 0 || availableMl <= 0) return 0

    return Math.floor(availableMl / sizeMl)
  }

  if (stock == null || stock === '') return Infinity

  const available = Math.max(0, Number(stock) || 0)
  const minQty = getMinQuantity(role)

  if (available < minQty) return 0
  return available
}

export function capQuantityByStock(quantity, stock, role, isDecant = false, decantOptions = null) {
  const maxQty = getMaxCartQuantity(stock, role, isDecant, decantOptions)

  if (maxQty === 0) return 0
  if (maxQty === Infinity) return Math.max(0, Number(quantity) || 0)

  return Math.min(Math.max(0, Number(quantity) || 0), maxQty)
}

export function prepareCartItem(perfume, role, quantity = 1, cartItems = []) {
  const isDecant = Boolean(perfume.isDecant || perfume.idProductDecant)
  const minQty = isDecant ? 1 : getMinQuantity(role)
  const basePrice = perfume.basePrice ?? perfume.price
  const decantOptions = isDecant
    ? getDecantCartOptions(perfume, {
        items: cartItems,
        productId: perfume.id,
        excludeDecantId: perfume.idProductDecant ?? null,
      })
    : null
  let finalQuantity = Math.max(quantity, minQty)
  finalQuantity = capQuantityByStock(finalQuantity, perfume.stock, role, isDecant, decantOptions)

  if (finalQuantity < minQty) {
    finalQuantity = 0
  }

  return {
    ...perfume,
    basePrice,
    price: isDecant ? basePrice : getProductPrice(basePrice, role),
    quantity: finalQuantity,
    isDecant,
    idProductDecant: isDecant ? (perfume.idProductDecant ?? null) : null,
    decantSizeMl: isDecant ? (perfume.decantSizeMl ?? perfume.sizeMl ?? null) : null,
    availableMl: isDecant ? (perfume.availableMl ?? null) : null,
  }
}

export function normalizeCartQuantity(quantity, role) {
  const minQty = getMinQuantity(role)
  if (quantity < minQty) return 0
  return quantity
}
