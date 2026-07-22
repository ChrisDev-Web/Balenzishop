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
    isPrimary: Boolean(item.is_primary),
    deliveryScope: item.delivery_scope || null,
  }
}

export function mapAddressFormToPayload(form) {
  return {
    id_province: Number(form.idProvince),
    id_district: Number(form.idDistrict),
    id_shalon: Number(form.idShalon),
    is_primary: Boolean(form.isPrimary),
    delivery_scope: form.deliveryScope || null,
  }
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
  return {
    idShalon: item.id_shalon,
    idDistrict: item.id_district,
    name: item.name,
    address: item.address,
    latitude: item.latitude ?? null,
    longitude: item.longitude ?? null,
    label: formatShalonLabel(item.name, item.address),
  }
}
