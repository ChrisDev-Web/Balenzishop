import CategoryHeroBanner from '../components/promo/CategoryHeroBanner'
import ProductsShowcaseCarousel from '../components/promo/ProductsShowcaseCarousel'
import { perfumes } from '../data/perfumes'
import { promotionsSectionHeroes } from '../data/sectionHeroes'
import { catalogLink } from '../utils/catalogLinks'

export default function PromotionsPage() {
  const promoProducts = perfumes
    .filter((p) => p.onSale)
    .sort((a, b) => Number(b.recommended) - Number(a.recommended))

  const fallbackProducts = perfumes
    .filter((p) => p.recommended)
    .sort((a, b) => Number(b.onSale) - Number(a.onSale))

  const catalogHref = catalogLink({
    categories: ['mujeres', 'hombres', 'sets-mujeres', 'sets-hombres'],
  })

  return (
    <div className="-mt-[var(--navbar-height)]">
      {promotionsSectionHeroes.map((hero, index) => (
        <CategoryHeroBanner
          key={`${hero.backgroundImage}-${index}`}
          title={hero.title}
          backgroundImage={hero.backgroundImage}
          productId={hero.productId}
          raisedContent
          festiveMobileLayout
          enterAnimation={index === 0}
          mobileImagePositionClass={index === 0 ? 'max-md:object-[76%_36%]' : undefined}
        />
      ))}

      <ProductsShowcaseCarousel
        products={promoProducts.length ? promoProducts : fallbackProducts}
        catalogLink={catalogHref}
        title="Ofertas del momento"
      />
    </div>
  )
}
