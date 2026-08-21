import { createPortal } from 'react-dom'
import useBodyScrollLock from '../../hooks/useBodyScrollLock'

export default function CancelOrderConfirmModal({
  order,
  isProcessing = false,
  error = '',
  onCancel,
  onConfirm,
}) {
  useBodyScrollLock(Boolean(order))

  if (!order) return null

  return createPortal(
    <div className="fixed inset-0 z-[250] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
      <div
        role="alertdialog"
        aria-labelledby="cancel-order-title"
        aria-describedby="cancel-order-description"
        className="relative z-10 w-full max-w-md rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-xl"
      >
        <h3 id="cancel-order-title" className="text-lg font-bold text-gray-900">
          ¿Cancelar este pedido?
        </h3>
        <p id="cancel-order-description" className="mt-2 text-sm text-gray-600">
          Esta acción no se puede deshacer.
          <br />
          El pedido <strong className="whitespace-nowrap">#{order.id}</strong> será
          cancelado y perderá la reserva de sus productos.
        </p>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 rounded-full bg-black py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {isProcessing ? 'Cancelando…' : 'Sí, cancelar pedido'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 rounded-full border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Volver
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
