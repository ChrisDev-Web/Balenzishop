import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Ban, ChevronLeft, ChevronRight, X } from 'lucide-react'
import {
  WEEKDAY_LABELS,
  buildCalendarCells,
  canNavigateCalendarMonth,
  createDeliveryDatesLookup,
  formatMonthLabel,
  getInitialCalendarMonth,
  isDeliveryDateSelectable,
} from '../../utils/rainauDeliveryDates'

export default function RainauDeliveryDateModal({
  open,
  dates = [],
  minDate = '',
  maxDate = '',
  value = '',
  sameDayCutoffPassed = false,
  onClose,
  onConfirm,
}) {
  const lookup = useMemo(() => createDeliveryDatesLookup(dates), [dates])
  const [{ year, month }, setViewMonth] = useState(() => getInitialCalendarMonth(value, minDate))
  const [pendingDate, setPendingDate] = useState(value)

  useEffect(() => {
    if (!open) return

    setViewMonth(getInitialCalendarMonth(value, minDate))
    setPendingDate(value)
  }, [open, value, minDate])

  useEffect(() => {
    if (!open) return

    if (pendingDate && !isDeliveryDateSelectable(pendingDate, lookup, minDate, maxDate)) {
      setPendingDate('')
    }
  }, [open, dates, lookup, minDate, maxDate, pendingDate])

  if (!open) return null

  const cells = buildCalendarCells(year, month)
  const canGoPrevious = canNavigateCalendarMonth(year, month, minDate, maxDate, 'prev')
  const canGoNext = canNavigateCalendarMonth(year, month, minDate, maxDate, 'next')
  const canConfirm = isDeliveryDateSelectable(pendingDate, lookup, minDate, maxDate)

  function goToPreviousMonth() {
    if (!canGoPrevious) return

    setViewMonth((current) => (
      current.month === 1
        ? { year: current.year - 1, month: 12 }
        : { year: current.year, month: current.month - 1 }
    ))
  }

  function goToNextMonth() {
    if (!canGoNext) return

    setViewMonth((current) => (
      current.month === 12
        ? { year: current.year + 1, month: 1 }
        : { year: current.year, month: current.month + 1 }
    ))
  }

  function handleDayClick(dateString) {
    if (!isDeliveryDateSelectable(dateString, lookup, minDate, maxDate)) return
    setPendingDate(dateString)
  }

  function handleConfirm() {
    if (!canConfirm) return
    onConfirm(pendingDate)
  }

  return createPortal(
    <div className="fixed inset-0 z-[260] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-labelledby="rainau-delivery-date-title"
        className="relative z-10 w-full max-w-md rounded-t-2xl bg-white shadow-2xl sm:rounded-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b px-4 py-4 sm:px-5">
          <div>
            <h3 id="rainau-delivery-date-title" className="text-lg font-bold text-gray-900">
              Elegir fecha de entrega
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Puedes elegir hasta 1 semana. Los días bloqueados no están disponibles.
            </p>
            {sameDayCutoffPassed && (
              <p className="mt-1 text-xs font-bold text-gray-900">
                Las reservas para hoy solo están disponibles antes de las 10:00 a.m.
              </p>
            )}
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

        <div className="px-4 py-4 sm:px-5">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={goToPreviousMonth}
              disabled={!canGoPrevious}
              className="rounded-full border border-gray-200 p-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-bold text-gray-900">{formatMonthLabel(year, month)}</p>
            <button
              type="button"
              onClick={goToNextMonth}
              disabled={!canGoNext}
              className="rounded-full border border-gray-200 p-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label} className="py-1">{label}</span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((cell) => {
              if (cell.outside || !cell.date) {
                return (
                  <div
                    key={cell.key}
                    className="flex h-11 items-center justify-center text-sm text-gray-300"
                  >
                    {cell.day}
                  </div>
                )
              }

              const entry = lookup.get(cell.date)
              const isSelectable = isDeliveryDateSelectable(cell.date, lookup, minDate, maxDate)
              const isBlocked = Boolean(entry?.blocked)
              const isSelected = pendingDate === cell.date

              return (
                <button
                  key={cell.key}
                  type="button"
                  disabled={!isSelectable}
                  onClick={() => handleDayClick(cell.date)}
                  className={[
                    'flex h-11 flex-col items-center justify-center rounded-xl border text-sm font-semibold transition',
                    !entry
                      ? 'cursor-not-allowed border-transparent text-gray-300'
                      : isBlocked
                        ? 'cursor-not-allowed border-red-200 bg-red-50 text-red-400'
                        : isSelected
                          ? 'border-black bg-gray-900 text-white'
                          : 'border-gray-200 bg-white text-gray-900 hover:border-gray-400',
                  ].join(' ')}
                  aria-pressed={isSelected}
                  aria-label={entry?.label || cell.date}
                >
                  <span>{cell.day}</span>
                  {isBlocked && (
                    <Ban className="mt-0.5 h-3 w-3" aria-hidden="true" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t px-4 py-4 sm:flex-row sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="flex-1 rounded-full bg-black py-2.5 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            Confirmar fecha
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
