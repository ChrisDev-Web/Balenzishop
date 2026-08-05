export function formatRelativeReviewDate(isoDate) {
  if (!isoDate) return ''

  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return isoDate

  const diffMs = Date.now() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return 'hoy'
  if (diffDays === 1) return 'hace 1 día'
  if (diffDays < 7) return `hace ${diffDays} días`

  const diffWeeks = Math.floor(diffDays / 7)
  if (diffWeeks === 1) return 'hace 1 semana'
  if (diffWeeks < 5) return `hace ${diffWeeks} semanas`

  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths === 1) return 'hace 1 mes'
  if (diffMonths < 12) return `hace ${diffMonths} meses`

  const diffYears = Math.floor(diffDays / 365)
  if (diffYears === 1) return 'hace 1 año'
  return `hace ${diffYears} años`
}

export function buildReviewCardTitle(comment = '') {
  const firstLine = comment.trim().split('\n')[0]?.trim() ?? ''
  if (!firstLine) return 'Comentario'

  if (firstLine.length <= 48) return firstLine

  return `${firstLine.slice(0, 48).trim()}…`
}
