import { apiGet } from './client'

export async function fetchActiveCategories({ page = 1, pageSize = 100 } = {}) {
  const response = await apiGet('categories/list_active_public', {
    page,
    page_size: pageSize,
  })

  return response.data.items.map((category) => ({
    value: String(category.id_category),
    label: category.name,
    ...category,
  }))
}
