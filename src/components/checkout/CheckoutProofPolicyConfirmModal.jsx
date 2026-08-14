import { createPortal } from 'react-dom'
import useBodyScrollLock from '../../hooks/useBodyScrollLock'

export default function CheckoutProofPolicyConfirmModal({ open, onAccept, onDecline }) {
  useBodyScrollLock(open)

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[240] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55" aria-hidden="true" />
      <div
        role="alertdialog"
        aria-labelledby="proof-policy-confirm-title"
        className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl"
      >
        <h3 id="proof-policy-confirm-title" className="text-lg font-bold text-gray-900">
          ¿Confirma que has leído la política de comprobantes de pago?
        </h3>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onDecline}
            className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            No, no he leído
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white hover:bg-gray-800"
          >
            Sí, he leído y acepto
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
