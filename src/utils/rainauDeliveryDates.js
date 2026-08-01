const APP_TIMEZONE = 'America/Lima'

export const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export const SAME_DAY_CUTOFF_HOUR = 10

export function getTodayDateString() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export function hasSameDayCutoffPassed(now = new Date()) {
  const hour = Number(new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIMEZONE,
    hour: 'numeric',
    hour12: false,
  }).format(now))

  return hour >= SAME_DAY_CUTOFF_HOUR
}

export function formatDeliveryDateHeading(dateString) {
  if (!dateString) return ''

  const date = new Date(`${dateString}T12:00:00`)
  const label = date.toLocaleDateString('es-PE', {
    timeZone: APP_TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function formatMonthLabel(year, month) {
  const label = new Date(year, month - 1, 1).toLocaleDateString('es-PE', {
    month: 'long',
    year: 'numeric',
  })

  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function buildCalendarCells(year, month) {
  const firstDay = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  const startOffset = (firstDay.getDay() + 6) % 7
  const cells = []

  const previousMonthDays = new Date(year, month - 1, 0).getDate()
  for (let index = startOffset - 1; index >= 0; index -= 1) {
    cells.push({
      key: `prev-${index}`,
      day: previousMonthDays - index,
      outside: true,
      date: null,
    })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const monthString = String(month).padStart(2, '0')
    const dayString = String(day).padStart(2, '0')
    cells.push({
      key: `${year}-${monthString}-${dayString}`,
      day,
      outside: false,
      date: `${year}-${monthString}-${dayString}`,
    })
  }

  let nextMonthDay = 1
  while (cells.length % 7 !== 0) {
    cells.push({
      key: `next-${nextMonthDay}`,
      day: nextMonthDay,
      outside: true,
      date: null,
    })
    nextMonthDay += 1
  }

  return cells
}

export function createDeliveryDatesLookup(dates = []) {
  return new Map((dates ?? []).map((entry) => [entry.date, entry]))
}

export function getDeliveryDateRange(dates = []) {
  if (!dates.length) {
    return { minDate: '', maxDate: '' }
  }

  return {
    minDate: dates[0].date,
    maxDate: dates[dates.length - 1].date,
  }
}

export function isDateWithinDeliveryRange(dateString, minDate, maxDate) {
  if (!dateString || !minDate || !maxDate) return false
  return dateString >= minDate && dateString <= maxDate
}

export function isDeliveryDateSelectable(dateString, lookup, minDate, maxDate) {
  if (!isDateWithinDeliveryRange(dateString, minDate, maxDate)) return false

  const entry = lookup.get(dateString)
  return Boolean(entry) && !entry.blocked
}

export function getInitialCalendarMonth(dateString, minDate) {
  const source = dateString || minDate || getTodayDateString()
  const [year, month] = source.split('-').map(Number)
  return { year, month }
}

function monthKey(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function canNavigateCalendarMonth(year, month, minDate, maxDate, direction) {
  if (!minDate || !maxDate) return false

  const minMonth = minDate.slice(0, 7)
  const maxMonth = maxDate.slice(0, 7)

  if (direction === 'prev') {
    const previous = month === 1
      ? monthKey(year - 1, 12)
      : monthKey(year, month - 1)

    return previous >= minMonth
  }

  const next = month === 12
    ? monthKey(year + 1, 1)
    : monthKey(year, month + 1)

  return next <= maxMonth
}
