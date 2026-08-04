import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Trash2, Upload, MessageCircle } from 'lucide-react'
import { submitCheckoutOrder } from '../../api/clientOrders'
import { calculateReservationAmount, formatReservationHint } from '../../utils/reservation'
import { findPaymentMethodById } from '../../utils/paymentMethods'
import {
  applyPosSurcharge,
  filterCheckoutPaymentMethods,
  isPosPaymentMethod,
} from '../../utils/paymentSurcharge'
import { computeOrderTotal, DELIVERY_MODES, formatShippingDisplay } from '../../utils/deliveryFee'
import { DELIVERY_TYPES } from '../../utils/deliveryTypes'
import { useRainauAvailableDeliveryDates } from '../../hooks/useRainauAvailableDeliveryDates'
import PaymentMethodCheckoutInfo from './PaymentMethodCheckoutInfo'
import RainauDeliveryDatePicker from './RainauDeliveryDatePicker'
import PosSurchargeConfirmModal from './PosSurchargeConfirmModal'
import CancelCheckoutConfirmModal, {
  cancelActiveCheckoutDraft,
} from './CancelCheckoutConfirmModal'
import { createClientId } from '../../utils/createClientId'

const PAYMENT_MODE_RESERVATION = 'reserva'
const PAYMENT_MODE_FULL = 'completo'

function createPaymentRow(amount = '') {
  return {
    key: createClientId(),
    id_payment_method: '',
    amount: amount === '' ? '' : String(amount),
    files: [],
  }
}

function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100
}

function rebalancePaymentRows(rows, expectedAmount) {
  if (rows.length === 0) return rows

  if (rows.length === 1) {
    return [{ ...rows[0], amount: String(roundMoney(expectedAmount)) }]
  }

  const othersTotal = rows
    .slice(1)
    .reduce((sum, row) => sum + (Number(row.amount) || 0), 0)

  const firstAmount = roundMoney(Math.max(0, expectedAmount - othersTotal))

  return rows.map((row, index) =>
    (index === 0 ? { ...row, amount: String(firstAmount) } : row),
  )
}

