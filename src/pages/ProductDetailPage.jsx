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
import { getCatalogPricePresentation, getPromoDiscountLabel, getDecantCartOptions, getMaxCartQuantity } from '../utils/pricing'
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
      availableMl: null,
    }
  }

  return {
    ...product,
    name: selectedDecant.name,
    image: selectedDecant.image || product.image,
    price: selectedDecant.price,
    basePrice: selectedDecant.basePrice,
    stock: selectedDecant.stock,
    idProductDecant: selectedDecant.idProductDecant,
    isDecant: true,
    decantSizeMl: selectedDecant.sizeMl,
    availableMl: selectedDecant.availableMl ?? product.decants?.[0]?.availableMl ?? null,
  }
}

function buildGalleryItems(product, showDecants) {
  const bottleImage = product.image
  if (!bottleImage && !showDecants) return []

  const items = [
    {
      id: 'bottle',
      image: bottleImage,
      decant: null,
      label: 'Frasco',
    },
  ]

  if (showDecants) {
    for (const decant of product.decants ?? []) {
      items.push({
        id: decant.idProductDecant,
        image: decant.image || bottleImage,
        decant,
        label: `${decant.sizeMl} ml`,
      })
    }
  }

  return items.filter((item) => item.image)
}

function resolveGalleryIndex(galleryItems, selectedDecant) {
  if (!selectedDecant) return 0

  const index = galleryItems.findIndex(
    (item) => item.decant?.idProductDecant === selectedDecant.idProductDecant,
  )

  return index >= 0 ? index : 0
}

function handleGallerySelection(item, setSelectedDecant) {
  setSelectedDecant(item.decant ?? null)
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
  const decantPoolMl = product.decants?.[0]?.availableMl ?? null
  const maxQuantity = getMaxCartQuantity(
    displayProduct.stock,
    role,
    isDecantView,
    isDecantView
      ? getDecantCartOptions(
          {
            ...displayProduct,
            availableMl: displayProduct.availableMl ?? decantPoolMl,
          },
          {
            items: cartItems,
            productId: id,
            excludeDecantId: displayProduct.idProductDecant ?? null,
          },
        )
      : null,
  )
  const canAddToCart = isDecantView
    ? Boolean(selectedDecant) && maxQuantity > 0 && (!cartItem || cartItem.quantity < maxQuantity)
    : maxQuantity > 0 && (!cartItem || cartItem.quantity < maxQuantity)

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
            onActiveChange={(_index, item) => handleGallerySelection(item, setSelectedDecant)}
            name={displayProduct.name}
            overlay={promoDiscountLabel ? <LiveDiscountBadge label={promoDiscountLabel} /> : null}
          />
        </div>

        <div className="product-detail__summary flex flex-col">
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
            <div className="mt-4">
              <DecantSizeSelector
                decants={product.decants ?? []}
                selectedId={selectedDecant?.idProductDecant ?? null}
                onSelect={setSelectedDecant}
              />
            </div>
          )}

          <div className="product-detail__pricing mt-8 space-y-4 border-t border-gray-200 pt-6">
            {!isDecantView && promoDiscountLabel && (
              <div className="flex flex-wrap items-center gap-2">
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
            {!isDecantView && (
              <p className={`text-sm font-bold ${displayProduct.stock > 0 ? 'text-black' : 'text-red-600'}`}>
                Stock disponible: {displayProduct.stock} unidades
              </p>
            )}
          </div>

          <div className="product-detail__actions mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={(event) => canAddToCart && addToCart(displayProduct, event)}
              disabled={!canAddToCart}
              className="btn-fill px-10 py-3.5 text-sm uppercase disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
            >
              {isMayorista ? `Agregar (${minQuantity} und.)` : 'Agregar'}
            </button>
            <ProductStarVote productId={product.id} onRated={scrollToReviews} />
          </div>
        </div>
      </div>

      <SimilarProducts products={product.similarProducts ?? []} categoryLink={categoryCatalogLink} />

      <ProductReviews productId={product.id} sectionRef={reviewsRef} />

      <ProductSpecs specs={product.specRows ?? []} description={product.fullDescription} />
    </div>
  )
}
