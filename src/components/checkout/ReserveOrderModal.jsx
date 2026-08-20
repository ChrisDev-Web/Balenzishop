import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Trash2, Upload, MessageCircle, ChevronLeft, CreditCard } from 'lucide-react'
import { submitCheckoutOrder } from '../../api/clientOrders'
import { calculateReservationAmount } from '../../utils/reservation'
import { findPaymentMethodById } from '../../utils/paymentMethods'
import {
  allowsCashBalancePayment,
  allowsPosBalancePayment,
  filterCheckoutPaymentMethods,
  filterInitialPaymentMethods,
  isPosPaymentMethod,
  calculatePosSurcharge,
} from '../../utils/paymentSurcharge'
import { computeOrderTotal, DELIVERY_MODES } from '../../utils/deliveryFee'
import ShippingChargeDisplay from './ShippingChargeDisplay'
import { isOwnDeliveryType, isRainauDeliveryType } from '../../utils/deliveryTypes'
import { useRainauAvailableDeliveryDates } from '../../hooks/useRainauAvailableDeliveryDates'
import { useShalomAvailableDeliveryDates } from '../../hooks/useShalomAvailableDeliveryDates'
import PaymentMethodCheckoutInfo from './PaymentMethodCheckoutInfo'
import RainauDeliveryDatePicker from './RainauDeliveryDatePicker'
import CancelCheckoutConfirmModal, {
  cancelActiveCheckoutDraft,
} from './CancelCheckoutConfirmModal'
import CheckoutProofPolicyModal from './CheckoutProofPolicyModal'
import CheckoutProofPolicyConfirmModal from './CheckoutProofPolicyConfirmModal'
import { createClientId } from '../../utils/createClientId'
import {
  hasAcceptedProofPolicy,
  markProofPolicyAccepted,
} from '../../utils/proofPolicyStorage'
import { useAuthStore } from '../../stores/authStore'
import useBodyScrollLock from '../../hooks/useBodyScrollLock'

import {
  validateCustomPaymentAmount,
  formatPaymentModeLabel,
} from '../../utils/customPayment'

const PAYMENT_MODE_RESERVATION = 'reserva'
const PAYMENT_MODE_FULL = 'completo'
const PAYMENT_MODE_CUSTOM = 'personalizado'

const STEP_SUMMARY = 'summary'
const STEP_DELIVERY = 'delivery'
const STEP_PAYMENT = 'payment'
const STEP_FINAL = 'final'

const PROOF_WARNING =
  'No se aceptan comprobantes falsos, simulados o de fecha anterior. Puede cancelar tu pedido e iniciar acciones legales.'

const RESERVATION_NOTICE =
  'La reserva se descuenta del total; el saldo lo pagas en el siguiente paso.'

/** Altura fija para ~2 filas de producto; el resto hace scroll interno. */
const PRODUCT_LIST_SCROLL_CLASS = 'max-h-[11.5rem] overflow-y-auto overscroll-contain'

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

function getStepSubtitle(step, paymentMode, { isOwnDelivery = false, isShalomShipDate = false, balanceDue = 0 } = {}) {
  switch (step) {
    case STEP_SUMMARY:
      return 'Revisa los productos de tu pedido'
    case STEP_DELIVERY:
      if (isOwnDelivery) {
        return 'Elige la fecha de encuentro en el punto de entrega'
      }
      if (isShalomShipDate) {
        return 'Elige la fecha de envío a Shalom'
      }
      return 'Elige la fecha de entrega Balenzi'
    case STEP_PAYMENT:
      return 'Indica si pagarás la reserva, un monto personalizado o el total'
    case STEP_FINAL:
      return paymentMode === PAYMENT_MODE_FULL || balanceDue <= 0.009
        ? 'Confirma tu pedido antes de enviar'
        : 'Elige cómo cancelarás el saldo restante'
    default:
      return ''
  }
}

