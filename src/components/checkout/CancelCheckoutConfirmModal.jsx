import { cancelCheckoutReservation } from '../../api/clientOrders'

export default function CancelCheckoutConfirmModal({
  open,
  isProcessing = false,
  error = '',
  onContinue,
  onConfirmCancel,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
      <div
        role="alertdialog"
        aria-labelledby="cancel-reservation-title"
        className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 text-center shadow-2xl"
      >
        <h3 id="cancel-reservation-title" className="text-lg font-bold text-gray-900">
          ¿Seguro que deseas cancelar la reserva?
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Tienes stock reservado en tu pedido. Si cancelas, liberaremos esas unidades y podrás volver a
          reservar cuando quieras.
        </p>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onContinue}
            disabled={isProcessing}
            className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
          >
            Seguir con mi reserva
          </button>
          <button
            type="button"
            onClick={onConfirmCancel}
            disabled={isProcessing}
            className="rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {isProcessing ? 'Cancelando…' : 'Sí, cancelar reserva'}
          </button>
        </div>
      </div>
    </div>
  )
}

export async function cancelActiveCheckoutDraft(orderId, accessToken) {
  const response = await cancelCheckoutReservation(orderId, accessToken)
  if (!response.success) {
    throw new Error(response.message || 'No se pudo cancelar la reserva')
  }
  return response
}
