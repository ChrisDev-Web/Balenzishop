import { X, MapPin, Package, Plus } from 'lucide-react'

const STATUS_LABELS = {
  pending: 'Pendiente',
  in_progress: 'En curso',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-600',
}

export default function OrderDetailModal({ order, onClose, onAddProducts }) {
  if (!order) return null

  const totalItems = order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0
  const isPending = order.status === 'pending'

  const handleAddProducts = () => {
    onAddProducts?.(order)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-labelledby="order-modal-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
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
              {STATUS_LABELS[order.status] || order.status}
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
                  <p className="shrink-0 text-sm font-semibold text-gray-900">
                    S/ {(item.price * item.quantity).toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 space-y-1.5 rounded-lg bg-gray-50 px-4 py-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>S/ {order.subtotal?.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Descuento{order.discountCode ? ` (${order.discountCode})` : ''}</span>
                <span>- S/ {order.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Envío</span>
              {order.deliveryMode === 'delivery' && order.deliveryFee > 0 ? (
                <span>S/ {order.deliveryFee.toFixed(2)}</span>
              ) : order.deliveryMode === 'shalon_paid' ? (
                <span>Recojo Shalon (con cargo)</span>
              ) : (
                <span className="text-green-600">Sin cargo</span>
              )}
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-gray-900">
              <span>Total</span>
              <span className="text-gray-900">S/ {order.total?.toFixed(2)}</span>
            </div>
          </div>

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

        <div className="flex flex-col gap-2 border-t px-5 py-4 sm:flex-row">
          {isPending && onAddProducts && (
            <button
              type="button"
              onClick={handleAddProducts}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-black py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
            >
              <Plus className="h-4 w-4" />
              Agregar productos
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className={`rounded-full border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 ${isPending && onAddProducts ? 'flex-1' : 'w-full'}`}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
