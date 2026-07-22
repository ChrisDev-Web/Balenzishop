import { Search } from 'lucide-react'

export default function CatalogProductSearch({ value, onChange, disabled = false }) {
  return (
    <div className="relative mb-4 md:mb-5">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        aria-hidden
      />
      <input
        type="search"
        enterKeyHint="search"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar por nombre de producto…"
        className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-gray-900 focus:outline-none disabled:opacity-60"
        aria-label="Buscar por nombre de producto"
      />
    </div>
  )
}
