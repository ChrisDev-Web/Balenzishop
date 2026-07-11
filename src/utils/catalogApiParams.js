export function buildCatalogApiParams(filters = {}, page = 1, pageSize = 20) {
  const params = {
    page,
    page_size: pageSize,
  }

  if (filters.categories?.length) {
    params.id_category = filters.categories.map(Number)
  }

  if (filters.brands?.length) {
    params.id_brand = filters.brands.map(Number)
  }

  if (filters.minPrice != null) {
    params.min_price = filters.minPrice
  }

  if (filters.maxPrice != null) {
    params.max_price = filters.maxPrice
  }

  const descriptionTerms = [
    ...(filters.aromas ?? []),
    ...(filters.aroma ? [filters.aroma] : []),
  ].map((term) => term.trim()).filter(Boolean)

  if (descriptionTerms.length) {
    params.description_terms = [...new Set(descriptionTerms)]
  }

  return params
}
