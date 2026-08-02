export default function CatalogPriceDisplay({
  presentation,
  variant = 'card',
  showUnit = false,
}) {
  if (!presentation) return null

  const { displayPrice, priceLabel, strikePrices } = presentation
  const isDetail = variant === 'detail'

  return (
    <div className="min-w-0 space-y-0.5">
      {priceLabel && (
        <p
          className={
            isDetail
              ? 'text-sm font-semibold text-gray-900'
              : 'text-[9px] font-medium text-gray-600 sm:text-[10px] md:text-xs'
          }
        >
          {priceLabel}
        </p>
      )}

      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span
          className={
            isDetail
              ? 'text-2xl font-bold text-gray-900 sm:text-3xl'
              : 'text-xs font-bold text-gray-900 sm:text-sm md:text-lg'
          }
        >
          S/ {displayPrice.toFixed(2)}
        </span>
        {showUnit && <span className="text-sm text-gray-500">x Und</span>}
      </div>

      {strikePrices.map((strike) => (
        <p
          key={`${strike.label ?? 'ref'}-${strike.amount}`}
          className={
            isDetail
              ? 'text-sm text-gray-400 line-through'
              : 'text-[9px] text-gray-400 line-through sm:text-[10px] md:text-xs'
          }
        >
          {strike.label ? `${strike.label}: ` : ''}
          S/ {strike.amount.toFixed(2)}
        </p>
      ))}
    </div>
  )
}
