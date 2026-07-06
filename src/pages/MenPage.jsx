import CategoryHeroBanner from '../components/promo/CategoryHeroBanner'
import CategorySeriesGrid from '../components/promo/CategorySeriesGrid'
import ProductsShowcaseCarousel from '../components/promo/ProductsShowcaseCarousel'
import { perfumes } from '../data/perfumes'
import { menSeriesGrid, menTopSectionHeroes } from '../data/sectionHeroes'
import { catalogLink } from '../utils/catalogLinks'

export default function MenPage() {
  const menProducts = perfumes
    .filter((p) => p.category === 'hombres' || p.category === 'sets-hombres')
    .sort((a, b) => Number(b.recommended) - Number(a.recommended) || Number(b.onSale) - Number(a.onSale))

  const catalogHref = catalogLink({ categories: ['hombres', 'sets-hombres'] })

  const seriesItems = menSeriesGrid.map((item) => ({
    ...item,
    linkTo: catalogHref,
  }))

  return (
    <div className="-mt-[var(--navbar-height)]">
      {menTopSectionHeroes.map((hero, index) => (
        <CategoryHeroBanner
          key={hero.productId}
          title={hero.title}
          backgroundImage={hero.backgroundImage}
          productId={hero.productId}
          compactImage
          enterAnimation={index === 0}
        />
      ))}

      <ProductsShowcaseCarousel products={menProducts} catalogLink={catalogHref} />

      <CategorySeriesGrid items={seriesItems} />
    </div>
  )
}
