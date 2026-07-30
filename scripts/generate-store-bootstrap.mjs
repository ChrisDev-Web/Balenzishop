#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const outputPath = join(rootDir, 'public', 'bootstrap', 'store-cache.json')

const apiBase = (process.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1/').replace(/\/?$/, '/')

const STORE_NS = {
  catalogProducts: 'store.catalogProducts',
  categories: 'store.categories',
  brands: 'store.brands',
  shopPageItems: 'store.shopPageItems',
  sectionShowcase: 'store.sectionShowcase',
}

const SECTIONS = ['inicio', 'mujeres', 'hombres', 'promociones']
const SECTION_CATEGORY = {
  mujeres: 'Damas',
  hombres: 'Caballeros',
  promociones: 'Sets',
}

async function apiGet(path, params = {}) {
  const url = new URL(path.replace(/^\//, ''), apiBase)
  Object.entries(params).forEach(([key, value]) => {
    if (value == null) return
    if (Array.isArray(value)) {
      value.forEach((item) => url.searchParams.append(`${key}[]`, String(item)))
      return
    }
    url.searchParams.set(key, String(value))
  })

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`GET ${url} failed with ${response.status}`)
  }

  const payload = await response.json()
  if (!payload?.success) {
    throw new Error(payload?.message || `GET ${url} returned unsuccessful response`)
  }

  return payload.data
}

function mapCategory(category) {
  return {
    value: String(category.id_category),
    label: category.name,
    ...category,
  }
}

function mapBrand(brand) {
  return {
    value: String(brand.id_brand),
    label: brand.name,
    ...brand,
  }
}

function mapCatalogProduct(item) {
  const price = Number(item.price?.sale_price ?? 0)

  return {
    id: item.id_product,
    idProduct: item.id_product,
    name: item.name,
    brand: item.brand_name ?? '',
    image: item.photo || '',
    price: Number.isNaN(price) ? 0 : price,
    referencePrice: item.reference_price?.sale_price ?? null,
    basePrice: Number.isNaN(price) ? 0 : price,
    originalPrice: item.price?.is_live ? item.price?.normal_sale_price ?? null : item.reference_price?.sale_price ?? null,
    isLivePrice: Boolean(item.price?.is_live),
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

function catalogLink(categoryId) {
  if (!categoryId) return '/catalogo'
  return `/catalogo?categories=${encodeURIComponent(String(categoryId))}`
}

function findCategoryByName(categories, name) {
  const normalized = name.trim().toLowerCase()
  return (
    categories.find((category) => {
      const label = (category.label ?? category.name ?? '').trim().toLowerCase()
      return label === normalized
    }) ?? null
  )
}

function pushEntry(entries, namespace, key, value) {
  entries.push({
    namespace,
    key,
    value: {
      ...value,
      fetchedAt: Date.now(),
    },
  })
}

async function buildBootstrapEntries() {
  const entries = []
  const bootstrap = await apiGet('catalog/bootstrap_public', {
    page: 1,
    page_size: 20,
  })

  const categories = (bootstrap.categories ?? []).map(mapCategory)
  const brands = (bootstrap.brands ?? []).map(mapBrand)
  const catalogItems = (bootstrap.products?.items ?? []).map(mapCatalogProduct)
  const catalogMeta = bootstrap.products?.meta ?? null

  pushEntry(entries, STORE_NS.categories, 'default', {
    value: categories,
    error: '',
  })

  pushEntry(entries, STORE_NS.brands, 'default', {
    value: brands,
    error: '',
  })

  pushEntry(entries, STORE_NS.catalogProducts, `false|{}|1|20`, {
    items: catalogItems,
    meta: catalogMeta,
    error: '',
  })

  for (const section of SECTIONS) {
    const items = await apiGet('shop_page_items/list_active_public', { section })
    pushEntry(entries, STORE_NS.shopPageItems, section, {
      value: items,
      error: '',
    })
  }

  for (const [section, categoryName] of Object.entries(SECTION_CATEGORY)) {
    const category = findCategoryByName(categories, categoryName)

    if (!category) {
      pushEntry(entries, STORE_NS.sectionShowcase, `${section}|10`, {
        products: [],
        catalogHref: '/catalogo',
        error: `No se encontró la categoría "${categoryName}".`,
      })
      continue
    }

    const products = await apiGet('products/list_active_public', {
      page: 1,
      page_size: 10,
      id_category: [Number(category.value)],
    })

    pushEntry(entries, STORE_NS.sectionShowcase, `${section}|10`, {
      products: (products.items ?? []).map(mapCatalogProduct),
      catalogHref: catalogLink(category.value),
      error: '',
    })
  }

  return entries
}

async function main() {
  try {
    const entries = await buildBootstrapEntries()
    const payload = {
      version: 1,
      generatedAt: new Date().toISOString(),
      entries,
    }

    await mkdir(dirname(outputPath), { recursive: true })
    await writeFile(outputPath, `${JSON.stringify(payload)}\n`, 'utf8')

    console.log(`Bootstrap cache written to ${outputPath} (${entries.length} entries)`)
  } catch (error) {
    console.warn('[bootstrap] Skipped generating store cache:', error.message)
    const fallback = {
      version: 1,
      generatedAt: new Date().toISOString(),
      entries: [],
    }
    await mkdir(dirname(outputPath), { recursive: true })
    await writeFile(outputPath, `${JSON.stringify(fallback)}\n`, 'utf8')
  }
}

main()
