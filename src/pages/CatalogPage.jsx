import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { perfumes } from '../data/perfumes'
import { filterPerfumes, paginate, buildCatalogSearchParams, parseCatalogFilters } from '../utils/filterPerfumes'
import { useCatalogPerPage, CATALOG_ROWS, CATALOG_GRID_CLASS } from '../hooks/useCatalogPerPage'
import FilterSidebar from '../components/catalog/FilterSidebar'
import ProductCard from '../components/catalog/ProductCard'
import Pagination from '../components/catalog/Pagination'

const maxPrice = Math.max(...perfumes.map((p) => p.price))

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const perPage = useCatalogPerPage()

  const filters = useMemo(() => parseCatalogFilters(searchParams), [searchParams])

  const handleFilterChange = (newFilters) => {
    setSearchParams(buildCatalogSearchParams(newFilters))
    setPage(1)
  }

  const filtered = useMemo(() => filterPerfumes(perfumes, filters), [filters])
  const { items, currentPage, totalPages, totalItems } = paginate(filtered, page, perPage)

  useEffect(() => {
    setPage(1)
  }, [searchParams])

  useEffect(() => {
    if (page > totalPages) setPage(Math.max(1, totalPages))
  }, [page, totalPages, perPage])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [page])

  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * perPage + 1
  const rangeEnd = Math.min(currentPage * perPage, totalItems)

  return (
    <div className="mx-auto max-w-7xl px-3 py-5 min-[400px]:px-3 min-[400px]:py-6 md:px-4 md:py-10 lg:px-6">
      <h1 className="text-xl font-bold text-gray-900 min-[400px]:text-2xl md:text-3xl">Catálogo</h1>
      <p className="mt-1 text-sm text-gray-600 md:text-base">
        {totalItems} producto{totalItems !== 1 ? 's' : ''} disponible{totalItems !== 1 ? 's' : ''}
        {totalItems > 0 && (
          <span className="text-gray-400"> · {CATALOG_ROWS} filas por página</span>
        )}
      </p>

      <div className="mt-6 flex flex-col gap-6 md:mt-8 md:gap-8 lg:flex-row">
        <FilterSidebar
          filters={filters}
          onChange={handleFilterChange}
          maxPrice={Math.ceil(maxPrice)}
        />

        <div className="min-w-0 flex-1">
          {totalItems > 0 && (
            <p className="mb-3 text-xs text-gray-500 md:text-sm">
              Mostrando {rangeStart}–{rangeEnd} de {totalItems}
            </p>
          )}

          <div className={`grid gap-2 ${CATALOG_GRID_CLASS} sm:gap-3 md:gap-4 xl:gap-5`}>
            {items.map((p) => (
              <ProductCard key={p.id} perfume={p} />
            ))}
          </div>

          {items.length === 0 && (
            <div className="py-16 text-center text-sm text-gray-500 md:py-20">
              No se encontraron productos con los filtros seleccionados.
            </div>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  )
}
