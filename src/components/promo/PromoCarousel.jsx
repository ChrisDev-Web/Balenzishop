import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { filterProductLink } from '../../utils/productUtils'

export default function PromoCarousel({ slides, autoPlayMs = 5500 }) {
  const [index, setIndex] = useState(0)
  const slide = slides[index]

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % slides.length)
  }, [slides.length])

  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length)

  useEffect(() => {
    if (slides.length <= 1) return undefined
    const timer = setInterval(next, autoPlayMs)
    return () => clearInterval(timer)
  }, [next, autoPlayMs, slides.length])

  if (!slide) return null

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
      <div className="flex min-h-[420px] flex-col md:min-h-[460px] md:flex-row">
        {/* Texto */}
        <div className="flex flex-1 flex-col justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-6 sm:p-8 md:max-w-md lg:max-w-lg lg:p-10">
          {slide.badge && (
            <span className="mb-3 inline-block w-fit rounded-full bg-brand px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
              {slide.badge}
            </span>
          )}
          {slide.eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70 sm:text-sm">
              {slide.eyebrow}
            </p>
          )}
          <h2 className="mt-1 text-2xl font-black uppercase leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
            {slide.title}
          </h2>
          {slide.subtitle && (
            <p className="mt-2 text-lg font-bold uppercase text-white/90 sm:text-xl">
              {slide.subtitle}
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {slide.price && (
              <div className="flex items-baseline gap-2">
                {slide.originalPrice && (
                  <span className="text-sm text-white/50 line-through">{slide.originalPrice}</span>
                )}
                <span className="text-2xl font-black text-white">{slide.price}</span>
              </div>
            )}
              <Link
                to={filterProductLink(slide.filter)}
                className="rounded-full bg-brand px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-brand-dark sm:text-sm"
              >
              {slide.cta || 'Ver producto'}
            </Link>
          </div>
        </div>

        {/* Imagen completa */}
        <div className="relative flex flex-1 items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 p-6 sm:p-8 md:min-h-[460px]">
          <img
            src={slide.image}
            alt={slide.title}
            className="max-h-[280px] w-full object-contain sm:max-h-[340px] md:max-h-[400px]"
          />
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-800 shadow transition hover:bg-white sm:left-4"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-800 shadow transition hover:bg-white sm:right-4"
            aria-label="Siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 md:left-[25%]">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index ? 'w-8 bg-brand' : 'w-2 bg-gray-400 hover:bg-gray-600'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
