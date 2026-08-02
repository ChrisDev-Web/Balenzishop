export default function ProductGallery({ items, activeIndex = 0, onActiveChange, name, overlay = null }) {
  const gallery = (items ?? []).filter((item) => item?.image)
  const safeIndex = gallery.length === 0 ? 0 : Math.max(0, Math.min(activeIndex, gallery.length - 1))
  const current = gallery[safeIndex]
  const currentImage = current?.image

  return (
    <div className="product-gallery flex w-full min-w-0 gap-3 sm:gap-4">
      {gallery.length > 1 && (
        <div className="product-gallery__thumbs flex shrink-0 flex-col gap-2 sm:gap-2.5">
          {gallery.map((item, index) => {
            const isActive = index === safeIndex

            return (
              <button
                key={item.id ?? index}
                type="button"
                onClick={() => onActiveChange?.(index, item)}
                aria-label={item.label || `Vista ${index + 1}`}
                aria-current={isActive ? 'true' : undefined}
                className={`product-gallery__thumb h-14 w-14 overflow-hidden rounded-lg border-2 bg-stone-50 transition sm:h-[4.25rem] sm:w-[4.25rem] ${
                  isActive
                    ? 'border-black shadow-sm'
                    : 'border-transparent hover:border-gray-300'
                }`}
              >
                <img
                  src={item.image}
                  alt=""
                  className="h-full w-full object-contain p-1"
                  loading="lazy"
                  decoding="async"
                />
              </button>
            )
          })}
        </div>
      )}

      <div className="product-gallery__stage">
        {overlay && <div className="product-gallery__overlay">{overlay}</div>}
        <div className="product-gallery__frame">
          {currentImage ? (
            <img
              key={currentImage}
              src={currentImage}
              alt={name}
              className="product-gallery__image product-gallery__image--fade-in"
              decoding="async"
            />
          ) : (
            <div className="product-gallery__image product-gallery__image--empty" aria-hidden />
          )}
        </div>
      </div>
    </div>
  )
}
