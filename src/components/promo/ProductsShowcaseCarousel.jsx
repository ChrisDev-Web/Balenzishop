import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { productLink } from '../../utils/productUtils'

const MAX_PRODUCTS = 8

function useItemsPerView() {
  const [count, setCount] = useState(2)

  useEffect(() => {
    const update = () => setCount(window.innerWidth >= 768 ? 4 : 2)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return count
}

function ShowcaseProductCard({ product, className = '', style }) {
  return (
    <Link
      to={productLink(product.id)}
      style={style}
      className={`flex shrink-0 snap-start flex-col ${className}`}
    >
      <div className="flex h-44 items-center justify-center bg-stone-50 p-5 sm:h-52 md:h-56">
        <img
          src={product.image}
          alt={product.name}
          className="max-h-full max-w-full object-contain"
          loading="lazy"
        />
      </div>
      <p className="line-clamp-2 px-3 py-4 text-center text-[10px] font-medium uppercase leading-snug tracking-[0.1em] text-gray-500 sm:text-xs">
        {product.name}
      </p>
    </Link>
  )
}

export default function ProductsShowcaseCarousel({ products, catalogLink, title = 'Productos' }) {
  const itemsPerView = useItemsPerView()
  const isMobile = itemsPerView === 2
  const [offset, setOffset] = useState(0)

  const showcaseProducts = products.slice(0, MAX_PRODUCTS)

  useEffect(() => {
    setOffset(0)
  }, [itemsPerView])

  if (!showcaseProducts.length) return null

  const maxOffset = Math.max(0, showcaseProducts.length - itemsPerView)
  const canPrev = offset > 0
  const canNext = offset < maxOffset

  const goPrev = () => setOffset((current) => Math.max(0, current - 1))
  const goNext = () => setOffset((current) => Math.min(maxOffset, current + 1))

  const trackWidthPercent = (showcaseProducts.length / itemsPerView) * 100
  const itemWidthPercent = 100 / showcaseProducts.length

  return (
    <section className="bg-white py-10 md:py-14">
      <h2 className="font-nav px-4 text-center text-base font-semibold uppercase tracking-[0.22em] text-gray-900 md:text-lg">
        {title}
      </h2>

      <div className="relative mt-8">
        {canPrev && (
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-2 top-[calc(50%-1.5rem)] z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-800 shadow-sm transition hover:border-gray-900 hover:bg-gray-900 hover:text-white sm:left-4 md:flex md:h-10 md:w-10"
            aria-label="Productos anteriores"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {canNext && (
          <button
            type="button"
            onClick={goNext}
            className="absolute right-2 top-[calc(50%-1.5rem)] z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-800 shadow-sm transition hover:border-gray-900 hover:bg-gray-900 hover:text-white sm:right-4 md:flex md:h-10 md:w-10"
            aria-label="Siguientes productos"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        <div
          className={`w-full border-y border-gray-200 ${
            isMobile
              ? 'overflow-x-auto overscroll-x-contain snap-x snap-mandatory touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
              : 'overflow-hidden'
          }`}
        >
          <div
            className={`flex ${isMobile ? '' : 'transition-transform duration-500 ease-out will-change-transform'}`}
            style={{
              width: `${trackWidthPercent}%`,
              transform: isMobile
                ? undefined
                : `translateX(-${(offset / showcaseProducts.length) * 100}%)`,
            }}
          >
            {showcaseProducts.map((product, index) => (
              <ShowcaseProductCard
                key={product.id}
                product={product}
                style={{ width: `${itemWidthPercent}%` }}
                className={index < showcaseProducts.length - 1 ? 'border-r border-gray-200' : ''}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center px-4">
        <Link
          to={catalogLink}
          className="inline-flex bg-black px-10 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-gray-900 sm:text-xs"
        >
          Ver catálogo
        </Link>
      </div>
    </section>
  )
}
