import { createPortal } from 'react-dom'
import { X, MapPin } from 'lucide-react'

export default function DeliveryZoneModal({ onSelect, onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delivery-zone-title"
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

        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-light text-brand">
            <MapPin className="h-5 w-5" />
          </span>
          <div>
            <h2 id="delivery-zone-title" className="text-lg font-bold text-gray-900">
              ¿Desea envíos a Lima o provincia?
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Elige la modalidad según dónde recibirás tu pedido
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onSelect('lima')}
            className="rounded-xl border-2 border-gray-200 px-4 py-4 text-left transition hover:border-brand hover:bg-brand-light/40"
          >
            <p className="font-semibold text-gray-900">Lima</p>
            <p className="mt-1 text-xs text-gray-500">
              Recojo en Shalon en Lima Metropolitana
            </p>
          </button>
          <button
            type="button"
            onClick={() => onSelect('provincia')}
            className="rounded-xl border-2 border-gray-200 px-4 py-4 text-left transition hover:border-brand hover:bg-brand-light/40"
          >
            <p className="font-semibold text-gray-900">Provincia</p>
            <p className="mt-1 text-xs text-gray-500">
              Shalon más cercano en su departamento
            </p>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
