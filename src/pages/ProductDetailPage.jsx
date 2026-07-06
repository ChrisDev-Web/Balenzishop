import { Link, useParams, Navigate } from 'react-router-dom'
import { Home, ChevronRight } from 'lucide-react'
import { useCartStore } from '../stores/cartStore'
import { useUserPricing } from '../hooks/useUserPricing'
import ProductGallery from '../components/product/ProductGallery'
import SimilarProducts from '../components/product/SimilarProducts'
import ProductSpecs from '../components/product/ProductSpecs'
import {
  getPerfumeById,
  getProductGallery,
  getSimilarPerfumes,
  getProductSpecs,
  getCategoryBreadcrumb,
} from '../utils/productUtils'
import { catalogLink } from '../utils/catalogLinks'

export default function ProductDetailPage() {
  const { id } = useParams()
  const product = getPerfumeById(id)
  const addItem = useCartStore((s) => s.addItem)
  const { getPrice, isMayorista, minQuantity } = useUserPricing()

  if (!product) {
    return <Navigate to="/catalogo" replace />
  }

  const gallery = getProductGallery(product)
  const similar = getSimilarPerfumes(product)
  const specs = getProductSpecs(product)
  const breadcrumb = getCategoryBreadcrumb(product)
  const categoryCatalogLink = catalogLink({ categories: [product.category] })

  const stock = 6 + (product.id % 20)
  const displayPrice = getPrice(product.price)

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex flex-wrap items-center gap-1 text-xs text-gray-500 sm:text-sm">
        <Link to="/" className="flex items-center hover:text-black">
          <Home className="h-4 w-4" />
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/catalogo" className="hover:text-black">Catálogo</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to={breadcrumb.sectionLink} className="hover:text-black">{breadcrumb.section}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="line-clamp-1 text-gray-700">{product.name}</span>
      </nav>

      {/* Detalle principal */}
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={gallery} name={product.name} />

        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-gray-500">{product.brand}</p>
          <h1 className="mt-2 text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
            {product.name}
          </h1>
          {product.productType === 'set' && (
            <span className="mt-2 inline-block rounded bg-gray-900 px-2 py-0.5 text-xs font-bold text-white">
              Set perfume + desodorante
            </span>
          )}

          <p className="mt-4 text-sm leading-relaxed text-gray-600">{product.description}</p>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">
                {isMayorista ? 'Precio mayorista (-10%)' : 'Precio Online'}
              </span>
              <div className="text-right">
                {isMayorista && (
                  <span className="mr-2 text-sm text-gray-400 line-through">
                    S/ {product.price.toFixed(2)}
                  </span>
                )}
                {!isMayorista && product.originalPrice && (
                  <span className="mr-2 text-sm text-gray-400 line-through">
                    S/ {product.originalPrice.toFixed(2)}
                  </span>
                )}
                <span className="text-2xl font-bold text-gray-900 sm:text-3xl">
                  S/ {displayPrice.toFixed(2)}
                </span>
                <span className="ml-1 text-sm text-gray-500">x Und</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => addItem(product)}
              className="btn-fill px-10 py-3.5 text-sm sm:text-base"
            >
              {isMayorista ? `Agregar (${minQuantity} und.)` : 'Agregar'}
            </button>
            <div className="text-sm text-gray-500">
              <p>{stock}+ unidades disponibles</p>
              {isMayorista && <p className="mt-0.5 text-gray-700">Mínimo {minQuantity} unidades por producto</p>}
            </div>
          </div>
        </div>
      </div>

      <SimilarProducts products={similar} categoryLink={categoryCatalogLink} />

      <ProductSpecs specs={specs} />
    </div>
  )
}
