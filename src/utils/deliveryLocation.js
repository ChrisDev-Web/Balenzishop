const LIMA_CENTER = { lat: -12.0464, lng: -77.0428 }

export function isLocationInPeru({ lat, lng }) {
  return (
    Number.isFinite(lat)
    && Number.isFinite(lng)
    && lat >= -19.5
    && lat <= 0.5
    && lng >= -82.5
    && lng <= -68.5
  )
}

export function normalizeMapLocation(value) {
  const lat = Number(value?.lat)
  const lng = Number(value?.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (!isLocationInPeru({ lat, lng })) return null
  return { lat, lng }
}

export function resolveMapLocation(value) {
  return normalizeMapLocation(value) ?? getDefaultMapCenter()
}

function parseCoordinatePair(value) {
  const match = String(value).match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/)
  if (!match) return null

  const lat = Number(match[1])
  const lng = Number(match[2])
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null

  return { lat, lng }
}

export function buildGoogleMapsLink(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return ''
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
}

export function parseGoogleMapsLink(value) {
  const raw = (value ?? '').trim()
  if (!raw) return null

  try {
    const url = new URL(raw)
    const queryParam = url.searchParams.get('q') ?? url.searchParams.get('query')
    if (queryParam) {
      const fromQuery = parseCoordinatePair(decodeURIComponent(queryParam))
      if (fromQuery) return fromQuery
    }

    const atMatch = raw.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (atMatch) {
      return parseCoordinatePair(`${atMatch[1]},${atMatch[2]}`)
    }

    const pathMatch = url.pathname.match(/(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (pathMatch) {
      return parseCoordinatePair(`${pathMatch[1]},${pathMatch[2]}`)
    }
  } catch {
    return parseCoordinatePair(raw)
  }

  return parseCoordinatePair(raw)
}

export async function reverseGeocode(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return ''

  const url = new URL('https://nominatim.openstreetmap.org/reverse')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lng))
  url.searchParams.set('accept-language', 'es')

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error('No se pudo obtener la dirección para esta ubicación.')
  }

  const data = await response.json()
  return data.display_name || ''
}

export function getDefaultMapCenter() {
  return { ...LIMA_CENTER }
}

export async function getCurrentPosition() {
  if (!navigator.geolocation) {
    throw new Error('Tu navegador no soporta geolocalización.')
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }

        if (!isLocationInPeru(location)) {
          reject(new Error(
            'No se pudo obtener una ubicación válida en Perú. Arrastra el pin en el mapa o escribe tu dirección.',
          ))
          return
        }

        resolve(location)
      },
      (error) => {
        const message = error.code === error.PERMISSION_DENIED
          ? 'Permiso de ubicación denegado. Actívalo o ingresa el enlace manualmente.'
          : 'No se pudo obtener tu ubicación actual.'
        reject(new Error(message))
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  })
}
