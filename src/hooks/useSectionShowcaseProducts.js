import { useEffect, useRef, useState } from 'react'
import { fetchActiveCategories } from '../api/categories'
import { fetchCatalogProducts } from '../api/products'
import { catalogLinkForCategory, findCategoryByName, sectionCategoryName } from '../utils/categoryUtils'

const SECTIONS_WITH_PRODUCTS = new Set(['mujeres', 'hombres', 'promociones'])
const DEFAULT_PAGE_SIZE = 10

export function useSectionShowcaseProducts(section, pageSize = DEFAULT_PAGE_SIZE) {
  const enabled = SECTIONS_WITH_PRODUCTS.has(section)
  const categoryName = enabled ? sectionCategoryName(section) : null
  const [products, setProducts] = useState([])
  const [catalogHref, setCatalogHref] = useState('/catalogo')
  const [ready, setReady] = useState(!enabled)
  const [error, setError] = useState(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!enabled || !categoryName) {
      setProducts([])
      setCatalogHref('/catalogo')
      setReady(true)
      setError(null)
      return undefined
    }

    let ignore = false

    async function loadProducts() {
      setReady(false)
      setError(null)

      try {
        const categories = await fetchActiveCategories()
        const category = findCategoryByName(categories, categoryName)

        if (!category) {
          if (mounted.current && !ignore) {
            setProducts([])
            setError(`No se encontró la categoría "${categoryName}".`)
            setReady(true)
          }
          return
        }

        const href = catalogLinkForCategory(category)

        const { items } = await fetchCatalogProducts({
          filters: { categories: [category.value] },
          page: 1,
          pageSize,
        })

        if (!mounted.current || ignore) return

        setProducts(items)
        setCatalogHref(href)
        setError(null)
      } catch (err) {
        if (!mounted.current || ignore) return

        setProducts([])
        setError(err.message || 'No se pudieron cargar los productos')
      } finally {
        if (mounted.current && !ignore) {
          setReady(true)
        }
      }
    }

    loadProducts()

    return () => {
      ignore = true
    }
  }, [categoryName, enabled, pageSize])

  return { products, catalogHref, ready, error }
}
