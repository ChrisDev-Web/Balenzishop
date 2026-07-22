export default function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
      <nav className="mb-6 flex flex-wrap items-center gap-2">
        <div className="h-4 w-4 animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-3 animate-pulse rounded-full bg-gray-100" />
        <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-3 animate-pulse rounded-full bg-gray-100" />
        <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-3 animate-pulse rounded-full bg-gray-100" />
        <div className="h-4 w-40 animate-pulse rounded bg-gray-100" />
      </nav>

      <div className="product-detail__hero grid gap-8 md:items-start">
        <div className="product-detail__media">
          <div className="product-gallery__stage animate-pulse" aria-hidden>
            <div className="product-gallery__frame">
              <div className="product-gallery__image product-gallery__image--empty" />
            </div>
          </div>
        </div>

        <div className="product-detail__summary flex flex-col gap-4">
          <div className="product-detail__brand h-5 w-24 animate-pulse rounded bg-gray-100" />
          <div className="product-detail__title h-16 w-full max-w-md animate-pulse rounded bg-gray-100 sm:h-[4.5rem]" />
          <div className="product-detail__subtitle h-10 w-full max-w-sm animate-pulse rounded bg-gray-100" />

          <div className="product-detail__pricing mt-4 space-y-4 border-t border-gray-200 pt-6">
            <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
            <div className="h-8 w-36 animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-44 animate-pulse rounded bg-gray-100" />
          </div>

          <div className="product-detail__actions h-14 w-40 animate-pulse rounded-lg bg-gray-100" />
        </div>
      </div>

      <section className="mt-16 border-t border-gray-200 pt-10">
        <div className="mx-auto h-7 w-48 animate-pulse rounded bg-gray-100" />
        <div className="mx-auto mt-8 max-w-3xl space-y-4">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="flex justify-between gap-4 border-b border-gray-100 py-4">
              <div className="h-4 w-1/3 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
