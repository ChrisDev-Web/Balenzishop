import { formatOrderDate } from './orderMessage'

const STATUS_MAP = {
  Pendiente: 'Pendiente',
  'Reserva Verificada': 'En Proceso',
  'Pago restante enviado': 'En Proceso',
  'Pago total Verificado': 'En Proceso',
  'En Proceso': 'En Proceso',
  Enviado: 'Enviado',
  Recibido: 'Entregado',
  Entregado: 'Entregado',
  Cancelado: 'Cancelado',
}

export function mapApiClientOrder(order) {
  if (!order) return null

  const details = order.details ?? []

  return {
    id: order.order_number,
    idClientOrder: order.id_client_order,
    orderNumber: order.order_number,
    date: formatOrderDate(new Date(order.created_at)),
    createdAt: order.created_at,
    status: order.is_returned
      ? 'Cancelado'
      : order.display_status
        ? (STATUS_MAP[order.display_status] || order.display_status)
        : (STATUS_MAP[order.status] || order.status),
    displayStatus: order.display_status || order.status,
    statusRaw: order.status,
    paymentMode: order.payment_mode,
    items: details.map((detail) => ({
      id: detail.id_product,
      name: detail.product_name,
      brand: detail.brand_name,
      price: Number(detail.unit_price),
      quantity: Number(detail.quantity),
      lineSubtotal: Number(detail.line_subtotal),
      discountAmount: Number(detail.discount_amount),
      discountedSubtotal: Number(detail.discounted_subtotal),
    })),
    subtotal: Number(order.subtotal),
    discount: Number(order.discount_amount),
    discountCode: order.discount_code,
    deliveryFee: Number(order.delivery_fee),
    deliveryMode: order.delivery_mode,
    deliveryLabel: order.delivery_label,
    total: Number(order.total_amount),
    reservationAmount: Number(order.reservation_amount),
    amountPaid: Number(order.amount_paid),
    balanceDue: Number(order.balance_due),
    balancePaymentMethodId: order.balance_payment_method_id,
    balancePaymentMethodName: order.balance_payment_method_name,
    balancePaymentMethodIsPos: Boolean(order.balance_payment_method_is_pos),
    totalQuantity: Number(order.total_quantity),
    payments: (order.payments ?? []).map((payment) => ({
      id: payment.id_client_order_payment,
      methodId: payment.id_payment_method,
      methodName: payment.payment_method_name,
      amount: Number(payment.amount),
      paymentType: payment.payment_type,
      proofs: (payment.proofs ?? []).map((proof) => ({
        id: proof.id_client_order_payment_proof,
        url: proof.url,
        name: proof.original_name,
      })),
    })),
    address: order.delivery
      ? {
          district: order.delivery.district,
          city: order.delivery.city,
          shalon: order.delivery.shalon,
        }
      : null,
    source: 'api',
    canSubmitBalancePayment: Boolean(order.can_submit_balance_payment),
    shalom: order.shalom
      ? {
          guideNumber: order.shalom.guide_number,
          guideCode: order.shalom.guide_code,
          receiptUrl: order.shalom.receipt_url,
          receiptName: order.shalom.receipt_name,
          hasGuide: Boolean(order.shalom.has_guide),
          canViewTracking: Boolean(order.shalom.can_view_tracking),
        }
      : null,
    isShalonDelivery: Boolean(order.is_shalon_delivery),
    isReturned: Boolean(order.is_returned),
  }
}

export function mapApiClientOrders(orders = []) {
  return orders.map(mapApiClientOrder).filter(Boolean)
}
