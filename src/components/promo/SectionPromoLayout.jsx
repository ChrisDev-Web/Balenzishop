import PromoCarousel from './PromoCarousel'
import PromoHeroBanner from './PromoHeroBanner'
import MostRequestedRow from './MostRequestedRow'
import PromoHighlightGrid from './PromoHighlightGrid'
import { perfumes } from '../../data/perfumes'
import { catalogLink } from '../../utils/catalogLinks'
import { filterProductLink } from '../../utils/productUtils'

export default function SectionPromoLayout({
  hero,
  carouselSlides,
  highlights,
  catalogCategories,
  extraCategories = [],
}) {
  const allCategories = [...catalogCategories, ...extraCategories]

  const mostRequested = perfumes
    .filter((p) => allCategories.includes(p.category))
    .sort((a, b) => Number(b.onSale) - Number(a.onSale) || Number(b.recommended) - Number(a.recommended))
    .slice(0, 4)

  const catalogHref = catalogLink({ categories: allCategories })
  const featuredProductLink = filterProductLink({ categories: allCategories })

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 lg:px-6 lg:py-8">
      <PromoHeroBanner
        title={hero.title}
        subtitle={hero.subtitle}
        image={hero.image}
        linkTo={featuredProductLink}
        linkLabel={hero.cta || 'Ver producto'}
      />

      <PromoCarousel slides={carouselSlides} />

      <MostRequestedRow products={mostRequested} catalogLink={catalogHref} />

      <PromoHighlightGrid items={highlights} />
    </div>
  )
}
