import CategoryHeroBanner from '../components/promo/CategoryHeroBanner'
import CategorySeriesGrid from '../components/promo/CategorySeriesGrid'
import ProductsShowcaseCarousel from '../components/promo/ProductsShowcaseCarousel'
import { perfumes } from '../data/perfumes'
import { womenSeriesGrid, womenTopSectionHeroes } from '../data/sectionHeroes'
import { catalogLink } from '../utils/catalogLinks'

export default function WomenPage() {
  const womenProducts = perfumes
    .filter((p) => p.category === 'mujeres' || p.category === 'sets-mujeres')
    .sort((a, b) => Number(b.recommended) - Number(a.recommended) || Number(b.onSale) - Number(a.onSale))

  const catalogHref = catalogLink({ categories: ['mujeres', 'sets-mujeres'] })

  const seriesItems = womenSeriesGrid.map((item) => ({
    ...item,
    linkTo: catalogHref,
  }))

  return (
    <div className="-mt-[var(--navbar-height)]">
      {womenTopSectionHeroes.map((hero, index) => (
        <CategoryHeroBanner
          key={hero.productId}
          title={hero.title}
          backgroundImage={hero.backgroundImage}
          productId={hero.productId}
          compactImage
          enterAnimation={index === 0}
        />
      ))}

      <ProductsShowcaseCarousel products={womenProducts} catalogLink={catalogHref} />

      <CategorySeriesGrid items={seriesItems} />
    </div>
  )
}
