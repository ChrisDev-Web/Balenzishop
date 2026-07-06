import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function PromoHeroBanner({ title, subtitle, image, linkTo, linkLabel = 'Ver catálogo' }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
      <div className="flex flex-col md:flex-row">
        {/* Imagen completa */}
        <div className="flex min-h-[300px] flex-1 items-center justify-center bg-gradient-to-br from-stone-50 to-stone-200 p-8 sm:min-h-[360px] md:min-h-[400px]">
          <img
            src={image}
            alt={title}
            className="max-h-[260px] w-full object-contain sm:max-h-[320px] md:max-h-[360px]"
          />
        </div>

        {/* Título + CTA */}
        <div className="flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-6 py-10 text-center md:w-[340px] md:shrink-0 lg:w-[380px]">
          <h1 className="text-4xl font-black uppercase tracking-wider text-white sm:text-5xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.15em] text-white/80 sm:text-sm">
              {subtitle}
            </p>
          )}
          <Link
            to={linkTo}
            className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-white px-6 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-white hover:text-gray-900 sm:text-sm"
          >
            {linkLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
