import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Home, ChevronRight } from 'lucide-react'
import { useCartStore } from '../stores/cartStore'
import { useUserPricing } from '../hooks/useUserPricing'
import { useAddToCart } from '../hooks/useAddToCart'
import { useProductDetail } from '../hooks/useProductDetail'
import ProductGallery from '../components/product/ProductGallery'
import ProductDetailSkeleton from '../components/product/ProductDetailSkeleton'
import SimilarProducts from '../components/product/SimilarProducts'
import ProductReviews from '../components/product/ProductReviews'
import ProductStarVote from '../components/product/ProductStarVote'
import ProductSpecs from '../components/product/ProductSpecs'
import DecantSizeSelector from '../components/product/DecantSizeSelector'
import { getCategoryBreadcrumbFromProduct } from '../utils/catalogProductMapper'
import { catalogLink } from '../utils/catalogLinks'
import { getCatalogPricePresentation, getPromoDiscountLabel, getMaxCartQuantity } from '../utils/pricing'
import CatalogPriceDisplay from '../components/product/CatalogPriceDisplay'
import DecantPriceDisplay from '../components/product/DecantPriceDisplay.jsx'
import LiveDiscountBadge from '../components/product/LiveDiscountBadge'

function buildDisplayProduct(product, selectedDecant) {
  if (!selectedDecant) {
    return {
      ...product,
      idProductDecant: null,
      isDecant: false,
      decantSizeMl: null,
    }
  }

  return {
    ...product,
    name: selectedDecant.name,
    image: selectedDecant.image || product.image,
    price: selectedDecant.price,
    basePrice: selectedDecant.basePrice,
    idProductDecant: selectedDecant.idProductDecant,
    isDecant: true,
    decantSizeMl: selectedDecant.sizeMl,
  }
}

function buildGalleryItems(product, showDecants) {
  const bottleImage = product.image
  const decantImage = product.decantImage || product.decants?.[0]?.image || null

  if (!bottleImage && !decantImage && !showDecants) return []

  const items = []

  if (bottleImage) {
    items.push({
      id: 'bottle',
      image: bottleImage,
      decant: null,
      label: 'Frasco',
    })
  }

  if (showDecants && decantImage) {
    items.push({
      id: 'decant',
      image: decantImage,
      decant: true,
      label: 'Decant',
    })
  }

  return items
}

function resolveGalleryIndex(galleryItems, selectedDecant) {
  if (!selectedDecant) {
    return 0
  }

  const index = galleryItems.findIndex((item) => item.id === 'decant')

  return index >= 0 ? index : 0
}

function handleGallerySelection(item, setSelectedDecant, productDecants) {
  if (item.id === 'decant') {
    setSelectedDecant((current) => current ?? productDecants?.[0] ?? null)
    return
  }

  setSelectedDecant(null)
}

