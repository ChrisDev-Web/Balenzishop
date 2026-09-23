import { normalizeMediaUrl } from './mediaUrl'

const STATUS_MAP = {
  Pendiente: 'Pendiente',
  'En Proceso': 'En Proceso',
  Enviado: 'Enviado',
  Entregado: 'Entregado',
  Cancelado: 'Cancelado',
}

export function mapGuestTrackingOrder(order) {
  if (!order) return null

  const details = order.details ?? []

  return {
    orderNumber: order.order_number,
    status: STATUS_MAP[order.display_status] || order.display_status || order.status || 'Enviado',
    items: details.map((detail, index) => ({
      id: detail.id_client_order_detail ?? detail.id_product ?? index,
      name: detail.product_name || 'Producto',
      quantity: Number(detail.quantity ?? 0),
      price: Number(detail.unit_price ?? 0),
      discountedSubtotal: Number(detail.discounted_subtotal ?? detail.line_subtotal ?? 0),
    })),
    total: Number(order.total_amount ?? 0),
    shalom: order.shalom
      ? {
          guideNumber: order.shalom.guide_number || '',
          guideCode: order.shalom.guide_code || '',
          pickupKey: order.shalom.pickup_key || null,
          receiptUrl: order.shalom.receipt_url ? normalizeMediaUrl(order.shalom.receipt_url) : null,
          receiptName: order.shalom.receipt_name || '',
          receiptIsPdf: Boolean(order.shalom.receipt_is_pdf),
        }
      : null,
  }
}
