import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { fetchCatalogProductDetail } from '../../api/products'
import DecantSizeSelector from '../product/DecantSizeSelector'
import { useAddToCart } from '../../hooks/useAddToCart'
import { buildCompraRapidaDecantCartProduct, COMPRA_RAPIDA_CART_MODE } from '../../utils/compraRapidaCart'
function formatCatalogPrice(amount) {
  const value = Number(amount) || 0
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(value)
}

export default function CompraRapidaDecantPickerModal({ product, onClose, onAdded }) {
  const addToCart = useAddToCart(COMPRA_RAPIDA_CART_MODE)
  const [detail, setDetail] = useState(null)
  const [selectedDecant, setSelectedDecant] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!product?.id) return undefined

    let ignore = false
    setIsLoading(true)
    setError('')

    fetchCatalogProductDetail(product.id)
      .then((data) => {
        if (ignore) return
        const available = (data.decants ?? []).filter((decant) => decant.price > 0)
        setDetail(data)
        setSelectedDecant(available[0] ?? null)
        if (available.length === 0) {
          setError('Este producto no tiene decants disponibles.')
        }
      })
      .catch(() => {
        if (!ignore) setError('No se pudo cargar los tamaños de decant.')
      })
      .finally(() => {
        if (!ignore) setIsLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [product?.id])

  function handleConfirm() {
    if (!selectedDecant) return

    addToCart(buildCompraRapidaDecantCartProduct(
      { ...product, idBrand: detail?.idBrand ?? product.idBrand },
      selectedDecant,
    ))
    onAdded?.()
    onClose?.()
  }

  if (!product) return null

  const decants = detail?.decants?.filter((decant) => decant.price > 0) ?? []

  return (
    <div className="compra-rapida-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="compra-rapida-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="compra-rapida-decant-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="compra-rapida-modal__header">
          <h2 id="compra-rapida-decant-title">Elegir decant</h2>
          <button type="button" className="compra-rapida-modal__close" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>

        <div className="compra-rapida-modal__body">
          <p className="compra-rapida-modal__product-name">{product.name}</p>
          <p className="compra-rapida-modal__product-brand">{product.brand}</p>

          {isLoading ? (
            <p className="compra-rapida-muted">Cargando tamaños…</p>
          ) : error ? (
            <p className="compra-rapida-error" role="alert">{error}</p>
          ) : (
            <>
              <DecantSizeSelector
                decants={decants}
                selectedId={selectedDecant?.idProductDecant}
                onSelect={setSelectedDecant}
              />
              {selectedDecant ? (
                <p className="compra-rapida-modal__price text-lg font-bold">
                  {formatCatalogPrice(selectedDecant.price)}
                </p>
              ) : null}
            </>
          )}
        </div>

        <footer className="compra-rapida-modal__footer">
          <button type="button" className="compra-rapida-btn compra-rapida-btn--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="compra-rapida-btn compra-rapida-btn--primary"
            disabled={!selectedDecant || isLoading}
            onClick={handleConfirm}
          >
            Añadir al carrito
          </button>
        </footer>
      </div>
    </div>
  )
}