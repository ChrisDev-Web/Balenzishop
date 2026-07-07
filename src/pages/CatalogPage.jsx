import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { buildCatalogSearchParams, parseCatalogFilters } from '../utils/filterPerfumes'
import { useActiveCategories } from '../hooks/useActiveCategories'
import { useActiveBrands } from '../hooks/useActiveBrands'
import FilterSidebar from '../components/catalog/FilterSidebar'

const DEFAULT_MAX_PRICE = 500

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

  const filters = useMemo(() => parseCatalogFilters(searchParams), [searchParams])

  const handleFilterChange = (newFilters) => {
    setSearchParams(buildCatalogSearchParams(newFilters))
  }

  const totalItems = 0

  return (
    <div className="mx-auto max-w-7xl px-3 py-5 min-[400px]:px-3 min-[400px]:py-6 md:px-4 md:py-10 lg:px-6">
      <h1 className="text-xl font-bold text-gray-900 min-[400px]:text-2xl md:text-3xl">Catálogo</h1>
      <p className="mt-1 text-sm text-gray-600 md:text-base">
        {totalItems} producto{totalItems !== 1 ? 's' : ''} disponible{totalItems !== 1 ? 's' : ''}
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
          <div className="py-16 text-center text-sm text-gray-500 md:py-20">
            No se encontraron productos con los filtros seleccionados.
          </div>
        </div>
      </div>
    </div>
  )
}
