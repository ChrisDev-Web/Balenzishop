import { createPortal } from 'react-dom'
import { MapPin, Plus, Star, X } from 'lucide-react'
import useBodyScrollLock from '../../hooks/useBodyScrollLock'

import { getDeliveryProviderLabel, isHomeDeliveryType, isOwnDeliveryType } from '../../utils/deliveryTypes'

function getDeliverySummary(address) {
  if (!address) return ''

  if (isOwnDeliveryType(address.deliveryType)) {
    return address.googleMapsLink || address.fullAddress || getDeliveryProviderLabel(address.deliveryType)
  }

  if (isHomeDeliveryType(address.deliveryType)) {
    return address.fullAddress || getDeliveryProviderLabel(address.deliveryType)
  }

  return address.shalon || address.street || 'Recojo en Shalon'
}

function getScopeLabel(address) {
  if (address.deliveryScope === 'lima') {
    return isHomeDeliveryType(address.deliveryType)
      ? `Lima · ${getDeliveryProviderLabel(address.deliveryType)}`
      : 'Lima · Recojo Shalon'
  }

  if (address.deliveryScope === 'provincia') {
    return address.region ? `${address.region} · Provincia` : 'Provincia · Recojo Shalon'
  }

  return 'Entrega registrada'
}

export function formatCheckoutAddressLine(address) {
  if (!address) return '—'

  if (isOwnDeliveryType(address.deliveryType)) {
    return address.googleMapsLink || address.fullAddress || getDeliveryProviderLabel(address.deliveryType)
  }

  if (isHomeDeliveryType(address.deliveryType)) {
    return address.fullAddress || `${address.district}, ${address.city}`
  }

  return address.shalon || `${address.district}, ${address.city}`
}

export default function CheckoutAddressConfirmModal({
  open,
  addresses = [],
  selectedAddressId,
  onSelectAddress,
  onConfirm,
  onAddNew,
  onClose,
  isConfirming = false,
  error = '',
}) {
  useBodyScrollLock(open)

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[250] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/55" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-address-title"
        className="relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[88vh] sm:rounded-2xl"
      >
        <div className="border-b px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand">
                <MapPin className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 id="checkout-address-title" className="text-lg font-bold text-gray-900">
                  ¿Tu dirección de entrega es la correcta?
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                  Antes de reservar, confirma dónde recibirás tu pedido. Si viajaste o cambiaste de
                  ciudad, elige otra dirección guardada o agrega una nueva.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isConfirming}
              className="shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <ul className="space-y-3">
            {addresses.map((address) => {
              const isSelected = String(selectedAddressId) === String(address.id)

              return (
                <li key={address.id}>
                  <button
                    type="button"
                    onClick={() => onSelectAddress(address.id)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? 'border-black bg-gray-50 ring-1 ring-black'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {isOwnDeliveryType(address.deliveryType)
                          ? getDeliveryProviderLabel(address.deliveryType)
                          : `${address.district}, ${address.city}`}
                      </span>
                      {address.isPrimary && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-black px-2 py-0.5 text-xs font-medium text-white">
                          <Star className="h-3 w-3" />
                          Principal
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs font-medium text-gray-500">{getScopeLabel(address)}</p>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">
                      {getDeliverySummary(address)}
                    </p>
                  </button>
                </li>
              )
            })}
          </ul>

          <button
            type="button"
            onClick={onAddNew}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-black hover:bg-gray-50 hover:text-black"
          >
            <Plus className="h-4 w-4" />
            Agregar otra dirección
          </button>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </div>

        <div className="border-t px-5 py-4">
          <button
            type="button"
            onClick={onConfirm}
            disabled={!selectedAddressId || isConfirming}
            className="w-full rounded-full bg-black py-3 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {isConfirming ? 'Guardando…' : 'Sí, usar esta dirección'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export { getDeliverySummary, getScopeLabel }
