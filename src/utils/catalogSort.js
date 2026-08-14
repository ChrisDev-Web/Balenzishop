export const CATALOG_SORT = {
  DEFAULT: '',
  PRICE_ASC: 'price_asc',
  PRICE_DESC: 'price_desc',
  NAME_ASC: 'name_asc',
  NAME_DESC: 'name_desc',
  BRAND: 'brand',
  BEST_RATED: 'best_rated',
  RECOMMENDED: 'recommended',
}

export const CATALOG_SORT_OPTIONS = [
  { value: CATALOG_SORT.DEFAULT, label: 'Seleccionar' },
  { value: CATALOG_SORT.PRICE_ASC, label: 'Precio de menor a mayor' },
  { value: CATALOG_SORT.PRICE_DESC, label: 'Precio de mayor a menor' },
  { value: CATALOG_SORT.NAME_ASC, label: 'Alfabético A-Z' },
  { value: CATALOG_SORT.NAME_DESC, label: 'Alfabético Z-A' },
  { value: CATALOG_SORT.BRAND, label: 'Marca' },
  { value: CATALOG_SORT.BEST_RATED, label: 'Los mejores evaluados' },
  { value: CATALOG_SORT.RECOMMENDED, label: 'Recomendados' },
]

export function isApiCatalogSort(sort) {
  return sort === CATALOG_SORT.PRICE_ASC
    || sort === CATALOG_SORT.PRICE_DESC
    || sort === CATALOG_SORT.NAME_ASC
    || sort === CATALOG_SORT.NAME_DESC
    || sort === CATALOG_SORT.BEST_RATED
    || sort === CATALOG_SORT.RECOMMENDED
}
