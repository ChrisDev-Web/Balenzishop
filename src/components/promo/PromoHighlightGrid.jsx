import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { filterProductLink } from '../../utils/productUtils'

export default function PromoHighlightGrid({ items }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <Link
          key={item.title}
          to={filterProductLink(item.filter)}
          className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md transition hover:shadow-lg"
        >
          <div className="flex h-52 items-center justify-center bg-gradient-to-b from-stone-50 to-stone-100 p-4 sm:h-60">
            <img
              src={item.image}
              alt={item.title}
              className="max-h-full max-w-full object-contain transition duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
          <div className="border-t border-gray-100 bg-gray-900 px-4 py-4 text-center">
            <h3 className="text-lg font-black uppercase tracking-wide text-white sm:text-xl">
              {item.title}
            </h3>
            {item.tagline && (
              <p className="mt-1 text-xs font-medium uppercase tracking-widest text-white/70">
                {item.tagline}
              </p>
            )}
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold uppercase text-brand-light opacity-80 group-hover:opacity-100">
              Ver producto <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
