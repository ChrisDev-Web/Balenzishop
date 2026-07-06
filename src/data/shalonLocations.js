import { haversineKm, normalizeLocationName, extractDistrictCandidates } from '../utils/geolocation'
import { matchRainauDistrict, getCoverageByCoordinates, canonicalDistrictName } from './rainauCoverage'

export const LIMA_CITY = 'Lima'
export const PROVINCE_CITIES = ['Arequipa', 'Trujillo', 'Piura', 'Cusco']
export const cities = [LIMA_CITY, ...PROVINCE_CITIES]

/** 43 distritos de Lima Metropolitana + principales del Callao */
export const LIMA_DISTRICTS = [
  'Ancón',
  'Ate',
  'Barranco',
  'Bellavista',
  'Breña',
  'Callao',
  'Carabayllo',
  'Carmen de la Legua',
  'Chaclacayo',
  'Chorrillos',
  'Cieneguilla',
  'Comas',
  'El Agustino',
  'Independencia',
  'Jesús María',
  'La Molina',
  'La Perla',
  'La Punta',
  'La Victoria',
  'Lince',
  'Los Olivos',
  'Lurín',
  'Magdalena del Mar',
  'Miraflores',
  'Pachacámac',
  'Pueblo Libre',
  'Puente Piedra',
  'Punta Hermosa',
  'Punta Negra',
  'Rímac',
  'San Bartolo',
  'San Borja',
  'San Isidro',
  'San Juan de Lurigancho',
  'San Juan de Miraflores',
  'San Luis',
  'San Martín de Porres',
  'San Miguel',
  'Santa Anita',
  'Santa María del Mar',
  'Santa Rosa',
  'Santiago de Surco',
  'Surquillo',
  'Ventanilla',
  'Villa El Salvador',
  'Villa María del Triunfo',
]

export const districtsByCity = {
  Lima: LIMA_DISTRICTS,
  Arequipa: ['Cercado', 'Yanahuara', 'Cayma', 'Cerro Colorado', 'Sachaca'],
  Trujillo: ['Trujillo', 'La Esperanza', 'El Porvenir', 'Florencia de Mora'],
  Piura: ['Piura', 'Castilla', 'Veintiséis de Octubre'],
  Cusco: ['Cusco', 'San Sebastián', 'Santiago', 'Wanchaq'],
}

