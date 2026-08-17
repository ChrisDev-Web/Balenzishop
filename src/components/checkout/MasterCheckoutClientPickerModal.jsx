import { createPortal } from 'react-dom'
import { Pencil, Plus, Search, Trash2, User, X } from 'lucide-react'
import useBodyScrollLock from '../../hooks/useBodyScrollLock'
import { formatMasterBeneficiaryName } from '../../utils/masterBeneficiaryMapper'

export default function MasterCheckoutClientPickerModal({
  open,
  beneficiaries = [],
  searchValue,
  onSearchChange,
  onSelect,
  onEdit,
  onDelete,
  onCreate,
  onClose,
  isLoading = false,
  error = '',
}) {
  useBodyScrollLock(open)

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[260] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/55" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="master-client-picker-title"
        className="relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[88vh] sm:rounded-2xl"
      >
        <div className="border-b px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand">
                <User className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 id="master-client-picker-title" className="text-lg font-bold text-gray-900">
                  Elige a un cliente
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                  Selecciona para quién estás realizando este pedido. Solo verás clientes creados
                  en tu cuenta master.
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

          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar por DNI o nombre"
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm focus:border-black focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <p className="text-sm text-gray-500">Cargando clientes…</p>
          ) : beneficiaries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center">
              <p className="text-sm font-medium text-gray-900">Aún no tienes clientes registrados</p>
              <p className="mt-1 text-sm text-gray-600">
                Crea uno con los datos necesarios para realizar el pedido.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {beneficiaries.map((beneficiary) => (
                <li key={beneficiary.id_client} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <button
                    type="button"
                    onClick={() => onSelect(beneficiary)}
                    className="w-full p-4 text-left transition hover:bg-gray-50"
                  >
                    <p className="font-semibold text-gray-900">
                      {formatMasterBeneficiaryName(beneficiary)}
                    </p>
                    <p className="mt-1 text-xs font-medium text-gray-500">
                      DNI {beneficiary.document_number}
                      {beneficiary.phone ? ` · ${beneficiary.phone}` : ''}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      {beneficiary.addresses_count > 0
                        ? `${beneficiary.addresses_count} dirección${beneficiary.addresses_count === 1 ? '' : 'es'}`
                        : 'Sin direcciones — deberás agregar una'}
                    </p>
                  </button>
                  <div className="flex border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => onEdit?.(beneficiary)}
                      className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete?.(beneficiary)}
                      className="flex flex-1 items-center justify-center gap-1.5 border-l border-gray-100 px-3 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="space-y-3 border-t px-5 py-4">
          <button
            type="button"
            onClick={onCreate}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-black hover:bg-gray-50 hover:text-black"
          >
            <Plus className="h-4 w-4" />
            Crear cliente
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
