import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return (
    <nav className="mt-6 flex flex-wrap items-center justify-center gap-0.5 max-[399px]:gap-0 md:mt-8" aria-label="Paginación">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="px-2 text-gray-400">...</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`min-w-[32px] rounded-lg px-2 py-1.5 text-xs font-medium min-[400px]:min-w-[36px] min-[400px]:px-3 min-[400px]:text-sm ${
              p === currentPage
                ? 'bg-black text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </nav>
  )
}