export const districtCoordinates = {
  Ancón: { lat: -11.732, lng: -77.144 },
  Ate: { lat: -12.026, lng: -76.922 },
  Barranco: { lat: -12.142, lng: -77.021 },
  Bellavista: { lat: -12.056, lng: -77.102 },
  Breña: { lat: -12.058, lng: -77.048 },
  Callao: { lat: -12.053, lng: -77.128 },
  Carabayllo: { lat: -11.876, lng: -77.045 },
  'Carmen de la Legua': { lat: -12.042, lng: -77.095 },
  Chaclacayo: { lat: -11.976, lng: -76.771 },
  Chorrillos: { lat: -12.172, lng: -77.013 },
  Cieneguilla: { lat: -12.026, lng: -76.758 },
  Comas: { lat: -11.932, lng: -77.049 },
  'El Agustino': { lat: -12.043, lng: -77.000 },
  Independencia: { lat: -11.995, lng: -77.045 },
  'Jesús María': { lat: -12.074, lng: -77.051 },
  'La Molina': { lat: -12.074, lng: -76.937 },
  'La Perla': { lat: -12.068, lng: -77.118 },
  'La Punta': { lat: -12.071, lng: -77.165 },
  'La Victoria': { lat: -12.075, lng: -77.021 },
  Lince: { lat: -12.086, lng: -77.035 },
  'Los Olivos': { lat: -11.992, lng: -77.062 },
  Lurín: { lat: -12.279, lng: -76.875 },
  'Magdalena del Mar': { lat: -12.091, lng: -77.068 },
  Miraflores: { lat: -12.121, lng: -77.028 },
  Pachacámac: { lat: -12.231, lng: -76.867 },
  'Pueblo Libre': { lat: -12.072, lng: -77.064 },
  'Puente Piedra': { lat: -11.865, lng: -77.076 },
  'Punta Hermosa': { lat: -12.333, lng: -76.818 },
  'Punta Negra': { lat: -12.368, lng: -76.798 },
  Rímac: { lat: -12.028, lng: -77.030 },
  'San Bartolo': { lat: -12.388, lng: -76.773 },
  'San Borja': { lat: -12.105, lng: -77.007 },
  'San Isidro': { lat: -12.099, lng: -77.034 },
  'San Juan de Lurigancho': { lat: -11.994, lng: -76.999 },
  'San Juan de Miraflores': { lat: -12.156, lng: -76.981 },
  'San Luis': { lat: -12.077, lng: -77.001 },
  'San Martín de Porres': { lat: -12.001, lng: -77.085 },
  'San Miguel': { lat: -12.077, lng: -77.093 },
  'Santa Anita': { lat: -12.043, lng: -76.973 },
  'Santa María del Mar': { lat: -12.405, lng: -76.763 },
  'Santa Rosa': { lat: -11.876, lng: -77.061 },
  'Santiago de Surco': { lat: -12.135, lng: -76.991 },
  Surquillo: { lat: -12.115, lng: -77.013 },
  Ventanilla: { lat: -11.878, lng: -77.131 },
  'Villa El Salvador': { lat: -12.216, lng: -76.942 },
  'Villa María del Triunfo': { lat: -12.156, lng: -76.947 },
  Cercado: { lat: -16.409, lng: -71.537 },
  Yanahuara: { lat: -16.395, lng: -71.545 },
  Cayma: { lat: -16.345, lng: -71.552 },
  'Cerro Colorado': { lat: -16.368, lng: -71.601 },
  Sachaca: { lat: -16.428, lng: -71.571 },
  Trujillo: { lat: -8.111, lng: -79.029 },
  'La Esperanza': { lat: -8.073, lng: -79.045 },
  'El Porvenir': { lat: -8.085, lng: -79.008 },
  'Florencia de Mora': { lat: -8.133, lng: -79.012 },
  Piura: { lat: -5.194, lng: -80.632 },
  Castilla: { lat: -5.205, lng: -80.645 },
  'Veintiséis de Octubre': { lat: -5.178, lng: -80.658 },
  Cusco: { lat: -13.516, lng: -71.978 },
  'San Sebastián': { lat: -13.543, lng: -71.913 },
  Santiago: { lat: -13.531, lng: -71.967 },
  Wanchaq: { lat: -13.525, lng: -71.945 },
}

export const cityCoordinates = {
  Lima: { lat: -12.046, lng: -77.042 },
  Arequipa: { lat: -16.409, lng: -71.537 },
  Trujillo: { lat: -8.111, lng: -79.029 },
  Piura: { lat: -5.194, lng: -80.632 },
  Cusco: { lat: -13.516, lng: -71.978 },
}

