import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { UserPlus, X } from 'lucide-react'
import useBodyScrollLock from '../../hooks/useBodyScrollLock'
import { useDocumentTypes } from '../../hooks/useDocumentTypes'
import { resolveDefaultDocumentTypeId } from '../../utils/documentValidation'

const emptyForm = {
  name: '',
  lastNamePaternal: '',
  lastNameMaternal: '',
  phone: '',
  idDocumentType: '',
  documentNumber: '',
}

export default function MasterCheckoutCreateClientModal({
  open,
  onClose,
  onCreated,
  isSubmitting = false,
  error = '',
}) {
  useBodyScrollLock(open)
  const [form, setForm] = useState(emptyForm)
  const { documentTypes } = useDocumentTypes({ enabled: open })
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    if (!open) return

    setForm(emptyForm)
    setLocalError('')
  }, [open])

  useEffect(() => {
    if (!open || !documentTypes.length || form.idDocumentType) return

    setForm((current) => ({
      ...current,
      idDocumentType: resolveDefaultDocumentTypeId(documentTypes),
    }))
  }, [open, documentTypes, form.idDocumentType])

  if (!open) return null

  const handleSubmit = (event) => {
    event.preventDefault()
    setLocalError('')

    if (!form.name.trim() || !form.lastNamePaternal.trim() || !form.documentNumber.trim()) {
      setLocalError('Completa nombre, apellido paterno y DNI')
      return
    }

    if (!form.idDocumentType) {
      setLocalError('Selecciona el tipo de documento')
      return
    }

    onCreated({
      name: form.name.trim(),
      last_name_paternal: form.lastNamePaternal.trim(),
      last_name_maternal: form.lastNameMaternal.trim() || null,
      phone: form.phone.trim() || null,
      id_document_type: Number(form.idDocumentType),
      document_number: form.documentNumber.trim(),
    })
  }

  return createPortal(
    <div className="fixed inset-0 z-[270] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/55" aria-hidden="true" />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="master-create-client-title"
        onSubmit={handleSubmit}
        className="relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[88vh] sm:rounded-2xl"
      >
        <div className="border-b px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand">
                <UserPlus className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 id="master-create-client-title" className="text-lg font-bold text-gray-900">
                  Crear cliente
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                  Registra los datos del cliente final. Luego podrás configurar su dirección de entrega.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nombre</label>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-black focus:outline-none"
              autoComplete="given-name"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Apellido paterno</label>
              <input
                value={form.lastNamePaternal}
                onChange={(event) => setForm((current) => ({ ...current, lastNamePaternal: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-black focus:outline-none"
                autoComplete="family-name"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Apellido materno</label>
              <input
                value={form.lastNameMaternal}
                onChange={(event) => setForm((current) => ({ ...current, lastNameMaternal: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-black focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tipo de documento</label>
            <select
              value={form.idDocumentType}
              onChange={(event) => setForm((current) => ({ ...current, idDocumentType: event.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-black focus:outline-none"
            >
              <option value="">Seleccionar</option>
              {documentTypes.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Número de documento</label>
            <input
              value={form.documentNumber}
              onChange={(event) => setForm((current) => ({ ...current, documentNumber: event.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-black focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Teléfono</label>
            <input
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-black focus:outline-none"
              autoComplete="tel"
            />
          </div>

          {(localError || error) ? (
            <p className="text-sm text-red-600">{localError || error}</p>
          ) : null}
        </div>

        <div className="border-t px-5 py-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-black py-3 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando…' : 'Guardar y configurar dirección'}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}
