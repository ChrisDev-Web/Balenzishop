import { Minus, Plus, Trash2 } from 'lucide-react'
import { COMPRA_RAPIDA_STEPS, useCompraRapidaStore } from '../../stores/compraRapidaStore'
import { useCartStore } from '../../stores/cartStore'
import { useCartTotals } from '../../hooks/useCartTotals'
import { CART_MODES } from '../../utils/shoppingMode'
import { getMaxCartQuantity, USER_ROLES } from '../../utils/pricing'

function formatSoles(amount) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(Number(amount) || 0)
}

export default function CompraRapidaCartBar() {
  const step = useCompraRapidaStore((state) => state.step)
  const setStep = useCompraRapidaStore((state) => state.setStep)
  const items = useCartStore((state) => state.minoristaItems)
  const removeItem = useCartStore((state) => state.removeItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const { subtotal } = useCartTotals(CART_MODES.MINORISTA)

  if (step !== COMPRA_RAPIDA_STEPS.CATALOG) return null

  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0)
  const hasItems = items.length > 0

  return (
    <div className={`compra-rapida-cart-bar${hasItems ? '' : ' compra-rapida-cart-bar--compact'}`}>
      <div className="compra-rapida-cart-bar__inner">
        {hasItems ? (
          <div className="compra-rapida-cart-bar__items">
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
                <article
                  key={item.idProductDecant ? `${item.id}-${item.idProductDecant}` : item.id}
                  className="compra-rapida-cart-line"
                >
                  <div className="compra-rapida-cart-line__thumb" aria-hidden={item.image ? undefined : true}>
                    {item.image ? (
                      <img src={item.image} alt="" loading="lazy" />
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                  <div className="compra-rapida-cart-line__meta">
                    <p className="compra-rapida-cart-line__name">
                      {item.name}
                      {isDecant && item.decantSizeMl ? ` · ${item.decantSizeMl} ml` : ''}
                    </p>
                    <p className="compra-rapida-cart-line__price">
                      {formatSoles(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <div className="compra-rapida-cart-line__actions">
                    <button
                      type="button"
                      className="compra-rapida-icon-btn"
                      aria-label="Disminuir"
                      onClick={() => updateQuantity(
                        item.id,
                        item.quantity - 1,
                        item.idProductDecant ?? null,
                        CART_MODES.MINORISTA,
                      )}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="compra-rapida-cart-line__qty">{item.quantity}</span>
                    <button
                      type="button"
                      className="compra-rapida-icon-btn"
                      aria-label="Aumentar"
                      disabled={atMaxStock}
                      onClick={() => updateQuantity(
                        item.id,
                        item.quantity + 1,
                        item.idProductDecant ?? null,
                        CART_MODES.MINORISTA,
                      )}
                    >
                      <Plus size={16} />
                    </button>
                    <button
                      type="button"
                      className="compra-rapida-icon-btn compra-rapida-icon-btn--danger"
                      aria-label="Eliminar"
                      onClick={() => removeItem(
                        item.id,
                        item.idProductDecant ?? null,
                        CART_MODES.MINORISTA,
                      )}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <p className="compra-rapida-cart-bar__empty">Busca un producto y añádelo para armar tu pedido</p>
        )}

        <footer className="compra-rapida-cart-bar__footer">
          <div>
            <p className="compra-rapida-cart-bar__total-label">
              {totalUnits} producto{totalUnits === 1 ? '' : 's'}
            </p>
            <p className="compra-rapida-cart-bar__total">{formatSoles(subtotal)}</p>
          </div>
          <button
            type="button"
            className="compra-rapida-btn compra-rapida-btn--primary"
            disabled={!hasItems}
            onClick={() => setStep(COMPRA_RAPIDA_STEPS.SUMMARY)}
          >
            Pedir
          </button>
        </footer>
      </div>
    </div>
  )
}