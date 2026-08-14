export default function DecantPriceDisplay({
  unitPrice,
  quantity = 1,
  variant = 'detail',
  showUnit = true,
  promoHint = null,
}) {
  const price = Number(unitPrice) || 0
  const qty = Math.max(1, Number(quantity) || 1)
  const isDetail = variant === 'detail'
  const lineTotal = Math.round(price * qty * 100) / 100

  return (
    <div className={`min-w-0 space-y-1${isDetail ? ' flex flex-col items-center lg:items-start' : ''}`}>
      <div className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5${isDetail ? ' justify-center lg:justify-start' : ''}`}>
        <span
          className={
            isDetail
              ? 'text-2xl font-bold text-gray-900 sm:text-3xl'
              : 'text-xs font-bold text-gray-900 sm:text-sm md:text-lg'
          }
        >
          S/ {price.toFixed(2)}
        </span>
        {showUnit && <span className="text-sm text-gray-500">x Und</span>}
      </div>

      {qty > 1 && (
        <p className={`font-semibold text-gray-900 ${isDetail ? 'text-lg' : 'text-sm'}`}>
          Subtotal línea: S/ {lineTotal.toFixed(2)}
        </p>
      )}

      {promoHint && (
        <p className="text-xs text-gray-500">{promoHint}</p>
      )}
    </div>
  )
}
