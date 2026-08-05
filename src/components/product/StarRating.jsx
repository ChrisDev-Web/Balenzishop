import { Star } from 'lucide-react'

export default function StarRating({
  value = 0,
  onChange = null,
  size = 22,
  className = '',
  label = 'Calificación',
}) {
  const interactive = typeof onChange === 'function'

  return (
    <div
      className={`inline-flex items-center gap-0.5 ${className}`}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={interactive ? label : `${label}: ${value} de 5`}
    >
      {[1, 2, 3, 4, 5].map((starValue) => {
        const filled = starValue <= value

        if (interactive) {
          return (
            <button
              key={starValue}
              type="button"
              role="radio"
              aria-checked={starValue === value}
              aria-label={`${starValue} estrella${starValue === 1 ? '' : 's'}`}
              onClick={() => onChange(starValue)}
              className="rounded p-0.5 text-amber-400 transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
            >
              <Star size={size} fill={filled ? 'currentColor' : 'none'} strokeWidth={1.5} />
            </button>
          )
        }

        return (
          <Star
            key={starValue}
            size={size}
            className="text-amber-400"
            fill={filled ? 'currentColor' : 'none'}
            strokeWidth={1.5}
            aria-hidden
          />
        )
      })}
    </div>
  )
}
