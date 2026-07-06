export function filterPerfumes(perfumes, filters) {
  const categories = filters.categories?.length
    ? filters.categories
    : filters.category
      ? [filters.category]
      : null

  const brands = filters.brands?.length
    ? filters.brands
    : filters.brand
      ? [filters.brand]
      : null

  return perfumes.filter((p) => {
    if (categories?.length && !categories.includes(p.category)) return false
    if (brands?.length && !brands.includes(p.brand)) return false
    if (filters.minPrice != null && p.price < filters.minPrice) return false
    if (filters.maxPrice != null && p.price > filters.maxPrice) return false
    if (filters.aroma) {
      const search = filters.aroma.toLowerCase()
      const match =
        p.aroma.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search) ||
        p.name.toLowerCase().includes(search)
      if (!match) return false
    }
    if (filters.recommended && !p.recommended) return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      const match =
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      if (!match) return false
    }
    return true
  })
}

export function paginate(items, page, perPage = 25) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage))
  const currentPage = Math.min(Math.max(1, page), totalPages)
  const start = (currentPage - 1) * perPage
  return {
    items: items.slice(start, start + perPage),
    currentPage,
    totalPages,
    totalItems: items.length,
  }
}

export function buildCatalogSearchParams(filters) {
  const params = new URLSearchParams()
  filters.categories?.forEach((c) => params.append('category', c))
  filters.brands?.forEach((b) => params.append('brand', b))
  if (filters.aroma) params.set('aroma', filters.aroma)
  if (filters.minPrice != null) params.set('minPrice', String(filters.minPrice))
  if (filters.maxPrice != null) params.set('maxPrice', String(filters.maxPrice))
  if (filters.recommended) params.set('recommended', 'true')
  return params
}

export function parseCatalogFilters(searchParams) {
  const categories = searchParams.getAll('category')
  const brands = searchParams.getAll('brand')

  return {
    categories: categories.length ? categories : null,
    brands: brands.length ? brands : null,
    aroma: searchParams.get('aroma') || null,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : null,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : null,
    recommended: searchParams.get('recommended') === 'true' || null,
  }
}
