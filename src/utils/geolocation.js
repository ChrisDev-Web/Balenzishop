const EARTH_RADIUS_KM = 6371

export function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Tu navegador no soporta geolocalización'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        const messages = {
          1: 'Permiso de ubicación denegado. Actívalo en tu navegador o elige manualmente.',
          2: 'No se pudo obtener tu ubicación.',
          3: 'Tiempo de espera agotado al obtener ubicación.',
        }
        reject(new Error(messages[err.code] || 'Error al obtener ubicación'))
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    )
  })
}

export async function reverseGeocode(lat, lng) {
  const url = new URL('https://nominatim.openstreetmap.org/reverse')
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lng))
  url.searchParams.set('format', 'json')
  url.searchParams.set('accept-language', 'es')
  url.searchParams.set('addressdetails', '1')

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  })

  if (!res.ok) throw new Error('No se pudo identificar tu ubicación')

  const data = await res.json()
  const addr = data.address || {}

  const district =
    addr.suburb ||
    addr.city_district ||
    addr.district ||
    addr.town ||
    addr.village ||
    ''

  const city =
    addr.city ||
    addr.municipality ||
    addr.state_district ||
    ''

  const region = addr.state || addr.region || ''

  return {
    district,
    city,
    region,
    displayName: data.display_name || '',
    lat,
    lng,
  }
}

/** Extrae candidatos de distrito desde la respuesta de geocodificación */
export function extractDistrictCandidates(geo) {
  const seen = new Set()
  const candidates = []

  const add = (value) => {
    const v = (value || '').trim()
    if (!v || v.length < 3) return
    const key = v.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    candidates.push(v)
  }

  add(geo.district)
  add(geo.city)

  if (geo.displayName) {
    geo.displayName.split(',').forEach((part) => add(part.trim()))
  }

  return candidates
}

export function normalizeLocationName(name) {
  return (name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}
