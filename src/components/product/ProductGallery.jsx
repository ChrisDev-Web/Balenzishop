import { useState } from 'react'

export default function ProductGallery({ images, name }) {
  const [active, setActive] = useState(0)
  const gallery = images?.length ? images : []
  const currentImage = gallery[active] || gallery[0]

  return (
    <div className="product-gallery flex w-full min-w-0 gap-4">
      {gallery.length > 1 && (
        <div className="flex shrink-0 flex-col gap-3">
          {gallery.map((img, i) => (
            <button
              key={img}
              type="button"
              onClick={() => setActive(i)}
              className={`h-16 w-16 overflow-hidden rounded-lg border-2 bg-stone-50 sm:h-20 sm:w-20 ${
                i === active ? 'border-black' : 'border-transparent hover:border-gray-300'
              }`}
            >
              <img src={img} alt="" className="h-full w-full object-contain p-1" />
            </button>
          ))}
        </div>
      )}

      <div className="product-gallery__stage">
        <div className="product-gallery__frame">
          {currentImage ? (
            <img
              src={currentImage}
              alt={name}
              className="product-gallery__image"
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
