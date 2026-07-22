import CategoryHeroBanner from '../components/promo/CategoryHeroBanner'
import CategorySeriesGrid from '../components/promo/CategorySeriesGrid'
import ProductsShowcaseCarousel from '../components/promo/ProductsShowcaseCarousel'
import BannerSkeleton from '../components/ui/skeleton/BannerSkeleton'
import SeriesGridSkeleton from '../components/ui/skeleton/SeriesGridSkeleton'
import { useShopPageSection } from '../hooks/useShopPageSection'
import { useSectionShowcaseProducts } from '../hooks/useSectionShowcaseProducts'
import { perfumes } from '../data/perfumes'
import { useMemo } from 'react'

const SECTIONS_WITH_API_PRODUCTS = new Set(['mujeres', 'hombres', 'promociones'])

const INITIAL_HERO_SKELETONS = 2

export default function SectionStorefrontPage({
  section,
  catalogHref: catalogHrefOverride,
  filterProducts,
}) {
  const { heroBanners, seriesItems, ready: bannersReady, error: bannersError } =
    useShopPageSection(section)

  const usesApiProducts = SECTIONS_WITH_API_PRODUCTS.has(section)

  const {
    products: apiProducts,
    catalogHref: apiCatalogHref,
    ready: productsReady,
    error: productsError,
  } = useSectionShowcaseProducts(section)

  const mockProducts = useMemo(() => {
    if (!filterProducts) return []

    return perfumes
      .filter(filterProducts)
      .sort(
        (a, b) =>
          Number(b.recommended) - Number(a.recommended) || Number(b.onSale) - Number(a.onSale),
      )
  }, [filterProducts])

  const products = usesApiProducts ? apiProducts : mockProducts
  const catalogHref = usesApiProducts ? apiCatalogHref : catalogHrefOverride ?? '/catalogo'
  const showcaseLoading = usesApiProducts && !productsReady

  return (
    <div className="-mt-[var(--navbar-height)]">
      {!bannersReady ? (
        <>
          {Array.from({ length: INITIAL_HERO_SKELETONS }, (_, index) => (
            <BannerSkeleton key={`hero-skeleton-${index}`} compactImage />
          ))}
        </>
      ) : (
        <>
          {bannersError && (
            <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
              {bannersError}
            </div>
          )}

          {heroBanners.map((hero, index) => (
            <CategoryHeroBanner
              key={hero.id}
              title={hero.title}
              backgroundImage={hero.backgroundImage}
              productId={hero.productId}
              linkTo={hero.linkTo}
              compactImage
              enterAnimation={index === 0}
              priority={index === 0}
            />
          ))}
        </>
      )}

      {productsError && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
          {productsError}
        </div>
      )}

      <ProductsShowcaseCarousel
        products={products}
        catalogLink={catalogHref}
        loading={showcaseLoading}
      />

      {!bannersReady ? <SeriesGridSkeleton /> : <CategorySeriesGrid items={seriesItems} />}
    </div>
  )
}
