import { createPortal } from 'react-dom'
import { MapPin } from 'lucide-react'
import { formatAddressCityLabel } from '../../utils/addressFormHelpers'
import { isHomeDeliveryType } from '../../utils/deliveryTypes'

export default function DeleteAddressConfirmModal({
  address,
  isProcessing = false,
  error = '',
  onCancel,
  onConfirm,
}) {
  if (!address) return null

  const detail = isHomeDeliveryType(address.deliveryType)
    ? address.fullAddress
    : address.shalon || address.street

  return createPortal(
    <div className="fixed inset-0 z-[250] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={isProcessing ? undefined : onCancel}
        aria-hidden="true"
      />
      <div
        role="alertdialog"
        aria-labelledby="delete-address-title"
        aria-describedby="delete-address-description"
        className="relative z-10 w-full max-w-md rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-xl"
      >
        <h3 id="delete-address-title" className="text-lg font-bold text-gray-900">
          ¿Eliminar esta dirección?
        </h3>
        <p id="delete-address-description" className="mt-2 text-sm text-gray-600">
          Esta acción no se puede deshacer. Se quitará la dirección de tu cuenta.
        </p>

        <div className="mt-4 flex gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
          <div className="min-w-0">
            <p className="font-semibold text-gray-900">
              {address.district}, {formatAddressCityLabel(address)}
            </p>
            {detail && (
              <p className="mt-1 text-xs leading-relaxed text-gray-500">{detail}</p>
            )}
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 rounded-full bg-black py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {isProcessing ? 'Eliminando…' : 'Sí, eliminar'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 rounded-full border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
