import { memo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { useCartStore } from '../../stores/cartStore'
import { useUserPricing } from '../../hooks/useUserPricing'
import { productLink } from '../../utils/productUtils'

function ProductCard({ perfume, priority = false }) {
  const addItem = useCartStore((s) => s.addItem)
  const { getCatalogDisplayPrices, isMayorista, minQuantity } = useUserPricing()
  const [imgError, setImgError] = useState(false)
  const { displayPrice, strikePrice } = getCatalogDisplayPrices(perfume)

  const handleAdd = (e) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(perfume)
  }

  return (
    <Link
      to={productLink(perfume.id)}
      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:shadow-md md:hover:shadow-lg [content-visibility:auto]"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-50 sm:aspect-[3/4]">
        {!imgError ? (
          <img
            src={perfume.image}
            alt={perfume.name}
            width={200}
            height={250}
            className="h-full w-full object-contain p-1 sm:p-2 md:transition md:group-hover:scale-105"
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'low'}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-1 text-center text-[10px] leading-tight text-gray-400 sm:p-2 sm:text-xs">
            {perfume.name}
          </div>
        )}
        {isMayorista && (
          <span className="absolute left-1 top-1 rounded bg-gray-900 px-1 py-px text-[8px] font-bold leading-none text-white sm:left-1.5 sm:top-1.5 sm:px-1.5 sm:py-0.5 sm:text-[10px] md:text-xs">
            -10%
          </span>
        )}
        {perfume.onSale && (
          <span
            className={`absolute left-1 rounded bg-black px-1 py-px text-[8px] font-bold leading-none text-white sm:left-1.5 sm:px-1.5 sm:py-0.5 sm:text-[10px] md:text-xs ${
              isMayorista ? 'top-5 sm:top-7' : 'top-1 sm:top-1.5'
            }`}
          >
            Oferta
          </span>
        )}
        {perfume.productType === 'set' && (
          <span className="absolute right-1 top-1 rounded bg-gray-900 px-1 py-px text-[8px] font-bold leading-none text-white sm:right-1.5 sm:top-1.5 sm:px-1.5 sm:py-0.5 sm:text-[10px] md:text-xs">
            Set
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-2 sm:p-2.5 md:p-4">
        <p className="truncate text-[10px] text-gray-500 sm:text-xs">{perfume.brand}</p>
        <h3 className="mt-0.5 line-clamp-2 min-h-[2.2em] text-[11px] font-semibold leading-tight text-gray-900 sm:min-h-0 sm:text-xs md:text-sm md:leading-snug">
          {perfume.name}
        </h3>
        <p className="mt-0.5 hidden line-clamp-1 text-xs text-gray-400 md:block">{perfume.aroma}</p>

        <div className="mt-auto space-y-1.5 pt-1.5 sm:space-y-2 sm:pt-2 md:space-y-2.5 md:pt-4">
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-gray-900 sm:text-sm md:text-lg">
              S/ {displayPrice.toFixed(2)}
            </p>
            {strikePrice != null && (
              <p className="truncate text-[9px] text-gray-400 line-through sm:text-[10px] md:text-xs">
                S/ {strikePrice.toFixed(2)}
              </p>
            )}
            {isMayorista && (
              <p className="text-[9px] text-gray-500 sm:text-[10px] md:text-xs">Mín. {minQuantity}</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="btn-fill w-full min-w-0 gap-1 px-1.5 py-1.5 text-[9px] sm:gap-1.5 sm:px-2 sm:py-2 sm:text-[10px] md:px-3 md:py-2.5 md:text-xs"
            aria-label={isMayorista ? `Agregar ${minQuantity} unidades` : 'Agregar al carrito'}
          >
            <ShoppingBag className="h-3 w-3 shrink-0 md:h-3.5 md:w-3.5" />
            <span className="truncate">
              {isMayorista ? (
                <>
                  <span className="sm:hidden">+{minQuantity}</span>
                  <span className="hidden sm:inline">Agregar ({minQuantity})</span>
                </>
              ) : (
                'Agregar'
              )}
            </span>
          </button>
        </div>
      </div>
    </Link>
  )
}

export default memo(ProductCard)
