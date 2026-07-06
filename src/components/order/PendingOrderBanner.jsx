import { Link } from 'react-router-dom'
import { X, ShoppingBag } from 'lucide-react'
import { useCartStore } from '../../stores/cartStore'

export default function PendingOrderBanner() {
  const { editingOrderId, clearCart } = useCartStore()

  if (!editingOrderId) return null

  const handleCancel = () => {
    if (window.confirm('¿Cancelar la edición del pedido? Se vaciará el carrito.')) {
      clearCart()
    }
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6">
        <div className="flex items-center gap-2 text-sm text-amber-900">
          <ShoppingBag className="h-4 w-4 shrink-0" />
          <span>
            Agregando productos al pedido <strong>#{editingOrderId}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/pedido"
            className="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
          >
            Ver resumen
          </Link>
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center gap-1 rounded-full border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
          >
            <X className="h-3.5 w-3.5" />
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
