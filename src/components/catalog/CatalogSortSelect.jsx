import { CATALOG_SORT_OPTIONS } from '../../utils/catalogSort.js'

export default function CatalogSortSelect({ value = '', onChange, disabled = false, className = '' }) {
  return (
    <div className={`catalog-sort-select flex shrink-0 items-center gap-2 ${className}`.trim()}>
      <label htmlFor="catalog-sort" className="whitespace-nowrap text-sm text-gray-600">
        Ordenar por:
      </label>
      <select
        id="catalog-sort"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full min-w-[10rem] rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none disabled:opacity-60 sm:min-w-[12rem]"
        aria-label="Ordenar por"
      >
        {CATALOG_SORT_OPTIONS.map((option) => (
          <option key={option.value || 'default'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
