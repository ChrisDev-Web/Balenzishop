import { Link, useParams } from 'react-router-dom'
import { Home, ChevronRight } from 'lucide-react'
import { useCartStore } from '../stores/cartStore'
import { useUserPricing } from '../hooks/useUserPricing'
import { useProductDetail } from '../hooks/useProductDetail'
import ProductGallery from '../components/product/ProductGallery'
import ProductDetailSkeleton from '../components/product/ProductDetailSkeleton'
import SimilarProducts from '../components/product/SimilarProducts'
import ProductSpecs from '../components/product/ProductSpecs'
import { getCategoryBreadcrumbFromProduct } from '../utils/catalogProductMapper'
import { catalogLink } from '../utils/catalogLinks'
import { getCatalogDisplayPrices, getMaxCartQuantity } from '../utils/pricing'

export default function ProductDetailPage() {
  const { id } = useParams()
  const addItem = useCartStore((s) => s.addItem)
  const cartItem = useCartStore((s) => s.items.find((item) => item.id === id))
  const { isMayorista, minQuantity, role } = useUserPricing()
  const { product, error, ready, isFetching } = useProductDetail(id)

  if (!ready && !product) {
    return <ProductDetailSkeleton />
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-sm text-gray-600">{error || 'Producto no encontrado.'}</p>
        <Link to="/catalogo" className="btn-fill mt-4 inline-block px-6 py-2 text-sm">
          Volver al catálogo
        </Link>
      </div>
    )
  }

  const gallery = product.image ? [product.image] : []
  const breadcrumb = getCategoryBreadcrumbFromProduct(product)
  const categoryCatalogLink = catalogLink({ categories: [product.category] })
  const { displayPrice, strikePrice } = getCatalogDisplayPrices(product, role)
  const maxQuantity = getMaxCartQuantity(product.stock, role)
  const canAddToCart = maxQuantity > 0 && (!cartItem || cartItem.quantity < maxQuantity)

  return (
    <div
      className={`mx-auto max-w-7xl px-4 py-6 transition-opacity duration-200 lg:px-6 lg:py-8 ${
        isFetching ? 'opacity-60' : 'opacity-100'
      }`}
    >
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

      <div className="product-detail__hero grid gap-8 md:items-start">
        <div className="product-detail__media">
          <ProductGallery images={gallery} name={product.name} />
        </div>

        <div className="product-detail__summary flex flex-col">
          <p className="product-detail__brand text-sm font-bold uppercase tracking-wider text-gray-500">
            {product.brand || '\u00A0'}
          </p>
          <h1 className="product-detail__title mt-2 text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
            {product.name}
          </h1>

          <p className="product-detail__subtitle mt-4 line-clamp-2 text-sm leading-relaxed text-gray-600">
            {product.shortDescription || product.description || '\u00A0'}
          </p>

          <div className="product-detail__pricing mt-8 space-y-4 border-t border-gray-200 pt-6">
            <p className="text-sm font-semibold text-gray-900">
              {isMayorista ? 'Precio mayorista' : 'Precio Online'}
            </p>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              {strikePrice != null && (
                <span className="text-sm text-gray-400 line-through">
                  S/ {strikePrice.toFixed(2)}
                </span>
              )}
              <span className="text-2xl font-bold text-gray-900 sm:text-3xl">
                S/ {displayPrice.toFixed(2)}
              </span>
              <span className="text-sm text-gray-500">x Und</span>
            </div>
            <p className={`text-sm font-medium ${product.stock > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
              Stock disponible: {product.stock} unidades
            </p>
          </div>

          <div className="product-detail__actions mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => canAddToCart && addItem(product)}
              disabled={!canAddToCart}
              className="btn-fill px-10 py-3.5 text-sm uppercase disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
            >
              {isMayorista ? `Agregar (${minQuantity} und.)` : 'Agregar'}
            </button>
          </div>
        </div>
      </div>

      <SimilarProducts products={product.similarProducts} categoryLink={categoryCatalogLink} />

      <ProductSpecs specs={product.specRows} description={product.fullDescription} />
    </div>
  )
}
