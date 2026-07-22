import Skeleton from './Skeleton'

export function ShowcaseProductCardSkeleton({ className = '', style, withBorder = false }) {
  return (
    <div
      style={style}
      className={`flex shrink-0 snap-start flex-col ${withBorder ? 'border-r border-gray-200' : ''} ${className}`}
      aria-hidden="true"
    >
      <div className="flex h-56 items-center justify-center bg-stone-50 p-5 sm:h-72 md:h-80">
        <Skeleton className="aspect-square h-full max-h-full w-full max-w-full rounded-none object-contain" />
      </div>
      <div className="flex flex-col items-center gap-2 px-3 py-4">
        <Skeleton className="h-3 w-[85%] max-w-[12rem]" />
        <Skeleton className="h-3 w-[65%] max-w-[9rem]" />
      </div>
    </div>
  )
}

export default function ProductCardSkeleton({ variant = 'catalog', className = '' }) {
  if (variant === 'showcase') {
    return <ShowcaseProductCardSkeleton className={className} />
  }

  return (
    <div
      className={`flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white ${className}`}
      aria-hidden="true"
    >
      <div className="relative aspect-square bg-gray-50 sm:aspect-[3/4]">
        <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-2 sm:p-2.5 md:p-4">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-auto h-5 w-1/2" />
        <Skeleton className="h-8 w-full rounded-md" />
      </div>
    </div>
  )
}