export default function ReserveOrderModal({
  open,
  draftOrderId,
  onClose,
  onCancelled,
  items,
  subtotal,
  discount,
  discountCode,
  total,
  totalQuantity,
  deliveryFee,
  deliveryMode,
  deliveryLabel,
  primaryAddress,
  accessToken,
  paymentMethods,
  onOrderCreated,
}) {
  const [paymentMode, setPaymentMode] = useState(PAYMENT_MODE_RESERVATION)
  const [paymentRows, setPaymentRows] = useState([createPaymentRow()])
  const [submitting, setSubmitting] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [calendarPickerOpen, setCalendarPickerOpen] = useState(false)
  const [scheduledDeliveryDate, setScheduledDeliveryDate] = useState('')
  const [showPosSurchargeModal, setShowPosSurchargeModal] = useState(false)
  const [pendingPosSelection, setPendingPosSelection] = useState(null)

  const requiresScheduledDeliveryDate = deliveryMode === DELIVERY_MODES.DELIVERY
    || deliveryMode === DELIVERY_MODES.CUSTOMER_DELIVERY

  const requiresRainauDeliveryDate = requiresScheduledDeliveryDate
    && primaryAddress?.deliveryType === DELIVERY_TYPES.RAINAU

  const checkoutPaymentMethods = useMemo(
    () => filterCheckoutPaymentMethods(paymentMethods, { rainauDelivery: requiresRainauDeliveryDate }),
    [paymentMethods, requiresRainauDeliveryDate],
  )

  const {
    dates: availableDeliveryDates,
    sameDayCutoffPassed,
    isLoading: deliveryDatesLoading,
    error: deliveryDatesError,
    refresh: refreshDeliveryDates,
  } = useRainauAvailableDeliveryDates(open && requiresScheduledDeliveryDate, {
    fastPoll: calendarPickerOpen,
  })

  const rainauDeliveryFee = Number(primaryAddress?.deliveryFee || 0)
  const effectiveDeliveryFee = requiresRainauDeliveryDate && scheduledDeliveryDate
    ? rainauDeliveryFee
    : 0

  const reservationAmount = useMemo(
    () => calculateReservationAmount(items),
    [items],
  )

  const reservationHint = useMemo(
    () => formatReservationHint(items),
    [items],
  )

  const orderTotal = useMemo(
    () => computeOrderTotal(subtotal, discount, effectiveDeliveryFee, deliveryMode),
    [subtotal, discount, effectiveDeliveryFee, deliveryMode],
  )

  const usesPosPayment = useMemo(
    () => paymentRows.some((row) => isPosPaymentMethod(
      findPaymentMethodById(checkoutPaymentMethods, row.id_payment_method),
    )),
    [paymentRows, checkoutPaymentMethods],
  )

  const { surcharge: posSurchargeAmount, total: orderTotalWithSurcharge } = useMemo(
    () => (usesPosPayment ? applyPosSurcharge(orderTotal) : { surcharge: 0, total: orderTotal }),
    [usesPosPayment, orderTotal],
  )

  const expectedAmount = paymentMode === PAYMENT_MODE_FULL ? orderTotalWithSurcharge : reservationAmount

  const paidTotal = useMemo(
    () => roundMoney(
      paymentRows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
    ),
    [paymentRows],
  )

  const amountMatches = Math.abs(paidTotal - expectedAmount) < 0.01

  const allRowsValid = paymentRows.every(
    (row) => row.id_payment_method && Number(row.amount) > 0 && row.files.length > 0,
  )

  const canSubmit = amountMatches && allRowsValid && !submitting && !cancelling && draftOrderId
    && (!requiresScheduledDeliveryDate || Boolean(scheduledDeliveryDate))

  useEffect(() => {
    if (!open) return

    setPaymentMode(PAYMENT_MODE_RESERVATION)
    setPaymentRows([createPaymentRow()])
    setSubmitting(false)
    setCancelling(false)
    setError('')
    setShowCancelConfirm(false)
    setCalendarPickerOpen(false)
    setScheduledDeliveryDate('')
    setShowPosSurchargeModal(false)
    setPendingPosSelection(null)
  }, [open])

  useEffect(() => {
    if (!scheduledDeliveryDate || availableDeliveryDates.length === 0) return

    const selected = availableDeliveryDates.find((entry) => entry.date === scheduledDeliveryDate)
    if (selected?.blocked) {
      setScheduledDeliveryDate('')
    }
  }, [availableDeliveryDates, scheduledDeliveryDate])

  useEffect(() => {
    if (!open) return

    setPaymentRows((rows) => rebalancePaymentRows(rows, expectedAmount))
  }, [open, expectedAmount, paymentRows.length])

  if (!open) return null

  function updateRow(key, patch) {
    setPaymentRows((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }

  function handlePaymentMethodChange(rowKey, methodId) {
    const selectedMethod = findPaymentMethodById(checkoutPaymentMethods, methodId)

    if (isPosPaymentMethod(selectedMethod)) {
      setPendingPosSelection({ rowKey, methodId })
      setShowPosSurchargeModal(true)
      return
    }

    updateRow(rowKey, { id_payment_method: methodId })
  }

  function confirmPosSurcharge() {
    if (!pendingPosSelection) return

    updateRow(pendingPosSelection.rowKey, {
      id_payment_method: pendingPosSelection.methodId,
    })
    setPendingPosSelection(null)
    setShowPosSurchargeModal(false)
  }

  function cancelPosSurcharge() {
    setPendingPosSelection(null)
    setShowPosSurchargeModal(false)
  }

  function updateRowAmount(key, rawAmount) {
    setPaymentRows((rows) => {
      const rowIndex = rows.findIndex((row) => row.key === key)
      if (rowIndex <= 0) return rows

      const updated = rows.map((row) =>
        (row.key === key ? { ...row, amount: rawAmount } : row),
      )

      return rebalancePaymentRows(updated, expectedAmount)
    })
  }

  function addPaymentRow() {
    setPaymentRows((rows) => rebalancePaymentRows([...rows, createPaymentRow()], expectedAmount))
  }

  function removePaymentRow(key) {
    setPaymentRows((rows) => {
      if (rows.length === 1) return rows

      return rebalancePaymentRows(
        rows.filter((row) => row.key !== key),
        expectedAmount,
      )
    })
  }

  function handleFilesChange(key, event) {
    const selected = Array.from(event.target.files || [])
    updateRow(key, { files: selected })
    event.target.value = ''
  }

  function requestClose() {
    if (submitting) return
    setShowCancelConfirm(true)
  }

  async function confirmCancelReservation() {
    if (!draftOrderId || !accessToken) {
      onClose()
      return
    }

    setCancelling(true)
    setError('')

    try {
      await cancelActiveCheckoutDraft(draftOrderId, accessToken)
      setShowCancelConfirm(false)
      onCancelled?.()
      onClose()
    } catch (cancelError) {
      setError(cancelError.message || 'No se pudo cancelar la reserva')
    } finally {
      setCancelling(false)
    }
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

      const response = await submitCheckoutOrder(
        draftOrderId,
        {
          paymentMode,
          payments,
          paymentProofs,
          delivery: requiresScheduledDeliveryDate
            ? {
                scheduled_delivery_date: scheduledDeliveryDate,
                delivery_fee: effectiveDeliveryFee,
              }
            : undefined,
        },
        accessToken,
      )

      if (!response.success) {
        throw new Error(response.message || 'No se pudo registrar el pedido')
      }

      await onOrderCreated?.(response.data)
      onClose()
    } catch (submitError) {
      setError(submitError.message || 'No se pudo registrar el pedido')
    } finally {
      setSubmitting(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={requestClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-labelledby="reserve-order-title"
        className="relative z-10 flex max-h-[92dvh] w-full min-w-0 max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h2 id="reserve-order-title" className="text-lg font-bold text-gray-900">
              Reservar pedido
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              El stock ya está reservado. Sube tus comprobantes y envía por WhatsApp para confirmar.
            </p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            disabled={submitting}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-5">
          <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm">
            <p className="font-bold text-gray-900">
              Reserva: S/ {reservationAmount.toFixed(2)} ({reservationHint})
            </p>
            <p className="mt-1 font-bold text-gray-900">
              Total del pedido: S/ {orderTotalWithSurcharge.toFixed(2)}
            </p>
            {usesPosPayment && (
              <p className="mt-1 text-gray-600">
                Incluye recargo POS (5%): S/ {posSurchargeAmount.toFixed(2)}
              </p>
            )}
            {requiresRainauDeliveryDate && (
              <p className="mt-1 text-gray-600">
                Delivery Rainau:{' '}
                {formatShippingDisplay({ deliveryFee: effectiveDeliveryFee })}
              </p>
            )}
            {paymentMode === PAYMENT_MODE_RESERVATION && (
              <p className="mt-1 text-gray-600">
                Saldo pendiente tras la reserva: S/ {Math.max(0, orderTotalWithSurcharge - reservationAmount).toFixed(2)}
              </p>
            )}
          </div>

          {requiresScheduledDeliveryDate && (
            <RainauDeliveryDatePicker
              dates={availableDeliveryDates}
              value={scheduledDeliveryDate}
              isLoading={deliveryDatesLoading}
              error={deliveryDatesError}
              sameDayCutoffPassed={sameDayCutoffPassed}
              onChange={setScheduledDeliveryDate}
              onRefreshDates={refreshDeliveryDates}
              onCalendarOpenChange={setCalendarPickerOpen}
            />
          )}

          <div>
            <p className="mb-2 text-sm font-semibold text-gray-900">¿Qué vas a pagar ahora?</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className={`cursor-pointer rounded-lg border px-4 py-3 text-sm ${paymentMode === PAYMENT_MODE_RESERVATION ? 'border-black bg-gray-50' : 'border-gray-200'}`}>
                <input
                  type="radio"
                  name="payment_mode"
                  className="mr-2"
                  checked={paymentMode === PAYMENT_MODE_RESERVATION}
                  onChange={() => setPaymentMode(PAYMENT_MODE_RESERVATION)}
                />
                <span className="font-bold text-gray-900">Solo reserva</span>
                <span className="mt-1 block text-gray-600">S/ {reservationAmount.toFixed(2)}</span>
              </label>
              <label className={`cursor-pointer rounded-lg border px-4 py-3 text-sm ${paymentMode === PAYMENT_MODE_FULL ? 'border-black bg-gray-50' : 'border-gray-200'}`}>
                <input
                  type="radio"
                  name="payment_mode"
                  className="mr-2"
                  checked={paymentMode === PAYMENT_MODE_FULL}
                  onChange={() => setPaymentMode(PAYMENT_MODE_FULL)}
                />
                <span className="font-bold text-gray-900">Pago completo</span>
                <span className="mt-1 block text-gray-600">S/ {orderTotalWithSurcharge.toFixed(2)}</span>
              </label>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Pagos y comprobantes</p>
              <button
                type="button"
                onClick={addPaymentRow}
                className="inline-flex items-center gap-1 text-xs font-semibold text-gray-900 hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar método
              </button>
            </div>

            <div className="space-y-4">
              {paymentRows.map((row, index) => {
                const selectedMethod = findPaymentMethodById(checkoutPaymentMethods, row.id_payment_method)

                return (
                <div key={row.key} className="min-w-0 rounded-lg border border-gray-200 p-3 sm:p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-gray-900">Pago {index + 1}</p>
                    {paymentRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePaymentRow(row.key)}
                        className="text-gray-500 hover:text-gray-800"
                        aria-label="Eliminar pago"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2">
                    <label className="block min-w-0 text-sm">
                      <span className="mb-1 block text-gray-700">Método de pago</span>
                      <select
                        value={row.id_payment_method}
                        onChange={(e) => handlePaymentMethodChange(row.key, e.target.value)}
                        className="w-full max-w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-black focus:outline-none sm:text-sm"
                      >
                        <option value="">Seleccionar…</option>
                        {checkoutPaymentMethods.map((method) => (
                          <option key={method.id} value={String(method.id)}>
                            {method.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block min-w-0 text-sm">
                      <span className="mb-1 block text-gray-700">Monto (S/)</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={row.amount}
                        readOnly={index === 0}
                        onChange={(e) => updateRowAmount(row.key, e.target.value)}
                        className={`w-full max-w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-black focus:outline-none sm:text-sm ${
                          index === 0 ? 'cursor-default bg-gray-100 text-gray-700' : ''
                        }`}
                      />
                    </label>
                  </div>

                  <PaymentMethodCheckoutInfo method={selectedMethod} />

                  <div className="mt-3 min-w-0">
                    <p className="mb-1 text-sm text-gray-700">Comprobante(s)</p>
                    <label className="inline-flex w-full max-w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto sm:justify-start">
                      <Upload className="h-4 w-4" />
                      Adjuntar comprobante(s)
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFilesChange(row.key, e)}
                      />
                    </label>
                    {row.files.length > 0 && (
                      <ul className="mt-2 space-y-1 text-xs text-gray-600">
                        {row.files.map((file) => (
                          <li key={`${row.key}-${file.name}-${file.size}`}>{file.name}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 px-4 py-3 text-sm">
            <div className="flex justify-between font-bold text-gray-900">
              <span>Monto requerido</span>
              <span>S/ {expectedAmount.toFixed(2)}</span>
            </div>
            <div className="mt-1 flex justify-between font-bold text-gray-900">
              <span>Suma de pagos</span>
              <span>S/ {paidTotal.toFixed(2)}</span>
            </div>
            {!amountMatches && paidTotal > 0 && (
              <p className="mt-2 text-xs text-red-600">
                La suma de los pagos debe ser exactamente S/ {expectedAmount.toFixed(2)}.
              </p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Al enviar por WhatsApp tu pedido quedará pendiente de verificación en la tienda.
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="border-t px-4 py-3 sm:px-5 sm:py-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-black px-4 py-2.5 text-xs font-bold text-white hover:bg-gray-800 disabled:opacity-50 sm:py-3.5 sm:text-sm"
          >
            <MessageCircle className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
            {submitting ? 'Registrando pedido…' : 'Enviar por WhatsApp'}
          </button>
          <p className="mt-2 text-center text-[11px] text-gray-500 sm:text-xs">
            Primero guardamos tu pedido y comprobantes; luego se abre WhatsApp con el resumen.
          </p>
        </div>
      </div>

      {showCancelConfirm && (
        <CancelCheckoutConfirmModal
          open={showCancelConfirm}
          isProcessing={cancelling}
          error={error}
          onContinue={() => {
            setShowCancelConfirm(false)
            setError('')
          }}
          onConfirmCancel={confirmCancelReservation}
        />
      )}

      <PosSurchargeConfirmModal
        open={showPosSurchargeModal}
        baseTotal={orderTotal}
        onConfirm={confirmPosSurcharge}
        onCancel={cancelPosSurcharge}
      />
    </div>,
    document.body,
  )
}
