import { useState } from 'react'

export default function ProductGallery({ images, name }) {
  const [active, setActive] = useState(0)
  const gallery = images?.length ? images : []

  return (
    <div className="flex gap-4">
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

      <div className="flex flex-1 items-center justify-center rounded-xl border border-gray-100 bg-stone-50 p-6 sm:p-10">
        <img
          src={gallery[active] || images[0]}
          alt={name}
          className="max-h-[320px] w-full object-contain sm:max-h-[420px] md:max-h-[480px]"
        />
      </div>
    </div>
  )
}
