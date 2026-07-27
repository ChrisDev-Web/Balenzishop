import { listProvincesPublic } from '../api/clientDirections'
import { normalizeSearchText } from './searchText'

export const LIMA_SCOPE_PROVINCE_NAMES = ['Lima']

export async function fetchAllProvincesPublic() {
  const items = []
  let page = 1
  let lastPage = 1

  do {
    const response = await listProvincesPublic({ page, page_size: 100 })
    const pageItems = response.data?.items ?? []
    items.push(...pageItems)
    lastPage = response.data?.meta?.last_page ?? 1
    page += 1
  } while (page <= lastPage)

  return items
}

export async function resolveLimaProvinceIds() {
  const response = await listProvincesPublic({ page: 1, page_size: 100 })
  const items = response.data?.items ?? []

  const ids = LIMA_SCOPE_PROVINCE_NAMES
    .map((provinceName) => items.find((item) => item.name === provinceName)?.id_province)
    .filter(Boolean)

  return [...new Set(ids)]
}

export async function resolveProvinceIdByName(name) {
  const normalizedName = (name ?? '').trim()
  if (!normalizedName) return null

  const response = await listProvincesPublic({ page: 1, page_size: 20, name: normalizedName })
  const items = response.data?.items ?? []
  const exact = items.find(
    (item) => item.name?.trim().toLowerCase() === normalizedName.toLowerCase(),
  )

  return exact?.id_province ?? items[0]?.id_province ?? null
}

export function buildFormFromAddress(address) {
  return {
    idRegion: address.idRegion ? String(address.idRegion) : '',
    region: address.region || '',
    city: address.city || '',
    idProvince: address.idProvince ? String(address.idProvince) : '',
    idDistrict: address.idDistrict ? String(address.idDistrict) : '',
    idShalon: address.idShalon ? String(address.idShalon) : '',
    district: address.district || '',
    shalonName: address.shalonName || '',
    shalonLat: address.shalonLat ?? null,
    shalonLng: address.shalonLng ?? null,
    shalon: address.shalon || '',
    deliveryType: address.deliveryType || 'shalon',
    fullAddress: address.fullAddress || '',
    googleMapsLink: address.googleMapsLink || '',
    geoLat: address.geoLat ?? null,
    geoLng: address.geoLng ?? null,
    isPrimary: address.isPrimary || false,
  }
}

export function filterOptionsByPrefix(options, query) {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return options

  return options.filter((option) =>
    normalizeSearchText(option.label).startsWith(normalizedQuery),
  )
}
