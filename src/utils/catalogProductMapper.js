import { normalizeMediaUrl } from './mediaUrl'

function parseMoney(value) {
  if (value == null || value === '') return null
  const amount = Number(value)
  return Number.isNaN(amount) ? null : amount
}

export function mapCatalogProduct(item) {
  const isLivePrice = Boolean(item.price?.is_live)
  const price = parseMoney(item.price?.sale_price) ?? 0
  const referencePrice = parseMoney(item.reference_price?.sale_price)
  const onlinePrice = isLivePrice ? parseMoney(item.price?.normal_sale_price) : price
  const fakePrice = parseMoney(item.price?.fake_price)
  const hasFakePrice = fakePrice != null && onlinePrice != null && fakePrice > onlinePrice

  let originalPrice = referencePrice
  if (hasFakePrice) {
    originalPrice = fakePrice
  } else if (isLivePrice && onlinePrice != null && onlinePrice > price) {
    originalPrice = onlinePrice
  }

  return {
    id: item.id_product,
    idProduct: item.id_product,
    name: item.name,
    brand: item.brand_name ?? '',
    image: normalizeMediaUrl(item.photo || ''),
    price,
    onlinePrice,
    referencePrice,
    fakePrice: hasFakePrice ? fakePrice : null,
    basePrice: price,
    originalPrice,
    hasFakePrice,
    isLivePrice,
    aroma: item.scent ?? '',
    netContent: item.net_content ?? '',
    netContentMl: item.net_content_ml ?? null,
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

function mapDecant(item) {
  const salePrice = parseMoney(item.sale_price) ?? 0

  return {
    id: item.id_product_decant,
    idProductDecant: item.id_product_decant,
    sizeMl: item.size_ml,
    name: item.name,
    image: normalizeMediaUrl(item.photo || ''),
    price: salePrice,
    basePrice: salePrice,
  }
}

export function mapCatalogProductDetail(item) {
  const product = mapCatalogProduct(item)
  const specs = item.specifications ?? {}
  const decants = (item.decants ?? []).map(mapDecant)
  const decantImage = decants.find((decant) => decant.image)?.image ?? null

  return {
    ...product,
    shortDescription: item.brief_description ?? '',
    description: item.brief_description ?? '',
    fullDescription: item.description ?? '',
    specifications: specs,
    specRows: mapSpecificationsToRows(specs),
    similarProducts: (item.similar_products ?? []).map(mapCatalogProduct),
    decants,
    decantImage,
    netContentMl: item.net_content_ml ?? null,
    hasDecants: decants.length > 0,
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
