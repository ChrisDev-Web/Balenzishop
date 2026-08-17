import { createPortal } from 'react-dom'
import { User, X } from 'lucide-react'
import useBodyScrollLock from '../../hooks/useBodyScrollLock'
import { formatMasterBeneficiaryName } from '../../utils/masterBeneficiaryMapper'

export default function MasterCheckoutDeleteClientModal({
  beneficiary,
  isProcessing = false,
  error = '',
  onCancel,
  onConfirm,
}) {
  useBodyScrollLock(Boolean(beneficiary))

  if (!beneficiary) return null

  return createPortal(
    <div className="fixed inset-0 z-[280] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/55" aria-hidden="true" />
      <div
        role="alertdialog"
        aria-labelledby="master-delete-client-title"
        aria-describedby="master-delete-client-description"
        className="relative z-10 w-full max-w-md rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 id="master-delete-client-title" className="text-lg font-bold text-gray-900">
            ¿Eliminar este cliente?
          </h3>
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p id="master-delete-client-description" className="mt-2 text-sm text-gray-600">
          Se eliminarán también sus direcciones guardadas. No podrás deshacer esta acción.
        </p>

        <div className="mt-4 flex gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <User className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
          <div className="min-w-0">
            <p className="font-semibold text-gray-900">{formatMasterBeneficiaryName(beneficiary)}</p>
            <p className="mt-1 text-xs text-gray-500">DNI {beneficiary.document_number}</p>
          </div>
        </div>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 rounded-full bg-black py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {isProcessing ? 'Eliminando…' : 'Eliminar cliente'}
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