export const shalonsByDistrict = {
  Miraflores: [
    'Shalon Miraflores Centro - Av. Larco 345',
    'Shalon Larcomar - Mal. de la Reserva 610',
    'Shalon Óvalo Gutierrez - Av. Vasco Núñez de Balboa 770',
  ],
  'San Isidro': [
    'Shalon San Isidro - Av. Javier Prado Este 4200',
    'Shalon Camino Real - Av. Camino Real 456',
    'Shalon Conquistadores - Av. Conquistadores 890',
  ],
  'Santiago de Surco': [
    'Shalon Monterrico - Av. El Derby 254',
    'Shalon Primavera - Av. Primavera 1200',
    'Shalon Higuereta - Av. Higuereta 520',
  ],
  'La Molina': [
    'Shalon La Molina - Av. La Molina 875',
    'Shalon Rinconada - Av. Rinconada del Lago 210',
  ],
  'San Borja': [
    'Shalon San Borja - Av. San Borja Norte 1230',
    'Shalon Aviación - Av. Aviación 2980',
  ],
  Lince: [
    'Shalon Lince - Av. Arenales 1450',
    'Shalon Petit Thouars - Av. Petit Thouars 3200',
  ],
  'Magdalena del Mar': [
    'Shalon Magdalena - Av. Brasil 4560',
    'Shalon Sucre - Av. Sucre 890',
  ],
  Barranco: [
    'Shalon Barranco - Av. Grau 520',
    'Shalon Bajada de Baños - Jr. Unión 180',
  ],
  'Los Olivos': ['Shalon Los Olivos - Av. Alfredo Mendiola 3500'],
  Comas: ['Shalon Comas - Av. Los Incas 5200'],
  'San Juan de Lurigancho': ['Shalon SJL - Av. Próceres de la Independencia 2100'],
  'San Miguel': ['Shalon San Miguel - Av. La Marina 3200'],
  'Pueblo Libre': ['Shalon Pueblo Libre - Av. Brasil 2800'],
  'Jesús María': ['Shalon Jesús María - Av. Salaverry 3500'],
  Surquillo: ['Shalon Surquillo - Av. Tomás Marsano 4800'],
  Chorrillos: ['Shalon Chorrillos - Av. Chorrillos 620'],
  Ate: ['Shalon Ate - Av. Nicolás Ayllón 4800'],
  'San Juan de Miraflores': ['Shalon SJM - Av. Salvador Allende 1200'],
  'Villa El Salvador': ['Shalon VES - Av. Pachacútec 1800'],
  'Villa María del Triunfo': ['Shalon VMT - Av. El Sol 3200'],
  Independencia: ['Shalon Independencia - Av. Túpac Amaru 4200'],
  Carabayllo: ['Shalon Carabayllo - Av. San Juan 8900'],
  'Puente Piedra': ['Shalon Puente Piedra - Av. La Concordia 1200'],
  'San Martín de Porres': ['Shalon SMP - Av. Universitaria 1800'],
  Callao: ['Shalon Callao - Av. Oscar Benavides 450'],
  Cercado: [
    'Shalon Arequipa Centro - Calle Mercaderes 120',
    'Shalon Plaza de Armas - Portal de Flores 50',
  ],
  Yanahuara: ['Shalon Yanahuara - Av. Ejército 210'],
  Cayma: ['Shalon Cayma - Av. Cayma 340'],
  'Cerro Colorado': ['Shalon Cerro Colorado - Av. José Abelardo Quiñones 890'],
  Sachaca: ['Shalon Sachaca - Av. Sachaca 150'],
  Trujillo: [
    'Shalon Trujillo Centro - Jr. Pizarro 450',
    'Shalon Real Plaza - Av. América Norte 750',
  ],
  'La Esperanza': ['Shalon La Esperanza - Av. Nicolás de Piérola 320'],
  'El Porvenir': ['Shalon El Porvenir - Av. Prolongación Santa 180'],
  'Florencia de Mora': ['Shalon Florencia - Av. Los Laureles 90'],
  Piura: [
    'Shalon Piura Centro - Av. Grau 620',
    'Shalon Real Plaza Piura - Av. Grau 500',
  ],
  Castilla: ['Shalon Castilla - Av. Circunvalación 1100'],
  'Veintiséis de Octubre': ['Shalon VEO - Av. Progreso 340'],
  Cusco: [
    'Shalon Cusco Centro - Av. El Sol 480',
    'Shalon Real Plaza Cusco - Av. La Cultura 2800',
  ],
  'San Sebastián': ['Shalon San Sebastián - Av. de la Cultura 3100'],
  Santiago: ['Shalon Santiago - Av. Manzanilla 120'],
  Wanchaq: ['Shalon Wanchaq - Av. Velasco Astete 890'],
}

function districtNamesMatch(a, b) {
  const na = normalizeLocationName(a)
  const nb = normalizeLocationName(b)
  const ca = normalizeLocationName(canonicalDistrictName(a))
  const cb = normalizeLocationName(canonicalDistrictName(b))
  return (
    na === nb ||
    ca === cb ||
    na.includes(nb) ||
    nb.includes(na) ||
    ca.includes(cb) ||
    cb.includes(ca)
  )
}

export function getDistrictsForCity(city) {
  return districtsByCity[city] || []
}

export function getShalonsForDistrict(district) {
  return shalonsByDistrict[district] || []
}

export function getNearestShalon(district, lat, lng) {
  const direct = getShalonsForDistrict(district)
  if (direct.length) return direct[0]

  let best = { dist: Infinity, shalon: '' }

  for (const [d, shalons] of Object.entries(shalonsByDistrict)) {
    if (!shalons.length) continue
    const coords = districtCoordinates[d]
    if (!coords || lat == null || lng == null) continue
    const dist = haversineKm(lat, lng, coords.lat, coords.lng)
    if (dist < best.dist) {
      best = { dist, shalon: shalons[0] }
    }
  }

  return best.shalon
}

