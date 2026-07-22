import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { buildCatalogSearchParams, parseCatalogFilters } from '../utils/filterPerfumes'
import { useActiveCategories } from '../hooks/useActiveCategories'
import { useActiveBrands } from '../hooks/useActiveBrands'
import { useCatalogProducts } from '../hooks/useCatalogProducts'
import FilterSidebar from '../components/catalog/FilterSidebar'
import CatalogProductSearch from '../components/catalog/CatalogProductSearch'
import ProductCard from '../components/catalog/ProductCard'
import ProductGridSkeleton from '../components/catalog/ProductGridSkeleton'
import Pagination from '../components/catalog/Pagination'

const DEFAULT_MAX_PRICE = 500
const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 400

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
  const urlSearch = filters.search ?? ''
  const [searchDraft, setSearchDraft] = useState(urlSearch)

  useEffect(() => {
    setSearchDraft(urlSearch)
  }, [urlSearch])

  useEffect(() => {
    setPage(1)
  }, [filtersKey])

  const handleFilterChange = (newFilters) => {
    setPage(1)
    setSearchParams(buildCatalogSearchParams(newFilters))
  }

  useEffect(() => {
    const trimmed = searchDraft.trim()
    const current = urlSearch.trim()
    if (trimmed === current) return undefined

    const timer = window.setTimeout(() => {
      handleFilterChange({
        ...parseCatalogFilters(searchParams),
        search: trimmed || null,
      })
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [searchDraft, urlSearch, searchKey, searchParams, setSearchParams])

  const { items, meta, error, ready, isFetching } = useCatalogProducts(
    filters,
    page,
    PAGE_SIZE,
    filtersKey,
  )

  const totalItems = meta?.total
  const showSkeleton = !ready && items.length === 0
  const showEmpty = ready && items.length === 0

  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-5 min-[400px]:px-3 min-[400px]:py-6 md:px-4 md:py-10 lg:px-6">
      <h1 className="text-xl font-bold text-gray-900 min-[400px]:text-2xl md:text-3xl">Catálogo</h1>
      <p className="mt-1 text-sm text-gray-600 md:text-base">
        {totalItems != null
          ? `${totalItems} producto${totalItems !== 1 ? 's' : ''} disponible${totalItems !== 1 ? 's' : ''}`
          : '\u00A0'}
      </p>

      <div className="catalog-page__body mt-6 md:mt-8">
        <div className="catalog-page__sidebar">
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
        </div>

        <div className="catalog-page__results">
          <CatalogProductSearch value={searchDraft} onChange={setSearchDraft} />

          {error && (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          {showSkeleton ? (
            <ProductGridSkeleton count={8} />
          ) : showEmpty ? (
            <div className="flex min-h-[12rem] items-center justify-center px-4 py-8 lg:min-h-[32rem]">
              <p className="text-center text-sm text-gray-500">
                No se encontraron productos con los filtros seleccionados.
              </p>
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
