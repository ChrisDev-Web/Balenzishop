import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { useCartStore } from '../../stores/cartStore'
import { useUserPricing } from '../../hooks/useUserPricing'
import { productLink } from '../../utils/productUtils'

export default function MostRequestedRow({ products, catalogLink: catalogHref, title = 'Lo más pedido' }) {
  const addItem = useCartStore((s) => s.addItem)
  const { getPrice, isMayorista, minQuantity } = useUserPricing()

  if (!products.length) return null

  return (
    <section>
      <div className="flex items-center justify-between border-b-2 border-gray-900 pb-2">
        <h2 className="text-lg font-black uppercase tracking-widest text-gray-900 md:text-xl">
          {title}
        </h2>
        <Link to={catalogHref} className="text-xs font-bold uppercase tracking-wide text-brand hover:underline sm:text-sm">
          Ver todo →
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:grid-cols-4 sm:gap-4">
        {products.map((p) => (
          <article
            key={p.id}
            className="flex flex-col rounded-xl border border-gray-200 bg-white p-3 transition hover:shadow-md"
          >
            <Link to={productLink(p.id)} className="block">
              <div className="relative mx-auto flex h-32 w-full items-center justify-center overflow-hidden rounded-lg bg-gray-50 sm:h-36">
                <img src={p.image} alt={p.name} className="max-h-full max-w-full object-contain" loading="lazy" />
                {p.onSale && (
                  <span className="absolute right-1 top-1 rounded border border-gray-900 bg-white px-1.5 py-0.5 text-[10px] font-black uppercase">
                    Oferta
                  </span>
                )}
              </div>
              <p className="mt-2 line-clamp-2 text-center text-xs font-bold text-gray-900 sm:text-sm">
                {p.name.replace(/^(\w+\s)/, '')}
              </p>
            </Link>
            <div className="mt-1 text-center">
              {isMayorista && (
                <span className="mr-1 text-xs text-gray-400 line-through">S/ {p.price.toFixed(2)}</span>
              )}
              {!isMayorista && p.originalPrice && (
                <span className="mr-1 text-xs text-gray-400 line-through">S/ {p.originalPrice.toFixed(2)}</span>
              )}
              <span className="text-sm font-black text-brand">S/ {getPrice(p.price).toFixed(2)}</span>
            </div>
            <button
              type="button"
              onClick={() => addItem(p)}
              className="mt-2 flex w-full items-center justify-center gap-1 rounded-full bg-amber-100 py-2 text-xs font-bold text-gray-900 hover:bg-amber-200"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              {isMayorista ? `Añadir (${minQuantity})` : 'Añadir'}
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
