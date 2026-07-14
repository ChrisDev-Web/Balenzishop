import CategoryHeroBanner from '../components/promo/CategoryHeroBanner'
import CategorySeriesGrid from '../components/promo/CategorySeriesGrid'
import ProductsShowcaseCarousel from '../components/promo/ProductsShowcaseCarousel'
import { perfumes } from '../data/perfumes'
import { promotionsSeriesGrid, promotionsTopSectionHeroes } from '../data/sectionHeroes'
import { catalogLink } from '../utils/catalogLinks'

export default function PromotionsPage() {
  // Por ahora mismo enfoque que Mujeres: datos mock locales (sin endpoint de promociones)
  const promoProducts = perfumes
    .filter((p) => p.onSale || p.recommended)
    .sort((a, b) => Number(b.onSale) - Number(a.onSale) || Number(b.recommended) - Number(a.recommended))

  const catalogHref = catalogLink({
    categories: ['mujeres', 'hombres', 'sets-mujeres', 'sets-hombres'],
  })

  const seriesItems = promotionsSeriesGrid.map((item) => ({
    ...item,
    linkTo: catalogHref,
  }))

  return (
    <div className="-mt-[var(--navbar-height)]">
      {promotionsTopSectionHeroes.map((hero, index) => (
        <CategoryHeroBanner
          key={hero.backgroundImage}
          title={hero.title}
          backgroundImage={hero.backgroundImage}
          productId={hero.productId}
          compactImage
          enterAnimation={index === 0}
        />
      ))}

      <ProductsShowcaseCarousel
        products={promoProducts}
        catalogLink={catalogHref}
        title="Productos"
      />

      <CategorySeriesGrid items={seriesItems} />
    </div>
  )
}
