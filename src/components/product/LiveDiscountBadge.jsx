export default function LiveDiscountBadge({ label, className = '' }) {
  if (!label) return null

  return (
    <span
      className={`inline-flex rounded bg-red-600 px-1.5 py-0.5 text-[8px] font-bold uppercase leading-none tracking-wide text-white sm:px-2 sm:py-1 sm:text-[10px] md:text-xs ${className}`}
    >
      {label}
    </span>
  )
}
