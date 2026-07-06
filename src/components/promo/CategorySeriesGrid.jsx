import { Link } from 'react-router-dom'

export default function CategorySeriesGrid({ items }) {
  if (!items.length) return null

  return (
    <section className="grid grid-cols-2">
      {items.map((item) => (
        <Link
          key={item.title}
          to={item.linkTo}
          className="group relative block max-sm:h-[46vh] overflow-hidden sm:aspect-[2/1]"
        >
          <img
            src={item.image}
            alt={item.title}
            className={`h-full w-full object-cover transition duration-500 group-hover:scale-[1.03] ${
              item.imagePositionClass ?? 'object-center'
            }`}
            style={item.imagePosition ? { objectPosition: item.imagePosition } : undefined}
            loading="lazy"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent sm:from-black/55"
            aria-hidden="true"
          />
          <span className="absolute bottom-5 left-1/2 inline-block w-auto max-w-[calc(100%-1.25rem)] -translate-x-1/2 whitespace-nowrap border border-white bg-black/20 px-2.5 py-1 text-[7px] font-medium uppercase tracking-[0.14em] text-white transition group-hover:bg-white group-hover:text-black sm:bottom-4 sm:max-w-none sm:px-3 sm:py-1.5 sm:text-[9px] md:text-[10px]">
            {item.title}
          </span>
        </Link>
      ))}
    </section>
  )
}
