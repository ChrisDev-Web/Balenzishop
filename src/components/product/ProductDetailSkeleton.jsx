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

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
        <div className="aspect-square animate-pulse rounded-lg bg-gray-100 sm:aspect-[4/5] lg:aspect-square" />

        <div className="flex flex-col gap-4">
          <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
          <div className="h-8 w-full max-w-md animate-pulse rounded bg-gray-100" />
          <div className="h-8 w-3/4 max-w-sm animate-pulse rounded bg-gray-100" />

          <div className="mt-2 space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
              <div className="h-8 w-32 animate-pulse rounded bg-gray-100" />
            </div>
          </div>

          <div className="mt-6 h-12 w-40 animate-pulse rounded-lg bg-gray-100" />
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
