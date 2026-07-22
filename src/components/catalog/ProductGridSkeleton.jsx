import ProductCardSkeleton from '../ui/skeleton/ProductCardSkeleton'

const SKELETON_COUNT = 8

export default function ProductGridSkeleton({ count = SKELETON_COUNT }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} variant="catalog" />
      ))}
    </div>
  )
}
