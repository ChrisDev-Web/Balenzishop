import { perfumes, categories } from '../data/perfumes'

const IMAGE_POOLS = {
  mujeres: [
    'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&h=700&fit=crop',
    'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&h=700&fit=crop',
    'https://images.unsplash.com/photo-1587017539504-67cfbddcf2b4?w=600&h=700&fit=crop',
    'https://images.unsplash.com/photo-1592945403247-bfd282a2f785?w=600&h=700&fit=crop',
  ],
  hombres: [
    'https://images.unsplash.com/photo-1592945414851-8f9f700dc946?w=600&h=700&fit=crop',
    'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=600&h=700&fit=crop',
    'https://images.unsplash.com/photo-1585386959984-a41552231693?w=600&h=700&fit=crop',
    'https://images.unsplash.com/photo-1615529328331-f8917597711f?w=600&h=700&fit=crop',
  ],
  unisex: [
    'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&h=700&fit=crop',
    'https://images.unsplash.com/photo-1588405748880-714e2b11ae3b?w=600&h=700&fit=crop',
  ],
  sets: [
    'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&h=700&fit=crop',
    'https://images.unsplash.com/photo-1618886614638-80e3ec1031a1?w=600&h=700&fit=crop',
  ],
}

function poolKey(category) {
  if (category.includes('mujeres')) return 'mujeres'
  if (category.includes('hombres')) return 'hombres'
  if (category.includes('unisex')) return 'unisex'
  return 'sets'
}

export function getPerfumeById(id) {
  return perfumes.find((p) => p.id === Number(id))
}

export function getProductGallery(perfume) {
  const pool = IMAGE_POOLS[poolKey(perfume.category)] || IMAGE_POOLS.mujeres
  const extras = pool.filter((img) => img !== perfume.image)
  return [perfume.image, ...extras.slice(0, 3)]
}

export function getSimilarPerfumes(perfume, limit = 8) {
  return perfumes
    .filter(
      (p) =>
        p.id !== perfume.id &&
        (p.category === perfume.category || p.brand === perfume.brand || p.aroma === perfume.aroma),
    )
    .sort((a, b) => {
      const score = (p) =>
        (p.category === perfume.category ? 2 : 0) +
        (p.brand === perfume.brand ? 2 : 0) +
        (p.aroma === perfume.aroma ? 1 : 0)
      return score(b) - score(a)
    })
    .slice(0, limit)
}

export function getProductSpecs(perfume) {
  const catLabel = categories.find((c) => c.value === perfume.category)?.label || perfume.category
  const isSet = perfume.productType === 'set'
  const isWomen = perfume.category.includes('mujeres')
  const isMen = perfume.category.includes('hombres')

  return [
    { label: 'Presentación / Empaque', value: isSet ? 'Set (Perfume + Desodorante)' : 'Frasco' },
    { label: 'Usuario', value: isWomen ? 'Mujer' : isMen ? 'Hombre' : 'Unisex' },
    { label: 'Aroma', value: perfume.aroma.charAt(0).toUpperCase() + perfume.aroma.slice(1) },
    { label: 'Contenido neto', value: isSet ? '100 ML + 150 ML' : '100 ML' },
    { label: 'Denominación / Variedad', value: isSet ? 'SETS DE FRAGANCIAS' : `FRAGANCIAS ${catLabel.toUpperCase()}` },
    { label: 'Marca', value: perfume.brand },
    { label: 'Categoría', value: catLabel },
  ]
}

export function getCategoryBreadcrumb(perfume) {
  if (perfume.category.includes('mujeres')) {
    return { section: 'Perfumes para Mujer', sectionLink: '/mujeres' }
  }
  if (perfume.category.includes('hombres')) {
    return { section: 'Perfumes para Hombre', sectionLink: '/hombres' }
  }
  return { section: 'Perfumes Unisex', sectionLink: '/catalogo?category=unisex' }
}

export function findFirstProductByFilter(filter) {
  const cats = filter.categories || (filter.category ? [filter.category] : null)
  return perfumes.find((p) => {
    if (cats?.length && !cats.includes(p.category)) return false
    if (filter.aroma && !p.aroma.includes(filter.aroma) && !p.description.toLowerCase().includes(filter.aroma.toLowerCase())) {
      return false
    }
    return true
  })
}

export function productLink(id) {
  return `/producto/${id}`
}

export function filterProductLink(filter) {
  const product = findFirstProductByFilter(filter)
  return product ? productLink(product.id) : '/catalogo'
}
