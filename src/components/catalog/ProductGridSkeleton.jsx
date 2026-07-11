const SKELETON_COUNT = 8

function ProductCardSkeleton() {
  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="aspect-square animate-pulse bg-gray-100 sm:aspect-[3/4]" />
      <div className="flex flex-1 flex-col gap-2 p-2 sm:p-2.5 md:p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
        <div className="mt-auto h-5 w-1/2 animate-pulse rounded bg-gray-100" />
        <div className="h-8 w-full animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  )
}

export default function ProductGridSkeleton({ count = SKELETON_COUNT }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  )
}
