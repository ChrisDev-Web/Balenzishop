import { apiPost } from './client'

function buildCartItems(items) {
  return items.map((item) => ({
    id_product: Number(item.id),
    quantity: Number(item.quantity),
    unit_price: Number(item.price),
  }))
}

export async function validateDiscountCoupon(code, cartItems, token) {
  return apiPost(
    'discount_coupons/validate',
    {
      code: code.trim().toUpperCase(),
      items: buildCartItems(cartItems),
    },
    token,
  )
}

export async function redeemDiscountCoupon(code, cartItems, token) {
  return apiPost(
    'discount_coupons/redeem',
    {
      code: code.trim().toUpperCase(),
      items: buildCartItems(cartItems),
    },
    token,
  )
}

export function mapValidationToAppliedCoupon(response) {
  const data = response.data
  if (!data) return null

  const coupon = data.coupon ?? {}
  const discount = Number(data.total_discount ?? 0)

  return {
    code: coupon.code,
    id_discount_coupon: coupon.id_discount_coupon,
    name: coupon.name,
    discount,
    total_discount: discount,
    eligible_items: data.eligible_items ?? [],
    discounted_cart_subtotal: Number(data.discounted_cart_subtotal ?? 0),
    label: `S/ ${discount.toFixed(2)} de descuento en productos elegibles`,
  }
}

export function buildEligibleDiscountMap(eligibleItems = []) {
  const map = new Map()

  eligibleItems.forEach((entry) => {
    map.set(Number(entry.id_product), {
      lineSubtotal: Number(entry.line_subtotal ?? 0),
      discountAmount: Number(entry.discount_amount ?? 0),
      discountedSubtotal: Number(entry.discounted_subtotal ?? 0),
    })
  })

  return map
}
