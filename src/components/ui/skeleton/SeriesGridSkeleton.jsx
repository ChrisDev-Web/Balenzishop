import Skeleton from './Skeleton'

export default function SeriesGridSkeleton({ count = 4 }) {
  return (
    <section className="grid grid-cols-2" aria-busy="true" aria-label="Cargando series">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="relative block max-sm:h-[46vh] overflow-hidden sm:aspect-[2/1]"
        >
          <Skeleton className="h-full w-full rounded-none" />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"
            aria-hidden="true"
          />
          <Skeleton className="absolute bottom-5 left-1/2 h-6 w-24 -translate-x-1/2 sm:bottom-4 sm:w-28" />
        </div>
      ))}
    </section>
  )
}
