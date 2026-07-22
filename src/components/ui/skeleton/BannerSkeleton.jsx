import Skeleton from './Skeleton'

const COMPACT_IMAGE_SIZING =
  'block w-full max-md:h-[68vh] md:min-h-[72vh] md:max-h-[96vh] md:h-[85vh]'

const FESTIVE_MOBILE_SIZING = 'block w-full max-md:h-[74vh] md:min-h-[72vh] md:max-h-[96vh]'

const DEFAULT_SIZING = 'block w-full min-h-[50vh] md:min-h-[70vh]'

export default function BannerSkeleton({
  compactImage = false,
  festiveMobileLayout = false,
  showContentPlaceholders = true,
  className = '',
}) {
  const sizingClass = compactImage
    ? COMPACT_IMAGE_SIZING
    : festiveMobileLayout
      ? FESTIVE_MOBILE_SIZING
      : DEFAULT_SIZING

  const sectionClass = compactImage
    ? 'relative w-full max-md:bg-stone-200 md:bg-stone-200'
    : festiveMobileLayout
      ? 'relative w-full max-md:bg-stone-200'
      : 'relative w-full'

  return (
    <section className={`${sectionClass} ${className}`} aria-busy="true" aria-label="Cargando banner">
      <div className="relative w-full overflow-hidden">
        <Skeleton className={`${sizingClass} rounded-none`} />

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent md:from-black/50 md:via-black/15"
          aria-hidden="true"
        />

        {showContentPlaceholders && (
          <>
            <div className="pointer-events-none absolute inset-x-0 bottom-12 z-10 flex flex-col items-center gap-3.5 px-4 text-center sm:bottom-14 md:hidden">
              <Skeleton className="h-5 w-40 max-w-[70%] sm:h-6 sm:w-48" />
              <Skeleton className="h-9 w-28 sm:h-10 sm:w-32" />
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden w-full px-10 pb-16 lg:px-16 lg:pb-20 md:block">
              <Skeleton className="h-10 w-72 max-w-[85%] lg:h-12 lg:w-96" />
              <Skeleton className="mt-6 h-11 w-36" />
            </div>
          </>
        )}
      </div>
    </section>
  )
}