function formatDetailStockLabel(stock) {
  const units = Math.max(0, Number(stock) || 0)

  if (units <= 0) {
    return { text: 'Sin stock', tone: 'out' }
  }

  if (units > 7) {
    return { text: 'EN STOCK', tone: 'in' }
  }

  return { text: `STOCK DISPONIBLE: ${units}`, tone: 'in' }
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const addToCart = useAddToCart()
  const { isMayorista, minQuantity, role } = useUserPricing()
  const { product, error, ready } = useProductDetail(id)
  const [selectedDecant, setSelectedDecant] = useState(null)
  const reviewsRef = useRef(null)

  const scrollToReviews = () => {
    reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const showDecants = Boolean(product?.hasDecants && !isMayorista)

  useEffect(() => {
    setSelectedDecant(null)
  }, [product?.id])

  const displayProduct = useMemo(
    () => (product ? buildDisplayProduct(product, showDecants ? selectedDecant : null) : null),
    [product, selectedDecant, showDecants],
  )

  const galleryItems = useMemo(
    () => (product ? buildGalleryItems(product, showDecants) : []),
    [product, showDecants],
  )

  const activeGalleryIndex = useMemo(
    () => resolveGalleryIndex(galleryItems, selectedDecant),
    [galleryItems, selectedDecant],
  )

  const galleryHeading = selectedDecant
    ? `DECANT - ${selectedDecant.sizeMl}ML`
    : null

  const cartItems = useCartStore((s) => s.items)

  const cartItem = cartItems.find(
    (item) =>
      String(item.id) === String(id)
      && (item.idProductDecant ?? null) === (displayProduct?.idProductDecant ?? null),
  )

  if (!ready && !product) {
    return <ProductDetailSkeleton />
  }

  if (error || !product || !displayProduct) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-sm text-gray-600">{error || 'Producto no encontrado.'}</p>
        <Link to="/catalogo" className="btn-fill mt-4 inline-block px-6 py-2 text-sm">
          Volver al catálogo
        </Link>
      </div>
    )
  }

  const breadcrumb = getCategoryBreadcrumbFromProduct(product)
  const categoryCatalogLink = catalogLink({ categories: [product.category] })
  const isDecantView = Boolean(displayProduct.isDecant)
  const pricePresentation = isDecantView ? null : getCatalogPricePresentation(displayProduct, role)
  const promoDiscountLabel = isDecantView ? null : getPromoDiscountLabel(displayProduct, role)
  const maxQuantity = getMaxCartQuantity(
    displayProduct.stock,
    role,
    isDecantView,
  )
  const canAddToCart = isDecantView
    ? Boolean(selectedDecant)
    : maxQuantity > 0 && (!cartItem || cartItem.quantity < maxQuantity)
  const stockLabel = !isDecantView ? formatDetailStockLabel(displayProduct.stock) : null

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
      <nav className="mb-6 flex flex-wrap items-center gap-1 text-xs text-gray-500 sm:text-sm">
        <Link to="/" className="flex items-center hover:text-black">
          <Home className="h-4 w-4" />
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/catalogo" className="hover:text-black">Catálogo</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to={breadcrumb.sectionLink} className="hover:text-black">{breadcrumb.section}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="line-clamp-1 text-gray-700">{displayProduct.name}</span>
      </nav>

      <div className="product-detail__hero grid gap-8 lg:items-start">
        <div className="product-detail__media">
          <ProductGallery
            items={galleryItems}
            activeIndex={activeGalleryIndex}
            onActiveChange={(_index, item) =>
              handleGallerySelection(item, setSelectedDecant, product.decants)
            }
            name={displayProduct.name}
            heading={galleryHeading}
            overlay={promoDiscountLabel ? <LiveDiscountBadge label={promoDiscountLabel} /> : null}
          />
        </div>

        <div className="product-detail__summary flex flex-col items-center text-center lg:items-start lg:text-left">
          <p className="product-detail__brand text-sm font-bold uppercase tracking-wider text-gray-500">
            {product.brand || '\u00A0'}
          </p>
          <h1 className="product-detail__title mt-2 text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
            {displayProduct.name}
          </h1>

          <p className="product-detail__subtitle mt-1.5 line-clamp-2 text-sm leading-snug text-gray-600">
            {product.shortDescription || product.description || '\u00A0'}
          </p>

          {showDecants && (
            <div className="mt-4 w-full">
              <DecantSizeSelector
                decants={product.decants ?? []}
                selectedId={selectedDecant?.idProductDecant ?? null}
                onSelect={(decant) => {
                  setSelectedDecant(decant)
                }}
                centered
              />
            </div>
          )}

          <div className="product-detail__pricing mt-8 w-full space-y-4 border-t border-gray-200 pt-6">
            {!isDecantView && promoDiscountLabel && (
              <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                <LiveDiscountBadge label={promoDiscountLabel} />
              </div>
            )}
            {isDecantView ? (
              <DecantPriceDisplay
                unitPrice={displayProduct.price}
                quantity={cartItem?.quantity ?? 1}
                variant="detail"
                showUnit
              />
            ) : (
              <CatalogPriceDisplay
                presentation={pricePresentation}
                variant="detail"
                showUnit
              />
            )}
            {stockLabel && (
              <p className={`text-sm font-bold ${stockLabel.tone === 'in' ? 'text-black' : 'text-red-600'}`}>
                {stockLabel.text}
              </p>
            )}
          </div>

          <div className="product-detail__actions mt-6 flex w-full flex-col items-center gap-0 lg:items-start">
            <button
              type="button"
              onClick={(event) => canAddToCart && addToCart(displayProduct, event)}
              disabled={!canAddToCart}
              className="btn-fill px-10 py-3.5 text-sm uppercase disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
            >
              {isMayorista ? `Agregar (${minQuantity} und.)` : 'Agregar'}
            </button>
            <ProductStarVote productId={product.id} onRated={scrollToReviews} centered />
          </div>
        </div>
      </div>

      <SimilarProducts products={product.similarProducts ?? []} categoryLink={categoryCatalogLink} />

      <ProductReviews productId={product.id} sectionRef={reviewsRef} />

      <ProductSpecs specs={product.specRows ?? []} description={product.fullDescription} />
    </div>
  )
}
