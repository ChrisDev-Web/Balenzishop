import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { buildCatalogSearchParams, parseCatalogFilters } from '../utils/filterPerfumes'
import { useActiveCategories } from '../hooks/useActiveCategories'
import { useActiveBrands } from '../hooks/useActiveBrands'
import { useCatalogProducts } from '../hooks/useCatalogProducts'
import FilterSidebar from '../components/catalog/FilterSidebar'
import ProductCard from '../components/catalog/ProductCard'
import ProductGridSkeleton from '../components/catalog/ProductGridSkeleton'
import Pagination from '../components/catalog/Pagination'

const DEFAULT_MAX_PRICE = 500
const PAGE_SIZE = 20

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const {
    categories,
    ready: categoriesReady,
    error: categoriesError,
    refetch: refetchCategories,
  } = useActiveCategories()
  const {
    brands,
    ready: brandsReady,
    error: brandsError,
    refetch: refetchBrands,
  } = useActiveBrands()

  const searchKey = searchParams.toString()
  const filters = useMemo(() => parseCatalogFilters(searchParams), [searchKey])
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters])
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [filtersKey])

  const { items, meta, error, ready, isFetching } = useCatalogProducts(
    filters,
    page,
    PAGE_SIZE,
    filtersKey,
  )

  const handleFilterChange = (newFilters) => {
    setPage(1)
    setSearchParams(buildCatalogSearchParams(newFilters))
  }

  const totalItems = meta?.total
  const showSkeleton = !ready && items.length === 0
  const showEmpty = ready && items.length === 0

  return (
    <div className="mx-auto max-w-7xl px-3 py-5 min-[400px]:px-3 min-[400px]:py-6 md:px-4 md:py-10 lg:px-6">
      <h1 className="text-xl font-bold text-gray-900 min-[400px]:text-2xl md:text-3xl">Catálogo</h1>
      <p className="mt-1 text-sm text-gray-600 md:text-base">
        {totalItems != null
          ? `${totalItems} producto${totalItems !== 1 ? 's' : ''} disponible${totalItems !== 1 ? 's' : ''}`
          : '\u00A0'}
      </p>

      <div className="mt-6 flex flex-col gap-6 md:mt-8 md:gap-8 lg:flex-row">
        <FilterSidebar
          filters={filters}
          onChange={handleFilterChange}
          maxPrice={DEFAULT_MAX_PRICE}
          categories={categories}
          categoriesReady={categoriesReady}
          categoriesError={categoriesError}
          onCategoriesRefresh={refetchCategories}
          brands={brands}
          brandsReady={brandsReady}
          brandsError={brandsError}
          onBrandsRefresh={refetchBrands}
        />

        <div className="min-w-0 flex-1">
          {error && (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          {showSkeleton ? (
            <ProductGridSkeleton count={8} />
          ) : showEmpty ? (
            <div className="py-16 text-center text-sm text-gray-500 md:py-20">
              No se encontraron productos con los filtros seleccionados.
            </div>
          ) : (
            <>
              <div
                className={`grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-4 transition-opacity duration-200 ${
                  isFetching ? 'opacity-60' : 'opacity-100'
                }`}
              >
                {items.map((product) => (
                  <ProductCard key={product.id} perfume={product} />
                ))}
              </div>

              <Pagination
                currentPage={meta?.current_page ?? page}
                totalPages={meta?.last_page ?? 1}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
