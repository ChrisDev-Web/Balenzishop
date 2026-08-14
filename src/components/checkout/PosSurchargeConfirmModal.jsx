import { createPortal } from 'react-dom'
import { CreditCard } from 'lucide-react'
import { calculatePosSurcharge } from '../../utils/paymentSurcharge'
import useBodyScrollLock from '../../hooks/useBodyScrollLock'

export default function PosSurchargeConfirmModal({
  open,
  baseTotal,
  onConfirm,
  onCancel,
}) {
  useBodyScrollLock(open)

  if (!open) return null

  const surcharge = calculatePosSurcharge(baseTotal)
  const totalWithSurcharge = Math.round((Number(baseTotal) + surcharge) * 100) / 100

  return createPortal(
    <div className="fixed inset-0 z-[230] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
      <div
        role="dialog"
        aria-labelledby="pos-surcharge-title"
        className="relative z-10 w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
      >
        <div className="mb-4 flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-900">
            <CreditCard className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h3 id="pos-surcharge-title" className="text-lg font-bold text-gray-900">
              Pago con tarjeta de crédito
            </h3>
            <p className="text-sm text-gray-500">Recargo por procesamiento POS</p>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-gray-700">
          Al pagar con tarjeta de crédito, se agregará un recargo del{' '}
          <strong>5%</strong> al total de tu pedido. Es un cargo adicional por el uso del terminal POS.
        </p>

        <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Total actual</span>
            <span>S/ {Number(baseTotal).toFixed(2)}</span>
          </div>
          <div className="mt-1 flex justify-between text-gray-600">
            <span>Recargo POS (5%)</span>
            <span>S/ {surcharge.toFixed(2)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 font-bold text-gray-900">
            <span>Nuevo total</span>
            <span>S/ {totalWithSurcharge.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Elegir otro método
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Entendido, continuar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
