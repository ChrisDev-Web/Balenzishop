export function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100
}

/**
 * @returns {{ valid: boolean, amount: number|null, message: string }}
 */
export function validateCustomPaymentAmount(rawAmount, reservationAmount, orderTotal) {
  const reservation = roundMoney(reservationAmount)
  const total = roundMoney(orderTotal)
  const trimmed = String(rawAmount ?? '').trim()

  if (!trimmed) {
    return { valid: false, amount: null, message: 'Indica el monto que deseas pagar.' }
  }

  const amount = roundMoney(trimmed)
  if (!Number.isFinite(amount)) {
    return { valid: false, amount: null, message: 'Indica un monto válido.' }
  }

  if (amount <= reservation) {
    return {
      valid: false,
      amount: null,
      message: `Debe ser mayor a S/ ${reservation.toFixed(2)} (reserva).`,
    }
  }

  if (amount > total) {
    return {
      valid: false,
      amount: null,
      message: `No puede superar S/ ${total.toFixed(2)} (total del pedido).`,
    }
  }

  const cents = Math.round(amount * 100)
  if (cents % 10 !== 0) {
    return {
      valid: false,
      amount: null,
      message: 'Solo se permiten montos en incrementos de S/ 0.10 (ej. 100.10, 250.50).',
    }
  }

  return { valid: true, amount, message: '' }
}

export function formatPaymentModeLabel(mode) {
  if (mode === 'completo') return 'Pago completo'
  if (mode === 'personalizado') return 'Pago personalizado'
  return 'Solo reserva'
}