function hasBalanceAfterInitialPayment(mode, balance) {
  return (mode === PAYMENT_MODE_RESERVATION || mode === PAYMENT_MODE_CUSTOM)
    && balance > 0.009
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
  deliveryFee,
  deliveryMode,
  deliveryLabel,
  primaryAddress,
  accessToken,
  paymentMethods,
  onOrderCreated,
}) {
  const clientId = useAuthStore((state) => state.user?.id)
  const [step, setStep] = useState(STEP_SUMMARY)
  const [paymentMode, setPaymentMode] = useState(PAYMENT_MODE_RESERVATION)
  const [customPaymentAmount, setCustomPaymentAmount] = useState('')
  const [paymentRows, setPaymentRows] = useState([createPaymentRow()])
  const [remainderMethodId, setRemainderMethodId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showProofPolicyModal, setShowProofPolicyModal] = useState(false)
  const [showProofPolicyConfirm, setShowProofPolicyConfirm] = useState(false)
  const [calendarPickerOpen, setCalendarPickerOpen] = useState(false)
  const [scheduledDeliveryDate, setScheduledDeliveryDate] = useState('')

  const requiresScheduledDeliveryDate = deliveryMode === DELIVERY_MODES.DELIVERY
    || deliveryMode === DELIVERY_MODES.CUSTOMER_DELIVERY

  const requiresRainauDeliveryDate = requiresScheduledDeliveryDate
    && isRainauDeliveryType(primaryAddress?.deliveryType)

  const allowsPosForRemainder = allowsPosBalancePayment(
    deliveryMode,
    primaryAddress?.deliveryType,
  )

  const requiresOwnDeliveryMeetingDate = requiresScheduledDeliveryDate
    && isOwnDeliveryType(primaryAddress?.deliveryType)

  const requiresShalomShipDate = deliveryMode === DELIVERY_MODES.SHALON_FREE
    || deliveryMode === DELIVERY_MODES.SHALON_PAID

  const requiresDeliveryDateStep = requiresRainauDeliveryDate
    || requiresOwnDeliveryMeetingDate
    || requiresShalomShipDate

  const steps = useMemo(() => {
    const list = [STEP_SUMMARY]
    if (requiresDeliveryDateStep) list.push(STEP_DELIVERY)
    list.push(STEP_PAYMENT, STEP_FINAL)
    return list
  }, [requiresDeliveryDateStep])

  const stepIndex = steps.indexOf(step)
  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === steps.length - 1

  const initialPaymentMethods = useMemo(
    () => filterInitialPaymentMethods(paymentMethods),
    [paymentMethods],
  )

  const remainderPaymentMethods = useMemo(
    () => filterCheckoutPaymentMethods(paymentMethods, {
      rainauDelivery: allowsPosForRemainder,
      allowCash: allowsCashBalancePayment(deliveryMode),
    }),
    [paymentMethods, allowsPosForRemainder, deliveryMode],
  )

  const scheduledDeliveryMode = requiresOwnDeliveryMeetingDate ? 'customer_delivery' : 'delivery'

  const {
    dates: availableDeliveryDates,
    sameDayCutoffPassed,
    isLoading: deliveryDatesLoading,
    error: deliveryDatesError,
    refresh: refreshDeliveryDates,
  } = useRainauAvailableDeliveryDates(open && requiresRainauDeliveryDate, {
    deliveryMode: scheduledDeliveryMode,
    fastPoll: calendarPickerOpen,
  })

  const {
    dates: availableShalomDates,
    sameDayCutoffPassed: shalomSameDayCutoffPassed,
    isLoading: shalomDatesLoading,
    error: shalomDatesError,
    refresh: refreshShalomDates,
  } = useShalomAvailableDeliveryDates(open && requiresShalomShipDate, {
    fastPoll: calendarPickerOpen,
  })

  const rainauDeliveryFee = Number(primaryAddress?.deliveryFee || 0)
  const effectiveDeliveryFee = requiresRainauDeliveryDate && scheduledDeliveryDate
    ? rainauDeliveryFee
    : 0

  const reservationAmount = useMemo(
    () => calculateReservationAmount(items, { deliveryScope: primaryAddress?.deliveryScope }),
    [items, primaryAddress?.deliveryScope],
  )

  const reservationSummaryNotice = useMemo(() => {
    const paymentStep = steps.indexOf(STEP_PAYMENT) + 1
    return `En el paso ${paymentStep} te indicamos cuánto reservar por cada producto de tu pedido.`
  }, [steps])

  const orderTotal = useMemo(
    () => computeOrderTotal(subtotal, discount, effectiveDeliveryFee, deliveryMode),
    [subtotal, discount, effectiveDeliveryFee, deliveryMode],
  )

  const customPaymentValidation = useMemo(
    () => (paymentMode === PAYMENT_MODE_CUSTOM
      ? validateCustomPaymentAmount(customPaymentAmount, reservationAmount, orderTotal)
      : { valid: true, amount: null, message: '' }),
    [paymentMode, customPaymentAmount, reservationAmount, orderTotal],
  )

  const expectedAmount = useMemo(() => {
    if (paymentMode === PAYMENT_MODE_FULL) return orderTotal
    if (paymentMode === PAYMENT_MODE_CUSTOM) {
      return customPaymentValidation.valid ? customPaymentValidation.amount : 0
    }
    return reservationAmount
  }, [paymentMode, orderTotal, reservationAmount, customPaymentValidation])

  const balanceDue = useMemo(() => {
    if (paymentMode === PAYMENT_MODE_FULL) return 0
    if (paymentMode === PAYMENT_MODE_CUSTOM && customPaymentValidation.valid) {
      return roundMoney(Math.max(0, orderTotal - customPaymentValidation.amount))
    }
    if (paymentMode === PAYMENT_MODE_RESERVATION) {
      return roundMoney(Math.max(0, orderTotal - reservationAmount))
    }
    return roundMoney(Math.max(0, orderTotal - reservationAmount))
  }, [paymentMode, orderTotal, reservationAmount, customPaymentValidation])

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

  const selectedRemainderMethod = findPaymentMethodById(remainderPaymentMethods, remainderMethodId)
  const remainderIsPos = isPosPaymentMethod(selectedRemainderMethod)
  const remainderPosSurcharge = remainderIsPos ? calculatePosSurcharge(balanceDue) : 0

  const canContinueFromDelivery = !requiresDeliveryDateStep || Boolean(scheduledDeliveryDate)

  const canContinueFromPayment = amountMatches
    && allRowsValid
    && (paymentMode !== PAYMENT_MODE_CUSTOM || customPaymentValidation.valid)

  const canContinueFromFinal = paymentMode === PAYMENT_MODE_FULL
    || balanceDue <= 0.009
    || Boolean(remainderMethodId)

  const canSubmit = canContinueFromFinal && !submitting && !cancelling && draftOrderId

  useEffect(() => {
    if (!open) return

    setStep(STEP_SUMMARY)
    setPaymentMode(PAYMENT_MODE_RESERVATION)
    setCustomPaymentAmount('')
    setPaymentRows([createPaymentRow()])
    setRemainderMethodId('')
    setSubmitting(false)
    setCancelling(false)
    setError('')
    setShowCancelConfirm(false)
    setShowProofPolicyModal(false)
    setShowProofPolicyConfirm(false)
    setCalendarPickerOpen(false)
    setScheduledDeliveryDate('')
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

  useEffect(() => {
    setRemainderMethodId('')
    if (paymentMode !== PAYMENT_MODE_CUSTOM) {
      setCustomPaymentAmount('')
    }
  }, [paymentMode])

  useBodyScrollLock(open)

  if (!open) return null

  function updateRow(key, patch) {
    setPaymentRows((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }

  function handlePaymentMethodChange(rowKey, methodId) {
    updateRow(rowKey, { id_payment_method: methodId })
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

  function goBack() {
    if (isFirstStep || submitting) return
    setError('')
    setStep(steps[stepIndex - 1])
  }

  function goNext() {
    setError('')

    if (step === STEP_SUMMARY) {
      setStep(steps[1])
      return
    }

    if (step === STEP_DELIVERY) {
      if (!canContinueFromDelivery) {
        setError(
          requiresOwnDeliveryMeetingDate
            ? 'Selecciona una fecha de encuentro para continuar.'
            : requiresShalomShipDate
              ? 'Selecciona una fecha de envío a Shalom para continuar.'
              : 'Selecciona una fecha de entrega para continuar.',
        )
        return
      }
      setStep(steps[stepIndex + 1])
      return
    }

    if (step === STEP_PAYMENT) {
      if (paymentMode === PAYMENT_MODE_CUSTOM && !customPaymentValidation.valid) {
        setError(customPaymentValidation.message || 'Indica un monto personalizado válido.')
        return
      }
      if (!canContinueFromPayment) {
        setError('Completa el método de pago, el monto y adjunta al menos un comprobante.')
        return
      }
      if (clientId && hasAcceptedProofPolicy(clientId)) {
        setStep(STEP_FINAL)
        return
      }
      setShowProofPolicyConfirm(true)
    }
  }

  function handleAcceptProofPolicy() {
    if (clientId) {
      markProofPolicyAccepted(clientId)
    }
    setShowProofPolicyConfirm(false)
    setStep(STEP_FINAL)
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
          balancePaymentMethodId: hasBalanceAfterInitialPayment(paymentMode, balanceDue)
            ? Number(remainderMethodId)
            : undefined,
          delivery: (requiresScheduledDeliveryDate || requiresShalomShipDate)
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

      const balancePaymentPreference = selectedRemainderMethod
        ? {
            name: selectedRemainderMethod.name,
            posSurchargeNote: remainderIsPos
              ? `Recargo tarjeta (5%): S/ ${remainderPosSurcharge.toFixed(2)} sobre el saldo restante.`
              : null,
          }
        : null

      await onOrderCreated?.(response.data, { balancePaymentPreference })
      onClose()
    } catch (submitError) {
      setError(submitError.message || 'No se pudo registrar el pedido')
    } finally {
      setSubmitting(false)
    }
  }

  function renderStepContent() {
    if (step === STEP_SUMMARY) {
      return (
        <div className="space-y-4">
          <ul className={`divide-y rounded-lg border border-gray-200 ${PRODUCT_LIST_SCROLL_CLASS}`}>
            {items.map((item) => (
              <li
                key={item.idProductDecant ? `${item.id}-${item.idProductDecant}` : item.id}
                className="flex gap-3 px-4 py-3"
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-16 w-14 shrink-0 rounded object-contain bg-gray-50"
                  />
                ) : (
                  <div className="h-16 w-14 shrink-0 rounded bg-gray-100" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.brand}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {item.quantity} × S/ {Number(item.price).toFixed(2)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold text-gray-900">
                  S/ {(Number(item.price) * Number(item.quantity)).toFixed(2)}
                </p>
              </li>
            ))}
          </ul>

          <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal</span>
              <span>S/ {subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="mt-1 flex justify-between text-gray-700">
                <span>Descuento{discountCode ? ` (${discountCode})` : ''}</span>
                <span>- S/ {discount.toFixed(2)}</span>
              </div>
            )}
            <div className="mt-1 flex items-center justify-between gap-3 text-gray-700">
              <span className="shrink-0">Envío ({deliveryLabel || 'Delivery'})</span>
              <ShippingChargeDisplay
                deliveryFee={effectiveDeliveryFee || deliveryFee}
                deliveryMode={deliveryMode}
                className="min-w-0"
              />
            </div>
            <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 font-bold text-gray-900">
              <span>Total</span>
              <span>S/ {orderTotal.toFixed(2)}</span>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {reservationSummaryNotice}
            </p>
          </div>
        </div>
      )
    }

    if (step === STEP_DELIVERY) {
      if (requiresShalomShipDate) {
        return (
          <RainauDeliveryDatePicker
            variant="shalom"
            dates={availableShalomDates}
            value={scheduledDeliveryDate}
            isLoading={shalomDatesLoading}
            error={shalomDatesError}
            sameDayCutoffPassed={shalomSameDayCutoffPassed}
            onChange={setScheduledDeliveryDate}
            onRefreshDates={refreshShalomDates}
            onCalendarOpenChange={setCalendarPickerOpen}
          />
        )
      }

      return (
        <RainauDeliveryDatePicker
          variant={requiresOwnDeliveryMeetingDate ? 'own' : 'balenzi'}
          dates={availableDeliveryDates}
          value={scheduledDeliveryDate}
          isLoading={deliveryDatesLoading}
          error={deliveryDatesError}
          sameDayCutoffPassed={sameDayCutoffPassed}
          onChange={setScheduledDeliveryDate}
          onRefreshDates={refreshDeliveryDates}
          onCalendarOpenChange={setCalendarPickerOpen}
        />
      )
    }

    if (step === STEP_PAYMENT) {
      return (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs sm:text-sm ${paymentMode === PAYMENT_MODE_RESERVATION ? 'border-black bg-gray-50' : 'border-gray-200'}`}>
              <span className="flex min-w-0 items-center gap-1.5">
                <input
                  type="radio"
                  name="payment_mode"
                  className="h-3.5 w-3.5 shrink-0"
                  checked={paymentMode === PAYMENT_MODE_RESERVATION}
                  onChange={() => setPaymentMode(PAYMENT_MODE_RESERVATION)}
                />
                <span className="font-semibold text-gray-900">Solo reserva</span>
              </span>
              <span className="shrink-0 font-bold text-gray-900">S/ {reservationAmount.toFixed(2)}</span>
            </label>
            <label className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs sm:text-sm ${paymentMode === PAYMENT_MODE_FULL ? 'border-black bg-gray-50' : 'border-gray-200'}`}>
              <span className="flex min-w-0 items-center gap-1.5">
                <input
                  type="radio"
                  name="payment_mode"
                  className="h-3.5 w-3.5 shrink-0"
                  checked={paymentMode === PAYMENT_MODE_FULL}
                  onChange={() => setPaymentMode(PAYMENT_MODE_FULL)}
                />
                <span className="font-semibold text-gray-900">Pago completo</span>
              </span>
              <span className="shrink-0 font-bold text-gray-900">S/ {orderTotal.toFixed(2)}</span>
            </label>
            <label className={`flex cursor-pointer flex-col gap-2 rounded-lg border px-3 py-2 text-xs sm:text-sm sm:col-span-2 ${paymentMode === PAYMENT_MODE_CUSTOM ? 'border-black bg-gray-50' : 'border-gray-200'}`}>
              <span className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="payment_mode"
                  className="h-3.5 w-3.5 shrink-0"
                  checked={paymentMode === PAYMENT_MODE_CUSTOM}
                  onChange={() => setPaymentMode(PAYMENT_MODE_CUSTOM)}
                />
                <span className="font-semibold text-gray-900">Pago personalizado</span>
              </span>
              {paymentMode === PAYMENT_MODE_CUSTOM && (
                <div>
                  <label className="block text-[11px] text-gray-600">
                    Monto a pagar ahora (mayor a S/ {reservationAmount.toFixed(2)}, máx. S/ {orderTotal.toFixed(2)})
                  </label>
                  <input
                    type="number"
                    min={roundMoney(reservationAmount + 0.1)}
                    max={orderTotal}
                    step="0.1"
                    inputMode="decimal"
                    placeholder="Ej. 250.50"
                    value={customPaymentAmount}
                    onChange={(event) => setCustomPaymentAmount(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-2 text-sm focus:border-black focus:outline-none"
                  />
                  {!customPaymentValidation.valid && customPaymentAmount.trim() !== '' && (
                    <p className="mt-1 text-[11px] text-red-600">{customPaymentValidation.message}</p>
                  )}
                </div>
              )}
            </label>
          </div>

          {hasBalanceAfterInitialPayment(paymentMode, balanceDue) && (
            <p className="text-[11px] leading-snug text-gray-500">{RESERVATION_NOTICE}</p>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-gray-900">Método y comprobante</p>
              {paymentRows.length > 1 && (
                <button
                  type="button"
                  onClick={addPaymentRow}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-900 hover:underline"
                >
                  <Plus className="h-3 w-3" />
                  Agregar
                </button>
              )}
            </div>

            <div className="space-y-2">
              {paymentRows.map((row, index) => {
                const selectedMethod = findPaymentMethodById(initialPaymentMethods, row.id_payment_method)

                return (
                  <div key={row.key} className="min-w-0 rounded-lg border border-gray-200 p-2.5">
                    {paymentRows.length > 1 && (
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-gray-900">Pago {index + 1}</p>
                        <button
                          type="button"
                          onClick={() => removePaymentRow(row.key)}
                          className="text-gray-500 hover:text-gray-800"
                          aria-label="Eliminar pago"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    <div className={`gap-2 ${paymentRows.length > 1 ? 'grid sm:grid-cols-[1fr_5.5rem]' : ''}`}>
                      <label className="block min-w-0 text-xs">
                        <span className="mb-0.5 block text-gray-600">Método</span>
                        <select
                          value={row.id_payment_method}
                          onChange={(e) => handlePaymentMethodChange(row.key, e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-2.5 py-2 text-sm focus:border-black focus:outline-none"
                        >
                          <option value="">Seleccionar…</option>
                          {initialPaymentMethods.map((method) => (
                            <option key={method.id ?? method.id_payment_method} value={String(method.id ?? method.id_payment_method)}>
                              {method.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      {paymentRows.length > 1 && (
                        <label className="block min-w-0 text-xs">
                          <span className="mb-0.5 block text-gray-600">Monto</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={row.amount}
                            readOnly={index === 0}
                            onChange={(e) => updateRowAmount(row.key, e.target.value)}
                            className={`w-full rounded-lg border border-gray-300 px-2.5 py-2 text-sm focus:border-black focus:outline-none ${
                              index === 0 ? 'cursor-default bg-gray-100 text-gray-700' : ''
                            }`}
                          />
                        </label>
                      )}
                    </div>

                    {paymentRows.length === 1 && expectedAmount > 0 && (
                      <p className="mt-1.5 text-[11px] text-gray-500">
                        Monto a pagar: <span className="font-semibold text-gray-800">S/ {expectedAmount.toFixed(2)}</span>
                      </p>
                    )}

                    <PaymentMethodCheckoutInfo method={selectedMethod} compact />

                    <div className="mt-2 min-w-0">
                      <label className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                        <Upload className="h-3.5 w-3.5" />
                        Adjuntar comprobante
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/jpg"
                          multiple
                          className="hidden"
                          onChange={(e) => handleFilesChange(row.key, e)}
                        />
                      </label>
                      {row.files.length > 0 && (
                        <p className="mt-1 truncate text-[11px] text-gray-600">
                          {row.files.map((file) => file.name).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {paymentRows.length === 1 && (
              <button
                type="button"
                onClick={addPaymentRow}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 hover:underline"
              >
                <Plus className="h-3 w-3" />
                Dividir en más de un método
              </button>
            )}

            <p className="text-[11px] leading-snug text-amber-800">
              {PROOF_WARNING}{' '}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  setShowProofPolicyModal(true)
                }}
                className="font-semibold underline hover:text-amber-900"
              >
                Ver términos
              </button>
            </p>

            {!amountMatches && paidTotal > 0 && expectedAmount > 0 && (
              <p className="text-xs text-red-600">
                La suma debe ser S/ {expectedAmount.toFixed(2)} (actual: S/ {paidTotal.toFixed(2)}).
              </p>
            )}
          </div>
        </div>
      )
    }

    if (step === STEP_FINAL && hasBalanceAfterInitialPayment(paymentMode, balanceDue)) {
      const initialPaymentLabel = paymentMode === PAYMENT_MODE_CUSTOM
        ? 'Pago personalizado'
        : 'Reserva pagada'

      return (
        <div className="space-y-3">
          <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs">
            <div className="flex justify-between gap-2">
              <span className="text-gray-600">{initialPaymentLabel}</span>
              <span className="font-bold text-gray-900">
                S/ {paidTotal.toFixed(2)}
                {paymentRows[0] && (
                  <span className="font-normal text-gray-600">
                    {' '}· {findPaymentMethodById(initialPaymentMethods, paymentRows[0].id_payment_method)?.name || 'Método'}
                  </span>
                )}
              </span>
            </div>
            <div className="mt-1 flex justify-between gap-2 border-t border-gray-200 pt-1">
              <span className="text-gray-600">Saldo pendiente</span>
              <span className="font-bold text-gray-900">S/ {balanceDue.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-gray-900">¿Cómo cancelarás el saldo?</p>

            <div className="grid grid-cols-2 gap-2">
              {remainderPaymentMethods.map((method) => {
                const methodId = String(method.id ?? method.id_payment_method)
                const isSelected = remainderMethodId === methodId
                const isPos = isPosPaymentMethod(method)

                return (
                  <button
                    key={methodId}
                    type="button"
                    onClick={() => setRemainderMethodId(methodId)}
                    className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                      isSelected ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 font-semibold text-gray-900">
                      {isPos && <CreditCard className="h-3.5 w-3.5 shrink-0" />}
                      {method.name}
                    </span>
                    {isPos && (
                      <span className="mt-0.5 block text-[10px] text-gray-500">+5% al pagar</span>
                    )}
                  </button>
                )
              })}
            </div>

            {remainderIsPos && (
              <p className="mt-2 text-[11px] leading-snug text-amber-900">
                Recargo del 5% al pagar el saldo: S/ {remainderPosSurcharge.toFixed(2)} sobre S/ {balanceDue.toFixed(2)}.
              </p>
            )}

            {selectedRemainderMethod && !remainderIsPos && (
              <div className="mt-2">
                <PaymentMethodCheckoutInfo method={selectedRemainderMethod} compact />
              </div>
            )}
          </div>
        </div>
      )
    }

    if (step === STEP_FINAL && (paymentMode === PAYMENT_MODE_FULL || balanceDue <= 0.009)) {
      return (
        <div className="space-y-3">
          <ul className={`divide-y rounded-lg border border-gray-200 ${PRODUCT_LIST_SCROLL_CLASS}`}>
            {items.map((item) => (
              <li
                key={item.idProductDecant ? `${item.id}-${item.idProductDecant}` : item.id}
                className="flex gap-3 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-[11px] text-gray-500">{item.brand} · Cant. {item.quantity}</p>
                </div>
                <p className="shrink-0 text-sm font-bold text-gray-900">
                  S/ {(Number(item.price) * Number(item.quantity)).toFixed(2)}
                </p>
              </li>
            ))}
          </ul>

          <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs space-y-0.5">
            <p className="font-bold text-gray-900">{formatPaymentModeLabel(paymentMode)}</p>
            {requiresDeliveryDateStep && scheduledDeliveryDate && (
              <p className="text-gray-700">
                {requiresOwnDeliveryMeetingDate ? 'Encuentro' : 'Entrega'}: {scheduledDeliveryDate}
              </p>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-1 font-bold text-gray-900">
              <span>Total pagado</span>
              <span>S/ {paidTotal.toFixed(2)}</span>
            </div>
          </div>

          <ul className="space-y-1.5 text-xs text-gray-700">
            {paymentRows.map((row, index) => {
              const method = findPaymentMethodById(initialPaymentMethods, row.id_payment_method)
              return (
                <li key={row.key} className="flex justify-between rounded-lg border border-gray-200 px-2.5 py-1.5">
                  <span>{method?.name || `Pago ${index + 1}`}</span>
                  <span className="font-bold text-gray-900">S/ {Number(row.amount).toFixed(2)}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )
    }

    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
      <div
        role="dialog"
        aria-labelledby="reserve-order-title"
        className="relative z-10 flex max-h-[92dvh] w-full min-w-0 max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Paso {stepIndex + 1} de {steps.length}
            </p>
            <h2 id="reserve-order-title" className="text-base font-bold text-gray-900 sm:text-lg">
              Reservar pedido
            </h2>
            <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
              {getStepSubtitle(step, paymentMode, {
                isOwnDelivery: requiresOwnDeliveryMeetingDate,
                isShalomShipDate: requiresShalomShipDate,
                balanceDue,
              })}
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

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 sm:px-5 sm:py-4">
          {renderStepContent()}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="border-t px-4 py-3 sm:px-5 sm:py-4">
          {isLastStep ? (
            <>
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
                Registramos tu pedido y luego se abre WhatsApp con el resumen.
              </p>
            </>
          ) : (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              {isFirstStep ? (
                <button
                  type="button"
                  onClick={requestClose}
                  disabled={submitting || cancelling}
                  className="rounded-full border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goBack}
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Atrás
                </button>
              )}
              <button
                type="button"
                onClick={goNext}
                disabled={submitting}
                className="rounded-full bg-black px-6 py-2.5 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-50"
              >
                Continuar
              </button>
            </div>
          )}

          {!isLastStep && isFirstStep && (
            <p className="mt-2 text-center text-[11px] text-gray-500 sm:text-xs">
              Al cancelar liberamos el stock reservado de tu pedido.
            </p>
          )}
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

      <CheckoutProofPolicyModal
        open={showProofPolicyModal}
        onClose={() => setShowProofPolicyModal(false)}
      />

      <CheckoutProofPolicyConfirmModal
        open={showProofPolicyConfirm}
        onAccept={handleAcceptProofPolicy}
        onDecline={() => setShowProofPolicyConfirm(false)}
      />
    </div>,
    document.body,
  )
}
