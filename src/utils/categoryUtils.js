import { catalogLink } from './catalogLinks'

const SECTION_CATEGORY_BY_KEY = {
  mujeres: 'Damas',
  hombres: 'Caballeros',
  promociones: 'Sets',
}

export function sectionCategoryName(section) {
  return SECTION_CATEGORY_BY_KEY[section] ?? null
}

export function findCategoryByName(categories, name) {
  if (!name || !categories?.length) return null

  const normalized = name.trim().toLowerCase()

  return (
    categories.find((category) => {
      const label = (category.label ?? category.name ?? '').trim().toLowerCase()
      return label === normalized
    }) ?? null
  )
}

export function catalogLinkForCategory(category) {
  if (!category?.value) return '/catalogo'

  return catalogLink({ categories: [category.value] })
}
