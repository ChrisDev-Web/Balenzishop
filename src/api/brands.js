import { apiGet } from './client'

export async function fetchActiveBrands({ page = 1, pageSize = 100 } = {}) {
  const response = await apiGet('brands/list_active_public', {
    page,
    page_size: pageSize,
  })

  return response.data.items.map((brand) => ({
    value: String(brand.id_brand),
    label: brand.name,
    ...brand,
  }))
}
