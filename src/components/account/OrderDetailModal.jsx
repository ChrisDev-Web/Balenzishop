import { createPortal } from 'react-dom'
import { X, MapPin, Package } from 'lucide-react'

const STATUS_STYLES = {
  Pendiente: 'bg-amber-100 text-amber-800',
  'En Proceso': 'bg-blue-100 text-blue-800',
  Enviado: 'bg-green-100 text-green-800',
  Recibido: 'bg-gray-100 text-gray-800',
  Cancelado: 'bg-gray-100 text-gray-600',
}

function formatPaymentMode(mode) {
  if (mode === 'reserva') return 'Solo reserva'
  if (mode === 'completo') return 'Pago completo'
  return mode || '—'
}

export default function OrderDetailModal({ order, onClose }) {
  if (!order) return null

  const totalItems = order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-labelledby="order-modal-title"
        className="relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-xl"
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 id="order-modal-title" className="text-lg font-bold text-gray-900">
              Pedido #{order.id}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">{order.date}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <div className="mb-4 flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-800'}`}>
              {order.status}
            </span>
            <span className="text-sm text-gray-500">{totalItems} ítem{totalItems !== 1 ? 's' : ''}</span>
          </div>

          <div className="rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 border-b bg-gray-50 px-4 py-2.5">
              <Package className="h-4 w-4 text-gray-700" />
              <h3 className="text-sm font-semibold text-gray-900">Productos</h3>
            </div>
            <ul className="divide-y">
              {order.items?.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    {item.brand && <p className="text-xs text-gray-500">{item.brand}</p>}
                    <p className="mt-0.5 text-xs text-gray-500">
                      {item.quantity} × S/ {item.price?.toFixed(2)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-gray-900">
                    S/ {(item.discountedSubtotal ?? item.price * item.quantity).toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 space-y-1.5 rounded-lg bg-gray-50 px-4 py-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="font-bold text-gray-900">S/ {order.subtotal?.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-gray-900">
                <span>Descuento{order.discountCode ? ` (${order.discountCode})` : ''}</span>
                <span className="font-bold">- S/ {order.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Envío</span>
              {order.deliveryMode === 'delivery' && order.deliveryFee > 0 ? (
                <span className="font-bold text-gray-900">S/ {order.deliveryFee.toFixed(2)}</span>
              ) : (
                <span className="font-bold text-gray-900">Sin cargo</span>
              )}
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-gray-900">
              <span>Total</span>
              <span>S/ {order.total?.toFixed(2)}</span>
            </div>
            {order.paymentMode && (
              <div className="flex justify-between text-gray-600">
                <span>Tipo de pago</span>
                <span className="font-bold text-gray-900">{formatPaymentMode(order.paymentMode)}</span>
              </div>
            )}
            {order.amountPaid > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Pagado</span>
                <span className="font-bold text-gray-900">S/ {order.amountPaid.toFixed(2)}</span>
              </div>
            )}
            {order.balanceDue > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Saldo pendiente</span>
                <span className="font-bold text-gray-900">S/ {order.balanceDue.toFixed(2)}</span>
              </div>
            )}
          </div>

          {order.payments?.length > 0 && (
            <div className="mt-4 rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900">Pagos registrados</h3>
              <ul className="mt-2 space-y-2 text-sm text-gray-600">
                {order.payments.map((payment) => (
                  <li key={payment.id}>
                    <span className="font-bold text-gray-900">{payment.methodName}</span>
                    {' — '}
                    S/ {payment.amount.toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {order.address && (
            <div className="mt-4 rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-700" />
                <h3 className="text-sm font-semibold text-gray-900">Entrega</h3>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                {order.address.district}, {order.address.city}
              </p>
              {order.address.shalon && (
                <p className="mt-1 text-sm text-gray-500">{order.address.shalon}</p>
              )}
            </div>
          )}
        </div>

        <div className="border-t px-4 py-3 sm:px-5 sm:py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full border border-gray-300 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 sm:py-2.5 sm:text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
