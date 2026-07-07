import { ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { aromaOptions } from '../../data/perfumes'

const sections = [
  { key: 'category', label: 'Categoría' },
  { key: 'brand', label: 'Marcas' },
  { key: 'price', label: 'Precio' },
  { key: 'recommendations', label: 'Recomendaciones' },
]

const defaultOpen = {
  category: false,
  brand: false,
  price: false,
  recommendations: false,
}

function countActiveFilters(filters) {
  let n = 0
  if (filters.categories?.length) n += filters.categories.length
  if (filters.brands?.length) n += filters.brands.length
  if (filters.minPrice != null) n += 1
  if (filters.maxPrice != null) n += 1
  if (filters.aroma) n += 1
  if (filters.recommended) n += 1
  return n
}

export default function FilterSidebar({
  filters,
  onChange,
  maxPrice,
  categories = [],
  categoriesReady = false,
  categoriesError = null,
  onCategoriesRefresh,
  brands = [],
  brandsReady = false,
  brandsError = null,
  onBrandsRefresh,
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggle = (key) => {
    setOpen((prev) => {
      const willOpen = !prev[key]
      if (willOpen && key === 'category') onCategoriesRefresh?.()
      if (willOpen && key === 'brand') onBrandsRefresh?.()
      return { ...prev, [key]: willOpen }
    })
  }

  const toggleInList = (listKey, value) => {
    const current = filters[listKey] || []
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value]
    onChange({ ...filters, [listKey]: next.length ? next : null })
  }

  const handlePriceChange = (field, value) => {
    const num = value === '' ? null : Number(value)
    onChange({ ...filters, [field]: num })
  }

  const handleRange = (e) => {
    onChange({ ...filters, maxPrice: Number(e.target.value) })
  }

  const selectedCategories = filters.categories || []
  const selectedBrands = filters.brands || []
  const activeCount = countActiveFilters(filters)

  const filterPanel = (
    <>
      {(selectedCategories.length > 0 || selectedBrands.length > 0) && (
        <p className="mb-3 text-xs text-gray-500">
          {selectedCategories.length > 0 && `${selectedCategories.length} categoría(s)`}
          {selectedCategories.length > 0 && selectedBrands.length > 0 && ' · '}
          {selectedBrands.length > 0 && `${selectedBrands.length} marca(s)`}
        </p>
      )}

      {sections.map(({ key, label }) => (
        <div key={key} className="border-b border-gray-100 py-3 last:border-0">
          <button
            type="button"
            onClick={() => toggle(key)}
            className="flex w-full items-center justify-between text-sm font-semibold text-gray-800"
          >
            {label}
            {open[key] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {open[key] && key === 'category' && (
            <div className="mt-3">
              {categoriesError && (
                <p className="text-sm text-red-600">{categoriesError}</p>
              )}
              {!categoriesError && categoriesReady && categories.length === 0 && (
                <p className="text-sm text-gray-500">No hay categorías disponibles.</p>
              )}
              {categories.length > 0 && (
                <ul className="space-y-2">
                  {categories.map((cat) => (
                    <li key={cat.value}>
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(cat.value)}
                          onChange={() => toggleInList('categories', cat.value)}
                          className="accent-gray-900"
                        />
                        {cat.label}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {open[key] && key === 'brand' && (
            <div className="mt-3">
              {brandsError && (
                <p className="text-sm text-red-600">{brandsError}</p>
              )}
              {!brandsError && brandsReady && brands.length === 0 && (
                <p className="text-sm text-gray-500">No hay marcas disponibles.</p>
              )}
              {brands.length > 0 && (
                <ul className="max-h-48 space-y-2 overflow-y-auto">
                  {brands.map((brand) => (
                    <li key={brand.value}>
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand.value)}
                          onChange={() => toggleInList('brands', brand.value)}
                          className="accent-gray-900"
                        />
                        {brand.label}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {open[key] && key === 'price' && (
            <div className="mt-3 space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Mínimo</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={filters.minPrice ?? ''}
                    onChange={(e) => handlePriceChange('minPrice', e.target.value)}
                    className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-gray-900 focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Máximo</label>
                  <input
                    type="number"
                    min={0}
                    placeholder={String(maxPrice)}
                    value={filters.maxPrice ?? ''}
                    onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
                    className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-gray-900 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">
                  Hasta S/ {filters.maxPrice ?? maxPrice}
                </label>
                <input
                  type="range"
                  min={0}
                  max={maxPrice}
                  step={5}
                  value={filters.maxPrice ?? maxPrice}
                  onChange={handleRange}
                  className="mt-1 w-full accent-gray-900"
                />
              </div>
            </div>
          )}

          {open[key] && key === 'recommendations' && (
            <div className="mt-3 space-y-3">
              <input
                type="text"
                placeholder="Ej: aroma suave, floral, amaderado..."
                value={filters.aroma || ''}
                onChange={(e) => onChange({ ...filters, aroma: e.target.value || null })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              />
              <div className="flex flex-wrap gap-1.5">
                {aromaOptions.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => onChange({ ...filters, aroma: filters.aroma === a ? null : a })}
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      filters.aroma === a
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={!!filters.recommended}
                  onChange={(e) => onChange({ ...filters, recommended: e.target.checked || null })}
                  className="accent-gray-900"
                />
                Solo recomendados
              </label>
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange({})}
        className="btn-fill mt-4 w-full px-4 py-2 text-xs"
      >
        Limpiar filtros
      </button>
    </>
  )

  return (
    <aside className="w-full shrink-0 lg:w-64">
      <button
        type="button"
        onClick={() => setMobileOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-left shadow-sm lg:hidden"
        aria-expanded={mobileOpen}
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-gray-900" />
          <span className="font-semibold text-gray-900">Filtros</span>
          {activeCount > 0 && (
            <span className="rounded-full bg-black px-2 py-0.5 text-xs font-medium text-white">
              {activeCount}
            </span>
          )}
        </span>
        {mobileOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>

      <div
        className={`mt-2 rounded-lg border border-gray-200 bg-white p-4 lg:hidden ${
          mobileOpen ? 'block' : 'hidden'
        }`}
      >
        {filterPanel}
      </div>

      <div className="hidden rounded-lg border border-gray-200 bg-white p-4 lg:block">
        <h2 className="mb-4 text-lg font-bold text-gray-900">Filtros</h2>
        {filterPanel}
      </div>
    </aside>
  )
}
