import {
  DELIVERY_TYPES,
  isHomeDeliveryType,
  isOwnDeliveryType,
} from './deliveryTypes'

export function parseShalonLabelParts(label) {
  if (!label?.trim()) return { name: '', address: '' }

  const separator = ' - '
  const index = label.indexOf(separator)
  if (index === -1) {
    return { name: label.trim(), address: '' }
  }

  return {
    name: label.slice(0, index).trim(),
    address: label.slice(index + separator.length).trim(),
  }
}

export function buildShalonMapsUrl({
  name,
  address,
  district,
  city,
  region,
  shalonLabel,
  geoLat,
  geoLng,
} = {}) {
  const latitude = geoLat != null && geoLat !== '' ? Number(geoLat) : null
  const longitude = geoLng != null && geoLng !== '' ? Number(geoLng) : null

  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
  }

  let businessName = (name || '').trim()
  if (!businessName && shalonLabel) {
    businessName = parseShalonLabelParts(shalonLabel).name
  }

  const districtName = (district || '').trim()
  const locationName = (city || region || '').trim()
  const queryParts = []

  if (businessName) {
    queryParts.push(businessName)
  } else if (address?.trim()) {
    queryParts.push(address.trim())
  } else if (shalonLabel?.trim()) {
    queryParts.push(shalonLabel.trim())
  }

  if (districtName) queryParts.push(districtName)
  if (locationName && locationName.toLowerCase() !== districtName.toLowerCase()) {
    queryParts.push(locationName)
  }
  queryParts.push('Perú')

  const query = queryParts.filter(Boolean).join(', ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

export function formatShalonLabel(name, address) {
  if (!name && !address) return ''
  if (!address) return name
  return `${name} - ${address}`
}

export function mapDirectionToAddress(item) {
  if (!item) return null

  return {
    id: String(item.id_client_direction),
    idClientDirection: item.id_client_direction,
    idRegion: item.id_region,
    idProvince: item.id_province,
    idDistrict: item.id_district,
    idShalon: item.id_shalon,
    region: item.region_name || '',
    city: item.province_name || item.city || '',
    district: item.district || item.district_name || '',
    shalonName: item.shalon_name || parseShalonLabelParts(item.shalon || '').name,
    shalonAddress: item.shalon_address || parseShalonLabelParts(item.shalon || '').address,
    shalonLat: item.shalon_latitude ?? null,
    shalonLng: item.shalon_longitude ?? null,
    shalon: item.shalon || formatShalonLabel(item.shalon_name, item.shalon_address),
    deliveryType: item.delivery_type || 'shalon',
    fullAddress: item.full_address || '',
    googleMapsLink: item.google_maps_link || '',
    geoLat: item.geo_lat ?? null,
    geoLng: item.geo_lng ?? null,
    coverageZone: item.coverage_zone || null,
    deliveryFee: item.delivery_fee ?? 0,
    isPrimary: Boolean(item.is_primary),
    deliveryScope: item.delivery_scope || null,
    createdAt: item.created_at || null,
  }
}

/** Principal primero; el resto por antigüedad (la más nueva al final). */
export function sortAddresses(addresses) {
  if (!Array.isArray(addresses) || addresses.length <= 1) {
    return addresses ?? []
  }

  return [...addresses].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) {
      return a.isPrimary ? -1 : 1
    }

    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : Number(a.idClientDirection ?? a.id)
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : Number(b.idClientDirection ?? b.id)

    return timeA - timeB
  })
}

export function mapAddressFormToPayload(form) {
  const isDelivery = isHomeDeliveryType(form.deliveryType)
  const isOwnDelivery = isOwnDeliveryType(form.deliveryType)

  const payload = {
    id_province: Number(form.idProvince),
    id_district: Number(form.idDistrict),
    is_primary: Boolean(form.isPrimary),
    delivery_scope: form.deliveryScope || null,
    delivery_type: form.deliveryType || DELIVERY_TYPES.SHALON,
  }

  if (isDelivery) {
    payload.full_address = form.fullAddress?.trim() || ''
    payload.google_maps_link = form.googleMapsLink?.trim() || null
    payload.geo_lat = isOwnDelivery || form.geoLat == null ? null : Number(form.geoLat)
    payload.geo_lng = isOwnDelivery || form.geoLng == null ? null : Number(form.geoLng)
  } else {
    payload.id_shalon = Number(form.idShalon)
  }

  return payload
}

export function mapRegionOption(item) {
  const name = item.name ?? ''

  return {
    idRegion: item.id_region,
    name,
    label: name,
  }
}

export function mapProvinceOption(item) {
  const name = item.name ?? ''
  const regionName = item.region_name ?? ''

  return {
    idProvince: item.id_province,
    idRegion: item.id_region,
    name,
    regionName,
    label: name,
  }
}

export function mapDistrictOption(item) {
  return {
    idDistrict: item.id_district,
    idProvince: item.id_province,
    name: item.name,
    provinceName: item.province_name,
    regionName: item.region_name,
    city: item.region_name || item.province_name || '',
    label: [item.region_name, item.province_name, item.name].filter(Boolean).join(' / '),
  }
}

export function mapShalonOption(item) {
  const label = formatShalonLabel(item.name, item.address)

  return {
    idShalon: item.id_shalon,
    idDistrict: item.id_district,
    name: item.name,
    address: item.address,
    latitude: item.latitude ?? null,
    longitude: item.longitude ?? null,
    label,
    searchText: [item.name, item.address, label].filter(Boolean).join(' '),
  }
}
