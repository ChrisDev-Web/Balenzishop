/** Mapa oficial Rainau Courier: https://rainau.pe/mapa-cobertura */

export const RAINAU_MAP_URL = 'https://rainau.pe/mapa-cobertura'

export const DELIVERY_FEES = {
  green: 10,
  green_dark: 15,
  blue: 15,
  /** Zona roja: recojo Shalon; cargo lo define Shalon al enviar (no sumar al total) */
  red: 0,
  unknown: 0,
}

/** Verde claro — lunes a sábado · S/ 10 */
const GREEN_LIGHT = [
  'Miraflores',
  'San Isidro',
  'Santiago de Surco',
  'Surco',
  'La Molina',
  'San Borja',
  'Barranco',
  'Lince',
  'Magdalena del Mar',
  'Magdalena',
  'Jesús María',
  'San Miguel',
  'Pueblo Libre',
]

/** Verde oscuro — lunes a sábado · S/ 15 */
const GREEN_DARK = [
  'Breña',
  'Surquillo',
  'La Victoria',
  'Ate',
  'Santa Anita',
  'San Luis',
  'Chorrillos',
  'El Agustino',
  'Independencia',
  'Santa María del Mar',
  'San Bartolo',
  'Pachacámac',
  'Lurín',
  'Chaclacayo',
  'Cieneguilla',
  'Punta Hermosa',
  'Punta Negra',
  'Pucusana',
  'Ancón',
]

/** Azul — martes, jueves y sábados · S/ 15 */
const BLUE = [
  'Comas',
  'Los Olivos',
  'San Juan de Lurigancho',
  'Villa El Salvador',
  'Villa María del Triunfo',
  'San Juan de Miraflores',
  'Carabayllo',
  'Puente Piedra',
  'Santa Rosa',
]

/** Rojo — sin delivery */
const RED = [
  'Rímac',
  'San Martín de Porres',
  'Callao',
  'Bellavista',
  'La Perla',
  'Carmen de la Legua',
  'Ventanilla',
]

function buildZoneMap() {
  const map = {}
  GREEN_LIGHT.forEach((d) => { map[d] = 'green' })
  GREEN_DARK.forEach((d) => { map[d] = 'green_dark' })
  BLUE.forEach((d) => { map[d] = 'blue' })
  RED.forEach((d) => { map[d] = 'red' })
  return map
}

export const RAINAU_DISTRICT_ZONES = buildZoneMap()

export const COVERAGE_MESSAGES = {
  green: {
    title: 'Cobertura regular',
    message:
      'Su ubicación está en cobertura de entrega de lunes a sábado. Delivery: S/ 10.00',
    className: 'border-green-200 bg-green-50 text-green-900',
    dotClass: 'bg-green-400',
  },
  green_dark: {
    title: 'Cobertura extendida',
    message:
      'Su ubicación está en cobertura de entrega de lunes a sábado (zona extendida). Delivery: S/ 15.00',
    className: 'border-green-300 bg-green-100 text-green-950',
    dotClass: 'bg-green-700',
  },
  blue: {
    title: 'Cobertura programada',
    message:
      'Su ubicación está en cobertura programada: entregas los martes, jueves y sábados. Delivery: S/ 15.00',
    className: 'border-blue-200 bg-blue-50 text-blue-900',
    dotClass: 'bg-blue-500',
  },
  red: {
    title: 'Sin cobertura de delivery',
    message:
      'Su ubicación no tiene cobertura de delivery (zona sin acceso operativo o de riesgo). Recojo en el Shalon más cercano (con cargo; se informará al cliente al despachar).',
    className: 'border-red-200 bg-red-50 text-red-900',
    dotClass: 'bg-red-500',
  },
  unknown: {
    title: 'Cobertura no identificada',
    message:
      'No pudimos confirmar la cobertura de delivery para su distrito. Revise el mapa oficial o elija un Shalon cercano.',
    className: 'border-amber-200 bg-amber-50 text-amber-900',
    dotClass: 'bg-amber-500',
  },
}

