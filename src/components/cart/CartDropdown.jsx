import { ShoppingCart, X, Plus, Minus, Trash2 } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../../stores/cartStore'
import { useAuthStore } from '../../stores/authStore'
import { useUiStore } from '../../stores/uiStore'
import { getRouteAfterLogin, AUTH_INTENT } from '../../utils/authFlow'
import { getMaxCartQuantity } from '../../utils/pricing'
import { useUserPricing } from '../../hooks/useUserPricing'

export default function CartDropdown({ onClose, variant = 'anchored' }) {
  const navigate = useNavigate()
  const touchStartX = useRef(null)
  const [dragX, setDragX] = useState(0)
  const { items, removeItem, updateQuantity, totalPrice } = useCartStore()
  const { isAuthenticated, user } = useAuthStore()
  const openLoginModal = useUiStore((s) => s.openLoginModal)
  const { isMayorista, minQuantity, role } = useUserPricing()

  useEffect(() => {
    items.forEach((item) => {
      const maxQuantity = getMaxCartQuantity(item.stock, role)
      if (Number.isFinite(maxQuantity) && item.quantity > maxQuantity) {
        updateQuantity(item.id, maxQuantity)
      }
    })
  }, [items, role, updateQuantity])

  const panelClass =
    variant === 'mobile'
      ? 'fixed inset-y-0 right-0 z-[130] flex w-full max-w-[400px] flex-col bg-white shadow-2xl'
      : 'absolute right-0 top-full z-50 mt-2 flex w-96 max-h-[min(80vh,640px)] flex-col rounded-xl bg-white shadow-2xl ring-1 ring-black/10'

  function handleTouchStart(event) {
    if (variant !== 'mobile') return
    touchStartX.current = event.touches[0].clientX
    setDragX(0)
  }

  function handleTouchMove(event) {
    if (variant !== 'mobile' || touchStartX.current === null) return

    const deltaX = event.touches[0].clientX - touchStartX.current
    if (deltaX > 0) {
      setDragX(deltaX)
    }
  }

  function handleTouchEnd() {
    if (variant !== 'mobile') return

    if (dragX > 72) {
      onClose()
    }

    touchStartX.current = null
    setDragX(0)
  }

  const handleGoToCheckout = () => {
    onClose()

    if (!isAuthenticated) {
      openLoginModal(AUTH_INTENT.CHECKOUT)
      return
    }

    navigate(getRouteAfterLogin(user, AUTH_INTENT.CHECKOUT))
  }

  return (
    <div
      className={panelClass}
      role="dialog"
      aria-label="Carrito de compras"
      style={variant === 'mobile' && dragX > 0 ? { transform: `translateX(${dragX}px)` } : undefined}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {variant === 'anchored' && (
        <div className="absolute -top-2 right-4 h-4 w-4 rotate-45 border-l border-t border-black/10 bg-white" />
      )}

      <div className="flex shrink-0 items-center justify-between border-b px-5 py-4">
        <h3 className="font-semibold text-gray-900">Mi carrito</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          aria-label="Cerrar carrito"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
            <ShoppingCart className="h-12 w-12 text-gray-400" />
          </div>
          <p className="text-lg font-semibold text-gray-900">Tu carrito aún está vacío.</p>
          <p className="mt-1 text-sm text-gray-500">Comienza a llenarlo.</p>
          <button
            type="button"
            onClick={() => { onClose(); navigate('/catalogo') }}
            className="mt-6 rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Ver catálogo
          </button>
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <ul className="space-y-4">
              {items.map((item) => {
                const maxQuantity = getMaxCartQuantity(item.stock, role)
                const atMaxStock = Number.isFinite(maxQuantity) && item.quantity >= maxQuantity

                return (
                <li key={item.id} className="flex gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-20 w-16 shrink-0 rounded object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.brand}</p>
                    <p className="mt-1 text-sm font-bold text-gray-900">S/ {item.price.toFixed(2)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="rounded border p-1 hover:bg-gray-50"
                        aria-label="Disminuir cantidad"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="min-w-[1.25rem] text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={atMaxStock}
                        className="rounded border p-1 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Aumentar cantidad"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="ml-auto text-gray-400 hover:text-black"
                        aria-label="Eliminar producto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
                )
              })}
            </ul>
          </div>
          <div className="shrink-0 border-t px-5 py-4">
            <div className="flex justify-between text-sm font-semibold">
              <span>Total</span>
              <span className="text-gray-900">S/ {totalPrice().toFixed(2)}</span>
            </div>
            <button
              type="button"
              onClick={handleGoToCheckout}
              className="mt-4 block w-full rounded-full bg-black py-3 text-center text-sm font-semibold text-white hover:bg-gray-800"
            >
              Ir a pedido
            </button>
            {isMayorista && (
              <p className="mt-2 text-center text-[11px] text-gray-500">
                Precio mayorista · Mín. {minQuantity} und. por producto
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
