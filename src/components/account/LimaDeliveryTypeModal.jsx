import { createPortal } from 'react-dom'
import { X, Truck, Store } from 'lucide-react'

export default function LimaDeliveryTypeModal({ onSelect, onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-[210] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lima-delivery-type-title"
        className="relative z-10 w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>

        <div>
          <h2 id="lima-delivery-type-title" className="text-lg font-bold text-gray-900">
            ¿Cómo recibirás tu pedido en Lima?
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Elige delivery a domicilio o recojo en una sede Shalon
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onSelect('delivery')}
            className="rounded-xl border-2 border-gray-200 px-4 py-4 text-left transition hover:border-brand hover:bg-brand-light/40"
          >
            <span className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-light text-brand">
              <Truck className="h-4 w-4" />
            </span>
            <p className="font-semibold text-gray-900">Delivery</p>
            <p className="mt-1 text-xs text-gray-500">
              Envío a tu domicilio con ubicación en mapa
            </p>
          </button>
          <button
            type="button"
            onClick={() => onSelect('shalon')}
            className="rounded-xl border-2 border-gray-200 px-4 py-4 text-left transition hover:border-brand hover:bg-brand-light/40"
          >
            <span className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-light text-brand">
              <Store className="h-4 w-4" />
            </span>
            <p className="font-semibold text-gray-900">Recojo en Shalon</p>
            <p className="mt-1 text-xs text-gray-500">
              Retira tu pedido en la sede más cercana
            </p>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
