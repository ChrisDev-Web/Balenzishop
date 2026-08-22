import rainauCoverageZones from '../data/rainauCoverageZones.json'

export const RAINAU_COVERAGE_ZONES = rainauCoverageZones

/** Carpeta Future del KMZ de Rainau: oculta por ahora. Activar más adelante si Rainau la habilita. */
const HIDDEN_FUTURE_ZONE_NAMES = new Set([
  'Marquez - Ventanilla',
  'Cerrado por alto transito',
])

export function isRainauCoverageZoneVisible(zone) {
  return !HIDDEN_FUTURE_ZONE_NAMES.has(String(zone?.name ?? '').trim())
}

export const VISIBLE_RAINAU_COVERAGE_ZONES = RAINAU_COVERAGE_ZONES.filter(isRainauCoverageZoneVisible)

export const RAINAU_COVERAGE_KIND = {
  ZONE_10: 'zone10',
  ZONE_15: 'zone15',
  NO_COVERAGE: 'no_coverage',
}

const BLUE_FILL_COLORS = new Set(['#1a237e'])

export const RAINAU_DELIVERY_SCHEDULE = {
  BLUE: 'blue',
  STANDARD: 'standard',
}

function coveragePalette(zone) {
  const fill = String(zone?.fillColor ?? '').trim().toLowerCase()
  if (BLUE_FILL_COLORS.has(fill)) return 'blue'
  if (zone?.kind === RAINAU_COVERAGE_KIND.NO_COVERAGE) return 'red'
  return 'green'
}

export function isBlueRainauCoverage(coverage) {
  return coverage?.schedule === RAINAU_DELIVERY_SCHEDULE.BLUE
}

export function getRainauScheduleConfirmMessage(coverage) {
  if (isBlueRainauCoverage(coverage)) {
    return 'Los envíos de delivery son los días Martes - Jueves - Sábado.'
  }
  if (coverage?.palette === 'green') {
    return 'En esta zona los envíos de delivery son de Lunes a Sábado.'
  }
  return ''
}

const MATCH_ORDER = [
  RAINAU_COVERAGE_KIND.NO_COVERAGE,
  RAINAU_COVERAGE_KIND.ZONE_15,
  RAINAU_COVERAGE_KIND.ZONE_10,
]

export const RAINAU_COVERAGE_STYLES = {
  [RAINAU_COVERAGE_KIND.ZONE_10]: {
    color: '#87ceac',
    fillColor: '#87ceac',
    fillOpacity: 0.35,
    weight: 1.5,
  },
  [RAINAU_COVERAGE_KIND.ZONE_15]: {
    color: '#097138',
    fillColor: '#097138',
    fillOpacity: 0.32,
    weight: 1.5,
  },
  [RAINAU_COVERAGE_KIND.NO_COVERAGE]: {
    color: '#ff5252',
    fillColor: '#ff5252',
    fillOpacity: 0.35,
    weight: 1.5,
  },
}

export function getRainauCoverageLeafletStyle(zone) {
  const fallback = RAINAU_COVERAGE_STYLES[zone?.kind] || RAINAU_COVERAGE_STYLES[RAINAU_COVERAGE_KIND.NO_COVERAGE]
  const fillColor = zone?.fillColor || fallback.fillColor
  const strokeColor = zone?.strokeColor || fallback.color

  return {
    color: strokeColor,
    fillColor,
    fillOpacity: zone?.kind === RAINAU_COVERAGE_KIND.NO_COVERAGE ? 0.38 : 0.34,
    weight: 1.5,
  }
}

function pointInRing(lat, lng, ring) {
  let inside = false

  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const latI = ring[index][0]
    const lngI = ring[index][1]
    const latJ = ring[previous][0]
    const lngJ = ring[previous][1]
    const deltaLat = latJ - latI

    if (deltaLat === 0) continue

    const intersects = (latI > lat) !== (latJ > lat)
      && lng < ((lngJ - lngI) * (lat - latI)) / deltaLat + lngI

    if (intersects) inside = !inside
  }

  return inside
}

function zoneContainsPoint(zone, lat, lng) {
  return zone.rings.some((ring) => ring.length >= 3 && pointInRing(lat, lng, ring))
}

export function isSelectableRainauCoverage(coverage) {
  return Boolean(coverage?.mapped)
}

export const RAINAU_COVERAGE_REQUIRED_MESSAGE =
  'El pin debe quedar sobre una zona de color (verde, azul o rojo). No se puede marcar donde el mapa no tiene cobertura pintada.'

export function resolveRainauCoverage(lat, lng) {
  const latitude = Number(lat)
  const longitude = Number(lng)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null
  }

  for (const kind of MATCH_ORDER) {
    const match = VISIBLE_RAINAU_COVERAGE_ZONES.find(
      (zone) => zone.kind === kind && zoneContainsPoint(zone, latitude, longitude),
    )

    if (match) {
      return {
        kind: match.kind,
        fee: Number(match.fee) || 0,
        zoneId: match.kind === RAINAU_COVERAGE_KIND.ZONE_10
          ? 'zona_10'
          : match.kind === RAINAU_COVERAGE_KIND.ZONE_15
            ? 'zona_15'
            : 'sin_cobertura',
        name: match.name,
        mapped: true,
        palette: coveragePalette(match),
        schedule: coveragePalette(match) === 'blue'
          ? RAINAU_DELIVERY_SCHEDULE.BLUE
          : RAINAU_DELIVERY_SCHEDULE.STANDARD,
      }
    }
  }

  return {
    kind: RAINAU_COVERAGE_KIND.NO_COVERAGE,
    fee: 0,
    zoneId: 'sin_cobertura',
    name: 'Fuera de cobertura',
    mapped: false,
    palette: 'none',
    schedule: RAINAU_DELIVERY_SCHEDULE.STANDARD,
  }
}

export function getRainauCoverageQuoteLabel(coverage) {
  if (!coverage) return ''
  if (coverage.fee > 0) return `Delivery: S/ ${Number(coverage.fee).toFixed(2)}`
  if (coverage.mapped) return 'Delivery: con cargo (se coordina por WhatsApp)'
  return 'Fuera de zona pintada: mueve el pin a verde, azul o rojo'
}
