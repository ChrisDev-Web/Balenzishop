import { useMemo, useState } from 'react'
import { CalendarDays, Loader2 } from 'lucide-react'
import {
  formatDeliveryDateHeading,
  getDeliveryDateRange,
} from '../../utils/rainauDeliveryDates'
import RainauDeliveryDateModal from './RainauDeliveryDateModal'

export default function RainauDeliveryDatePicker({
  dates = [],
  value,
  isLoading = false,
  error = '',
  sameDayCutoffPassed = false,
  onChange,
  onRefreshDates,
  onCalendarOpenChange,
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const { minDate, maxDate } = useMemo(() => getDeliveryDateRange(dates), [dates])

  function openCalendar() {
    onRefreshDates?.({ silent: true })
    onCalendarOpenChange?.(true)
    setModalOpen(true)
  }

  function closeCalendar() {
    onCalendarOpenChange?.(false)
    setModalOpen(false)
  }

  function handleConfirm(date) {
    onChange(date)
    closeCalendar()
  }

  if (isLoading && dates.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando fechas disponibles…
      </div>
    )
  }

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-gray-900">Fecha de entrega Rainau</p>
      <p className="mb-3 text-xs text-gray-500">
        Elige un día dentro de la próxima semana. Los días bloqueados no están disponibles.
      </p>

      <button
        type="button"
        onClick={openCalendar}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 hover:border-gray-400 hover:bg-gray-50 sm:w-auto"
      >
        <CalendarDays className="h-4 w-4" />
        {value ? 'Cambiar fecha de entrega' : 'Elegir fecha de entrega'}
      </button>

      {value && (
        <p className="mt-2 text-xs text-gray-600">
          Entrega programada: {formatDeliveryDateHeading(value)}
        </p>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <RainauDeliveryDateModal
        open={modalOpen}
        dates={dates}
        minDate={minDate}
        maxDate={maxDate}
        value={value}
        sameDayCutoffPassed={sameDayCutoffPassed}
        onClose={closeCalendar}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
