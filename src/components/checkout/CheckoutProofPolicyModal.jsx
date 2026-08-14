import { createPortal } from 'react-dom'
import { ShieldAlert, X } from 'lucide-react'
import useBodyScrollLock from '../../hooks/useBodyScrollLock'

export default function CheckoutProofPolicyModal({ open, onClose }) {
  useBodyScrollLock(open)

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[230] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="proof-policy-title"
        className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
              <ShieldAlert className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 id="proof-policy-title" className="text-lg font-bold text-gray-900">
                Comprobantes de pago válidos
              </h3>
              <p className="mt-0.5 text-sm text-gray-500">
                Información importante antes de adjuntar tu voucher
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4 text-sm leading-relaxed text-gray-700">
          <p>
            Solo aceptamos comprobantes <strong>reales y recientes</strong> del pago que estás
            registrando (Yape, Plin, transferencia u otro método indicado).
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>No uses capturas falsas, simuladas o editadas.</li>
            <li>No subas comprobantes de pagos anteriores o de otra operación.</li>
            <li>El monto y la fecha deben coincidir con tu pedido actual.</li>
          </ul>
          <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-amber-950">
            Si detectamos un comprobante fraudulento, <strong>cancelaremos tu pedido</strong> y
            podremos iniciar <strong>acciones legales</strong> conforme a la ley peruana.
          </p>
        </div>

        <div className="border-t px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full bg-black py-2.5 text-sm font-bold text-white hover:bg-gray-800"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
