export function catalogLink(filter = {}) {
  const params = new URLSearchParams()
  filter.categories?.forEach((c) => params.append('category', c))
  if (filter.aroma) params.set('aroma', filter.aroma)
  const query = params.toString()
  return query ? `/catalogo?${query}` : '/catalogo'
}