function normalize(name) {
  return (name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

const DISTRICT_ALIASES = {
  surco: 'Santiago de Surco',
  'santiago de surco': 'Santiago de Surco',
  magdalena: 'Magdalena del Mar',
  lurigancho: 'San Juan de Lurigancho',
  'san juan de lurigancho': 'San Juan de Lurigancho',
  ancon: 'Ancón',
  'veintiseis de octubre': 'Veintiséis de Octubre',
  '26 de octubre': 'Veintiséis de Octubre',
}

export function canonicalDistrictName(name) {
  if (!name) return name
  const key = normalize(name)
  return DISTRICT_ALIASES[key] || name
}

export function matchRainauDistrict(districtName) {
  if (!districtName) return null
  const normalized = normalize(districtName)
  const canonical = normalize(canonicalDistrictName(districtName))

  for (const [district, zone] of Object.entries(RAINAU_DISTRICT_ZONES)) {
    const key = normalize(district)
    if (
      normalized === key ||
      canonical === key ||
      normalized.includes(key) ||
      key.includes(normalized) ||
      canonical.includes(key) ||
      key.includes(canonical)
    ) {
      return { district, zone }
    }
  }
  return null
}

export function getDeliveryFeeForZone(zone) {
  return DELIVERY_FEES[zone] ?? 0
}

/**
 * Zonas aproximadas por coordenadas (alineadas al mapa Rainau).
 * Se evalúan en orden: rojo > azul > verde oscuro > verde claro.
 * Formato: { zone, district, minLat, maxLat, minLng, maxLng }
 */
const COORD_ZONE_BOUNDS = [
  // —— ROJO (sin delivery) ——
  { zone: 'red', district: 'San Martín de Porres', minLat: -12.08, maxLat: -11.93, minLng: -77.14, maxLng: -77.02 },
  { zone: 'red', district: 'Rímac', minLat: -12.06, maxLat: -11.98, minLng: -77.04, maxLng: -76.98 },
  { zone: 'red', district: 'Callao', minLat: -12.08, maxLat: -11.99, minLng: -77.18, maxLng: -77.06 },
  { zone: 'red', district: 'Bellavista', minLat: -12.07, maxLat: -12.03, minLng: -77.12, maxLng: -77.08 },
  { zone: 'red', district: 'La Perla', minLat: -12.09, maxLat: -12.04, minLng: -77.14, maxLng: -77.10 },
  { zone: 'red', district: 'Ventanilla', minLat: -11.93, maxLat: -11.82, minLng: -77.17, maxLng: -77.06 },
  { zone: 'red', district: 'Carmen de la Legua', minLat: -12.06, maxLat: -12.02, minLng: -77.10, maxLng: -77.07 },

  // —— AZUL (M-J-S · S/ 15) ——
  { zone: 'blue', district: 'Los Olivos', minLat: -12.02, maxLat: -11.94, minLng: -77.065, maxLng: -77.00 },
  { zone: 'blue', district: 'Comas', minLat: -11.98, maxLat: -11.86, minLng: -77.08, maxLng: -76.98 },
  { zone: 'blue', district: 'San Juan de Lurigancho', minLat: -12.05, maxLat: -11.92, minLng: -76.98, maxLng: -76.82 },
  { zone: 'blue', district: 'Villa El Salvador', minLat: -12.25, maxLat: -12.17, minLng: -76.97, maxLng: -76.90 },
  { zone: 'blue', district: 'Villa María del Triunfo', minLat: -12.19, maxLat: -12.12, minLng: -76.97, maxLng: -76.90 },
  { zone: 'blue', district: 'San Juan de Miraflores', minLat: -12.18, maxLat: -12.12, minLng: -77.00, maxLng: -76.94 },
  { zone: 'blue', district: 'Carabayllo', minLat: -11.92, maxLat: -11.82, minLng: -77.08, maxLng: -76.98 },
  { zone: 'blue', district: 'Puente Piedra', minLat: -11.90, maxLat: -11.82, minLng: -77.10, maxLng: -77.02 },

  // —— VERDE OSCURO (L-S · S/ 15) ——
  { zone: 'green_dark', district: 'Breña', minLat: -12.08, maxLat: -12.03, minLng: -77.06, maxLng: -77.02 },
  { zone: 'green_dark', district: 'La Victoria', minLat: -12.09, maxLat: -12.05, minLng: -77.04, maxLng: -76.99 },
  { zone: 'green_dark', district: 'Surquillo', minLat: -12.13, maxLat: -12.10, minLng: -77.02, maxLng: -76.99 },
  { zone: 'green_dark', district: 'Ate', minLat: -12.06, maxLat: -11.98, minLng: -76.96, maxLng: -76.86 },
  { zone: 'green_dark', district: 'Chorrillos', minLat: -12.20, maxLat: -12.15, minLng: -77.03, maxLng: -76.98 },
  { zone: 'green_dark', district: 'Independencia', minLat: -12.02, maxLat: -11.97, minLng: -77.06, maxLng: -77.01 },

  // —— VERDE CLARO (L-S · S/ 10) ——
  { zone: 'green', district: 'Miraflores', minLat: -12.14, maxLat: -12.10, minLng: -77.04, maxLng: -77.00 },
  { zone: 'green', district: 'San Isidro', minLat: -12.11, maxLat: -12.08, minLng: -77.05, maxLng: -77.01 },
  { zone: 'green', district: 'Santiago de Surco', minLat: -12.16, maxLat: -12.10, minLng: -77.02, maxLng: -76.95 },
  { zone: 'green', district: 'La Molina', minLat: -12.10, maxLat: -12.04, minLng: -76.97, maxLng: -76.88 },
  { zone: 'green', district: 'San Borja', minLat: -12.12, maxLat: -12.08, minLng: -77.02, maxLng: -76.98 },
  { zone: 'green', district: 'Barranco', minLat: -12.15, maxLat: -12.13, minLng: -77.03, maxLng: -77.00 },
  { zone: 'green', district: 'Lince', minLat: -12.10, maxLat: -12.07, minLng: -77.04, maxLng: -77.02 },
  { zone: 'green', district: 'Magdalena del Mar', minLat: -12.10, maxLat: -12.07, minLng: -77.08, maxLng: -77.04 },
  { zone: 'green', district: 'Jesús María', minLat: -12.09, maxLat: -12.06, minLng: -77.06, maxLng: -77.03 },
  { zone: 'green', district: 'San Miguel', minLat: -12.09, maxLat: -12.06, minLng: -77.10, maxLng: -77.06 },
  { zone: 'green', district: 'Pueblo Libre', minLat: -12.08, maxLat: -12.06, minLng: -77.07, maxLng: -77.04 },
]

function pointInZone(lat, lng, zone) {
  return lat >= zone.minLat && lat <= zone.maxLat && lng >= zone.minLng && lng <= zone.maxLng
}

/** Cobertura Rainau según coordenadas GPS (prioridad sobre nombre de distrito) */
export function getCoverageByCoordinates(lat, lng) {
  if (lat == null || lng == null) return null
  for (const bound of COORD_ZONE_BOUNDS) {
    if (pointInZone(lat, lng, bound)) {
      return { zone: bound.zone, district: bound.district }
    }
  }
  return null
}

export function getCoverageInfo(districtName, lat, lng) {
  const coordMatch = getCoverageByCoordinates(lat, lng)

  if (coordMatch) {
    return {
      zone: coordMatch.zone,
      district: coordMatch.district,
      deliveryFee: DELIVERY_FEES[coordMatch.zone] ?? 0,
      ...COVERAGE_MESSAGES[coordMatch.zone],
    }
  }

  const canonical = canonicalDistrictName(districtName)
  const match = matchRainauDistrict(canonical) || matchRainauDistrict(districtName)
  if (!match) {
    return {
      zone: 'unknown',
      district: canonical || districtName,
      deliveryFee: 0,
      ...COVERAGE_MESSAGES.unknown,
    }
  }
  return {
    zone: match.zone,
    district: match.district,
    deliveryFee: DELIVERY_FEES[match.zone] ?? 0,
    ...COVERAGE_MESSAGES[match.zone],
  }
}
