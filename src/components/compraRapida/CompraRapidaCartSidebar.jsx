import { useRef, useState } from 'react'
import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react'
import { useCartStore } from '../../stores/cartStore'
import { CART_MODES } from '../../utils/shoppingMode'
import { getMaxCartQuantity, USER_ROLES } from '../../utils/pricing'
import { COMPRA_RAPIDA_STEPS, useCompraRapidaStore } from '../../stores/compraRapidaStore'

function formatSoles(amount) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(Number(amount) || 0)
}

export default function CompraRapidaCartSidebar({ onClose }) {
  const touchStartX = useRef(null)
  const [dragX, setDragX] = useState(0)
  const step = useCompraRapidaStore((state) => state.step)
  const setStep = useCompraRapidaStore((state) => state.setStep)
  const items = useCartStore((state) => state.minoristaItems)
  const removeItem = useCartStore((state) => state.removeItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)

  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price || 0) * item.quantity,
    0,
  )
  const canPedir = step === COMPRA_RAPIDA_STEPS.CATALOG && items.length > 0

  function handleTouchStart(event) {
    touchStartX.current = event.touches[0].clientX
    setDragX(0)
  }

  function handleTouchMove(event) {
    if (touchStartX.current === null) return
    const deltaX = event.touches[0].clientX - touchStartX.current
    if (deltaX > 0) setDragX(deltaX)
  }

  function handleTouchEnd() {
    if (dragX > 72) onClose()
    touchStartX.current = null
    setDragX(0)
  }

  function handlePedir() {
    if (!canPedir) return
    onClose()
    setStep(COMPRA_RAPIDA_STEPS.SUMMARY)
  }

  return (
    <div
      className="fixed inset-y-0 right-0 z-[130] flex w-full max-w-[400px] flex-col bg-white shadow-2xl"
      role="dialog"
      aria-label="Carrito compra rápida"
      style={dragX > 0 ? { transform: `translateX(${dragX}px)` } : undefined}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div className="flex shrink-0 items-center justify-between border-b px-5 py-4">
        <h3 className="font-semibold text-gray-900">Tu pedido rápido</h3>
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
          <p className="text-lg font-semibold text-gray-900">Carrito vacío</p>
          <p className="mt-1 text-sm text-gray-500">Añade sellados o decants desde la lista.</p>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <ul className="space-y-4">
            {items.map((item) => {
              const isDecant = Boolean(item.isDecant || item.idProductDecant)
              const maxQuantity = getMaxCartQuantity(
                item.stock,
                USER_ROLES.MINORISTA,
                isDecant,
                null,
              )
              const atMaxStock = Number.isFinite(maxQuantity) && item.quantity >= maxQuantity

              return (
                <li
                  key={item.idProductDecant ? `${item.id}-${item.idProductDecant}` : item.id}
                  className="flex gap-3"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt=""
                      className="h-20 w-16 shrink-0 rounded object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-20 w-16 shrink-0 rounded bg-gray-100" aria-hidden />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium text-gray-900">
                      {item.name}
                      {isDecant && item.decantSizeMl ? ` · ${item.decantSizeMl} ml` : ''}
                    </p>
                    <p className="text-xs text-gray-500">{item.brand}</p>
                    <p className="mt-1 text-sm font-bold text-gray-900">
                      {formatSoles(item.price)}
                      {item.quantity > 1 ? ` · Total ${formatSoles(item.price * item.quantity)}` : ''}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(
                          item.id,
                          item.quantity - 1,
                          item.idProductDecant ?? null,
                          CART_MODES.MINORISTA,
                        )}
                        className="rounded border p-1 hover:bg-gray-50"
                        aria-label="Disminuir"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="min-w-[1.25rem] text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(
                          item.id,
                          item.quantity + 1,
                          item.idProductDecant ?? null,
                          CART_MODES.MINORISTA,
                        )}
                        disabled={atMaxStock}
                        className="rounded border p-1 hover:bg-gray-50 disabled:opacity-40"
                        aria-label="Aumentar"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id, item.idProductDecant ?? null, CART_MODES.MINORISTA)}
                        className="ml-auto text-gray-400 hover:text-red-600"
                        aria-label="Eliminar"
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
      )}

      <div className="shrink-0 border-t px-5 py-4">
        <div className="flex justify-between text-sm font-semibold">
          <span>{totalUnits} producto{totalUnits === 1 ? '' : 's'}</span>
          <span className="text-gray-900">{formatSoles(subtotal)}</span>
        </div>
        <button
          type="button"
          onClick={handlePedir}
          disabled={!canPedir}
          className="mt-4 block w-full rounded-full bg-black py-3 text-center text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Pedir
        </button>
      </div>
    </div>
  )
}