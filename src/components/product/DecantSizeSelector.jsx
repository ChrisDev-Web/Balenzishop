export default function DecantSizeSelector({ decants, selectedId, onSelect, disabled = false, centered = false }) {
  if (!decants?.length) return null

  return (
    <div className={`decant-size-selector${centered ? ' text-center lg:text-left' : ''}`}>
      <p className="decant-size-selector__label text-sm font-semibold uppercase tracking-wide text-gray-700">
        Tamaño
      </p>
      <div
        className={`decant-size-selector__options mt-3 flex flex-wrap gap-2.5 sm:gap-3${
          centered ? ' justify-center lg:justify-start' : ''
        }`}
      >
        {decants.map((decant) => {
          const isSelected = selectedId === decant.idProductDecant

          return (
            <button
              key={decant.idProductDecant}
              type="button"
              disabled={disabled}
              aria-pressed={isSelected}
              onClick={() => onSelect(decant)}
              className={`decant-size-selector__option btn-fill min-w-[5.5rem] px-6 py-3 text-xs uppercase disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[6rem] sm:px-8 sm:py-3.5 sm:text-sm ${
                isSelected ? 'is-active' : ''
              }`}
            >
              {decant.sizeMl} ml
            </button>
          )
        })}
      </div>
    </div>
  )
}
