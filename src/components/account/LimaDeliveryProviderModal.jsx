import { createPortal } from 'react-dom'
import { ArrowLeft, ShieldCheck, UserRound, X } from 'lucide-react'

export default function LimaDeliveryProviderModal({ onSelect, onBack, onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-[220] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lima-delivery-provider-title"
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

        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver
        </button>

        <div>
          <h2 id="lima-delivery-provider-title" className="text-lg font-bold text-gray-900">
            ¿Quién llevará tu pedido?
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Elige nuestro delivery de confianza o envía tu propio motorizado
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onSelect('rainau')}
            className="rounded-xl border-2 border-gray-200 px-4 py-4 text-left transition hover:border-brand hover:bg-brand-light/40"
          >
            <span className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-light text-brand">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <p className="font-semibold text-gray-900">Delivery Rainau</p>
            <p className="mt-1 text-xs text-gray-500">
              Nuestro delivery de confianza en Balenzishop. Llevamos tu pedido a tu domicilio.
            </p>
          </button>
          <button
            type="button"
            onClick={() => onSelect('own')}
            className="rounded-xl border-2 border-gray-200 px-4 py-4 text-left transition hover:border-brand hover:bg-brand-light/40"
          >
            <span className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-light text-brand">
              <UserRound className="h-4 w-4" />
            </span>
            <p className="font-semibold text-gray-900">Delivery propio</p>
            <p className="mt-1 text-xs text-gray-500">
              Envía tu propio courier o motorizado a recoger el pedido en nuestra tienda.
            </p>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
