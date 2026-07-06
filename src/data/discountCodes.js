export const DISCOUNT_CODES = {
  BALENZI20: { discount: 20, label: 'S/ 20.00 de descuento' },
  BIENVENIDO10: { discount: 10, label: 'S/ 10.00 de descuento' },
}

export function validateDiscountCode(code) {
  if (!code?.trim()) return { valid: false, error: 'Ingresa un código' }

  const normalized = code.trim().toUpperCase()
  const found = DISCOUNT_CODES[normalized]

  if (!found) return { valid: false, error: 'Código no válido o expirado' }

  return {
    valid: true,
    code: normalized,
    discount: found.discount,
    label: found.label,
  }
}
