import { normalizeMediaUrl } from './mediaUrl'

function parseMoney(value) {
  if (value == null || value === '') return null
  const amount = Number(value)
  return Number.isNaN(amount) ? null : amount
}

export function mapCatalogProduct(item) {
  const price = parseMoney(item.price?.sale_price) ?? 0
  const referencePrice = parseMoney(item.reference_price?.sale_price)

  return {
    id: item.id_product,
    idProduct: item.id_product,
    name: item.name,
    brand: item.brand_name ?? '',
    image: normalizeMediaUrl(item.photo || ''),
    price,
    referencePrice,
    basePrice: price,
    originalPrice: referencePrice,
    aroma: item.scent ?? '',
    description: item.brief_description || item.description || '',
    fullDescription: item.description ?? '',
    category: String(item.id_category ?? ''),
    categoryName: item.category_name ?? '',
    idBrand: item.id_brand,
    idCategory: item.id_category,
    stock: Number(item.stock ?? 0),
    totalStock: Number(item.total_stock ?? 0),
    raw: item,
  }
}

export function mapCatalogProductDetail(item) {
  const product = mapCatalogProduct(item)
  const specs = item.specifications ?? {}

  return {
    ...product,
    shortDescription: item.brief_description ?? '',
    description: item.brief_description ?? '',
    fullDescription: item.description ?? '',
    specifications: specs,
    specRows: mapSpecificationsToRows(specs),
    similarProducts: (item.similar_products ?? []).map(mapCatalogProduct),
  }
}

export function mapSpecificationsToRows(specs = {}) {
  return [
    { label: 'Presentación / Empaque', value: specs.presentation || '—' },
    { label: 'Usuario', value: specs.user || '—' },
    { label: 'Aroma', value: specs.scent || '—' },
    { label: 'Contenido neto', value: specs.net_content || '—' },
    { label: 'Denominación / Variedad', value: specs.variety || '—' },
    { label: 'Marca', value: specs.brand_name || '—' },
  ]
}

export function getCategoryBreadcrumbFromProduct(product) {
  const name = (product.categoryName || '').toLowerCase()

  if (name.includes('dama') || name.includes('mujer')) {
    return { section: 'Perfumes para Mujer', sectionLink: '/mujeres' }
  }

  if (name.includes('caballero') || name.includes('hombre')) {
    return { section: 'Perfumes para Hombre', sectionLink: '/hombres' }
  }

  return {
    section: product.categoryName || 'Catálogo',
    sectionLink: product.category ? `/catalogo?category=${product.category}` : '/catalogo',
  }
}
