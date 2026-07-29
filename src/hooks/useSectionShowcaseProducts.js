import { useEffect, useState } from 'react'
import { fetchActiveCategories } from '../api/categories'
import { fetchCatalogProducts } from '../api/products'
import { getCacheEntry, setCacheEntry } from '../core/cache/moduleCache'
import { STORE_NS } from '../core/cache/moduleCacheNamespaces'
import { useModuleCacheVersion } from '../core/cache/useModuleCacheVersion'
import { catalogLinkForCategory, findCategoryByName, sectionCategoryName } from '../utils/categoryUtils'

const SECTIONS_WITH_PRODUCTS = new Set(['mujeres', 'hombres', 'promociones'])
const DEFAULT_PAGE_SIZE = 10
const EMPTY_SHOWCASE = { products: [], catalogHref: '/catalogo' }

export function useSectionShowcaseProducts(section, pageSize = DEFAULT_PAGE_SIZE) {
  useModuleCacheVersion()

  const enabled = SECTIONS_WITH_PRODUCTS.has(section)
  const categoryName = enabled ? sectionCategoryName(section) : null
  const stableCacheKey = `${section}|${pageSize}`
  const queryKey = stableCacheKey

  const cachedEntry = enabled ? getCacheEntry(STORE_NS.sectionShowcase, stableCacheKey) : null
  const [data, setData] = useState(() => {
    if (!cachedEntry) {
      return {
        key: '',
        products: EMPTY_SHOWCASE.products,
        catalogHref: EMPTY_SHOWCASE.catalogHref,
        error: null,
      }
    }

    return {
      key: queryKey,
      products: cachedEntry.products ?? EMPTY_SHOWCASE.products,
      catalogHref: cachedEntry.catalogHref ?? EMPTY_SHOWCASE.catalogHref,
      error: cachedEntry.error ?? null,
    }
  })

  const hasResolvedData = data.key === queryKey
  const products = hasResolvedData ? data.products : (cachedEntry?.products ?? EMPTY_SHOWCASE.products)
  const catalogHref = hasResolvedData
    ? data.catalogHref
    : (cachedEntry?.catalogHref ?? EMPTY_SHOWCASE.catalogHref)
  const error = hasResolvedData ? data.error : (cachedEntry?.error ?? null)
  const isInitialLoading =
    enabled && !hasResolvedData && !cachedEntry && products.length === 0
  const ready = !enabled || hasResolvedData || Boolean(cachedEntry) || products.length > 0

  useEffect(() => {
    if (!enabled || !categoryName) {
      setData({
        key: queryKey,
        products: [],
        catalogHref: '/catalogo',
        error: null,
      })
      return undefined
    }

    let ignore = false

    async function loadShowcase() {
      try {
        const categoriesCache = getCacheEntry(STORE_NS.categories, 'default')
        const categories = categoriesCache?.value ?? (await fetchActiveCategories())

        if (!categoriesCache?.value) {
          setCacheEntry(STORE_NS.categories, 'default', {
            value: categories,
            error: '',
          })
        }

        const category = findCategoryByName(categories, categoryName)

        if (!category) {
          const nextData = {
            key: queryKey,
            products: [],
            catalogHref: '/catalogo',
            error: `No se encontró la categoría "${categoryName}".`,
          }
          setCacheEntry(STORE_NS.sectionShowcase, stableCacheKey, {
            products: nextData.products,
            catalogHref: nextData.catalogHref,
            error: nextData.error,
          })
          if (!ignore) setData(nextData)
          return
        }

        const href = catalogLinkForCategory(category)
        const { items } = await fetchCatalogProducts({
          filters: { categories: [category.value] },
          page: 1,
          pageSize,
        })

        const nextData = {
          key: queryKey,
          products: items,
          catalogHref: href,
          error: null,
        }

        setCacheEntry(STORE_NS.sectionShowcase, stableCacheKey, {
          products: nextData.products,
          catalogHref: nextData.catalogHref,
          error: '',
        })

        if (!ignore) setData(nextData)
      } catch (err) {
        const nextData = {
          key: queryKey,
          products: [],
          catalogHref: '/catalogo',
          error: err.message || 'No se pudieron cargar los productos',
        }
        setCacheEntry(STORE_NS.sectionShowcase, stableCacheKey, {
          products: nextData.products,
          catalogHref: nextData.catalogHref,
          error: nextData.error,
        })
        if (!ignore) setData(nextData)
      }
    }

    loadShowcase()

    return () => {
      ignore = true
    }
  }, [categoryName, enabled, pageSize, queryKey, stableCacheKey])

  return { products, catalogHref, ready, isInitialLoading, error }
}
