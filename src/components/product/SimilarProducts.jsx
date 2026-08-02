import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useUserPricing } from '../../hooks/useUserPricing'
import { useAddToCart } from '../../hooks/useAddToCart'
import { getCatalogPricePresentation, getPromoDiscountLabel } from '../../utils/pricing'
import CatalogPriceDisplay from './CatalogPriceDisplay'
import LiveDiscountBadge from './LiveDiscountBadge'
import { productLink } from '../../utils/productUtils'

export default function SimilarProducts({ products = [], categoryLink }) {
  const scrollRef = useRef(null)
  const addToCart = useAddToCart()
  const { isMayorista, minQuantity, role } = useUserPricing()

  if (!products?.length) return null

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 280, behavior: 'smooth' })
  }

  return (
    <section className="mt-16 border-t border-gray-200 pt-10">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-gray-900">Productos similares</h2>
        {categoryLink && (
          <Link
            to={categoryLink}
            className="btn-fill px-4 py-1.5 text-xs"
          >
            Ver todo
          </Link>
        )}
        <div className="ml-auto hidden gap-2 sm:flex">
          <button
            type="button"
            onClick={() => scroll(-1)}
            className="rounded-full bg-gray-900 p-2 text-white hover:bg-gray-700"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            className="rounded-full bg-gray-900 p-2 text-white hover:bg-gray-700"
            aria-label="Siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="mt-6 flex gap-4 overflow-x-auto pb-4 scrollbar-thin"
      >
        {products.map((p) => {
          const pricePresentation = getCatalogPricePresentation(p, role)
          const promoDiscountLabel = getPromoDiscountLabel(p, role)

          return (
          <article
            key={p.id}
            className="w-[200px] shrink-0 rounded-xl border border-gray-200 bg-white p-3 sm:w-[220px]"
          >
            <Link to={productLink(p.id)} className="block">
              <div className="relative flex h-40 items-center justify-center rounded-lg bg-stone-50 p-2">
                {promoDiscountLabel && (
                  <LiveDiscountBadge label={promoDiscountLabel} className="absolute left-2 top-2" />
                )}
                <img src={p.image} alt={p.name} className="max-h-full max-w-full object-contain" />
              </div>
              <p className="mt-2 text-xs font-bold uppercase text-gray-500">{p.brand}</p>
              <h3 className="mt-0.5 line-clamp-2 text-sm font-medium text-gray-900">{p.name}</h3>
            </Link>
            <div className="mt-2">
              <CatalogPriceDisplay presentation={pricePresentation} variant="card" />
            </div>
            <p className={`mt-1 text-[10px] ${p.stock > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
              Disponible: {p.stock} und.
            </p>
            <button
              type="button"
              onClick={(event) => addToCart(p, event)}
              className="btn-fill mt-3 w-full py-2 text-[10px]"
            >
              {isMayorista ? `Agregar (${minQuantity})` : 'Agregar'}
            </button>
          </article>
        )})}
      </div>
    </section>
  )
}