export function getCitiesForScope(scope) {
  return scope === 'lima' ? [LIMA_CITY] : PROVINCE_CITIES
}

export function findDistrictFromGeo(city, geo, lat, lng) {
  const districts = getDistrictsForCity(city)
  const candidates = extractDistrictCandidates(geo)
  let textMatch = null

  for (const candidate of candidates) {
    for (const district of districts) {
      if (districtNamesMatch(district, candidate)) {
        textMatch = district
        break
      }
    }
    if (textMatch) break
    const rainau = matchRainauDistrict(candidate)
    if (rainau) {
      const inList = districts.find((d) => districtNamesMatch(d, rainau.district))
      if (inList) {
        textMatch = inList
        break
      }
      if (city === LIMA_CITY && districts.includes(rainau.district)) {
        textMatch = rainau.district
        break
      }
    }
  }

  const nearest = lat != null && lng != null ? findNearestDistrictInCity(city, lat, lng) : null

  if (!textMatch) return nearest
  if (!nearest || lat == null || lng == null) return textMatch

  const textCoords = districtCoordinates[textMatch]
  const nearestCoords = districtCoordinates[nearest]
  if (!textCoords || !nearestCoords) return textMatch

  const distText = haversineKm(lat, lng, textCoords.lat, textCoords.lng)
  const distNearest = haversineKm(lat, lng, nearestCoords.lat, nearestCoords.lng)

  // Si el nombre del geocoder apunta lejos pero hay un distrito más cercano, priorizar GPS
  if (distText - distNearest > 1.2) return nearest

  return textMatch
}

function findNearestDistrictInCity(city, lat, lng) {
  const districts = getDistrictsForCity(city)
  let nearest = null
  let minDist = Infinity

  for (const district of districts) {
    const coords = districtCoordinates[district]
    if (!coords) continue
    const dist = haversineKm(lat, lng, coords.lat, coords.lng)
    if (dist < minDist) {
      minDist = dist
      nearest = district
    }
  }

  return nearest
}

function findNearestCity(scope, lat, lng) {
  const cityList = getCitiesForScope(scope)
  let nearest = cityList[0]
  let minDist = Infinity

  for (const city of cityList) {
    const coords = cityCoordinates[city]
    if (!coords) continue
    const dist = haversineKm(lat, lng, coords.lat, coords.lng)
    if (dist < minDist) {
      minDist = dist
      nearest = city
    }
  }

  return nearest
}

export function resolveLocationForScope(scope, geo, lat, lng) {
  const city = scope === 'lima' ? LIMA_CITY : findNearestCity(scope, lat, lng)

  // Cobertura por coordenadas (mapa Rainau) tiene prioridad para distrito en Lima
  const coordCoverage = scope === 'lima' ? getCoverageByCoordinates(lat, lng) : null
  const matchedDistrict =
    coordCoverage?.district ||
    findDistrictFromGeo(city, geo, lat, lng) ||
    findNearestDistrictInCity(city, lat, lng)

  const district = matchedDistrict || ''
  const shalon = getNearestShalon(district, lat, lng)

  return {
    city,
    district,
    shalon,
    geoLabel: geo.displayName,
  }
}

export function sortDistrictsByDistance(city, lat, lng) {
  const withCoords = []
  const withoutCoords = []

  for (const district of getDistrictsForCity(city)) {
    const coords = districtCoordinates[district]
    if (coords && lat != null && lng != null) {
      withCoords.push({ district, dist: haversineKm(lat, lng, coords.lat, coords.lng) })
    } else {
      withoutCoords.push(district)
    }
  }

  withCoords.sort((a, b) => a.dist - b.dist)
  withoutCoords.sort((a, b) => a.localeCompare(b, 'es'))

  return [...withCoords.map((x) => x.district), ...withoutCoords]
}

export function isLimaRegion(geo) {
  const region = normalizeLocationName(geo.region)
  const city = normalizeLocationName(geo.city)
  return region.includes('lima') || city.includes('lima') || city.includes('callao')
}
