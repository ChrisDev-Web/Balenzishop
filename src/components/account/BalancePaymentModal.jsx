import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Trash2, Upload, MessageCircle } from 'lucide-react'
import { submitBalancePayment } from '../../api/clientOrders'

function createPaymentRow(balanceDue) {
  return {
    key: crypto.randomUUID(),
    id_payment_method: '',
    amount: balanceDue > 0 ? String(balanceDue) : '',
    files: [],
  }
}

function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100
}

export default function BalancePaymentModal({
  open,
  onClose,
  order,
  accessToken,
  paymentMethods,
  customer,
  onSubmitted,
}) {
  const balanceDue = Number(order?.balanceDue ?? 0)
  const [paymentRows, setPaymentRows] = useState([createPaymentRow(balanceDue)])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const paidTotal = useMemo(
    () => roundMoney(paymentRows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0)),
    [paymentRows],
  )

  const amountMatches = Math.abs(paidTotal - balanceDue) < 0.01

  const allRowsValid = paymentRows.every(
    (row) => row.id_payment_method && Number(row.amount) > 0 && row.files.length > 0,
  )

  const canSubmit = amountMatches && allRowsValid && !submitting && balanceDue > 0

  useEffect(() => {
    if (!open) return
    setPaymentRows([createPaymentRow(balanceDue)])
    setSubmitting(false)
    setError('')
  }, [open, balanceDue])

  if (!open || !order) return null

  function updateRow(key, patch) {
    setPaymentRows((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }

  function addPaymentRow() {
    setPaymentRows((rows) => [...rows, createPaymentRow(0)])
  }

  function removePaymentRow(key) {
    setPaymentRows((rows) => (rows.length === 1 ? rows : rows.filter((row) => row.key !== key)))
  }

  function handleFilesChange(key, event) {
    const selected = Array.from(event.target.files || [])
    updateRow(key, { files: selected })
    event.target.value = ''
  }

  async function handleSubmit() {
    if (!canSubmit) return

    setSubmitting(true)
    setError('')

    try {
      const payments = paymentRows.map((row) => ({
        id_payment_method: Number(row.id_payment_method),
        amount: Number(row.amount),
      }))

      const paymentProofs = paymentRows.map((row) => row.files)

      const response = await submitBalancePayment(
        order.idClientOrder,
        { payments, paymentProofs },
        accessToken,
      )

      if (!response.success) {
        throw new Error(response.message || 'No se pudo registrar el pago restante')
      }

      await onSubmitted?.(response.data, {
        payments: paymentRows.map((row) => ({
          methodName: paymentMethods.find((m) => String(m.id_payment_method) === String(row.id_payment_method))?.name || 'Método',
          amount: Number(row.amount),
        })),
      })
      onClose()
    } catch (submitError) {
      setError(submitError.message || 'No se pudo registrar el pago restante')
    } finally {
      setSubmitting(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-labelledby="balance-payment-title"
        className="relative z-10 flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-xl"
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 id="balance-payment-title" className="text-lg font-bold text-gray-900">
              Pago restante
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              La reserva de tu pedido {order.orderNumber || order.id} ya fue verificada. Completa el saldo pendiente.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-5 py-4">
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <p className="font-semibold">Reserva verificada</p>
            <p className="mt-1">
              Ahora debes pagar el saldo restante de <strong>S/ {balanceDue.toFixed(2)}</strong> para continuar con tu pedido.
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm">
            <p className="font-bold text-gray-900">Total del pedido: S/ {Number(order.total).toFixed(2)}</p>
            <p className="mt-1 text-gray-600">Saldo pendiente: S/ {balanceDue.toFixed(2)}</p>
          </div>

          <div className="space-y-4">
            {paymentRows.map((row, index) => (
              <div key={row.key} className="rounded-lg border border-gray-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">Pago {index + 1}</p>
                  {paymentRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePaymentRow(row.key)}
                      className="text-gray-400 hover:text-red-500"
                      aria-label="Eliminar pago"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1 block text-gray-700">Método de pago</span>
                    <select
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      value={row.id_payment_method}
                      onChange={(event) => updateRow(row.key, { id_payment_method: event.target.value })}
                    >
                      <option value="">Seleccionar…</option>
                      {paymentMethods.map((method) => (
                        <option key={method.id_payment_method} value={String(method.id_payment_method)}>
                          {method.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-gray-700">Monto (S/)</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      value={row.amount}
                      onChange={(event) => updateRow(row.key, { amount: event.target.value })}
                    />
                  </label>
                </div>

                <label className="mt-3 block text-sm">
                  <span className="mb-1 block text-gray-700">Comprobante(s)</span>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
                      <Upload className="h-4 w-4" />
                      Subir archivos
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(event) => handleFilesChange(row.key, event)}
                      />
                    </label>
                    <span className="text-xs text-gray-500">
                      {row.files.length ? `${row.files.length} archivo(s)` : 'Sin archivos'}
                    </span>
                  </div>
                </label>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addPaymentRow}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-black"
          >
            <Plus className="h-4 w-4" />
            Agregar otro método de pago
          </button>

          <div className="rounded-lg border border-gray-200 px-4 py-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total a pagar ahora</span>
              <span className="font-bold text-gray-900">S/ {paidTotal.toFixed(2)}</span>
            </div>
            {!amountMatches && (
              <p className="mt-1 text-xs text-amber-700">
                Debe coincidir con el saldo pendiente (S/ {balanceDue.toFixed(2)}).
              </p>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex flex-col gap-2 border-t px-4 py-3 sm:flex-row sm:px-5 sm:py-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-black px-4 py-2.5 text-xs font-semibold leading-snug text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1 sm:py-3 sm:text-sm"
          >
            <MessageCircle className="h-4 w-4 shrink-0" />
            <span className="sm:hidden">Enviar pago por WhatsApp</span>
            <span className="hidden sm:inline">Enviar pago restante por WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full border border-gray-300 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 sm:w-auto sm:px-5 sm:py-3 sm:text-sm"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
