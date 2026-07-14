export const RESERVATION_UNIT_AMOUNT = 20

export function calculateReservationAmount(totalQuantity) {
  return Number(totalQuantity) * RESERVATION_UNIT_AMOUNT
}
