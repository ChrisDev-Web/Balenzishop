import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchActiveCategories } from '../api/categories'

export function useActiveCategories() {
  const [categories, setCategories] = useState([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const loadCategories = useCallback(async ({ silent = false } = {}) => {
    try {
      const items = await fetchActiveCategories()
      if (mounted.current) {
        setCategories(items)
        setError(null)
      }
    } catch (err) {
      if (mounted.current && !silent) {
        setError(err.message || 'No se pudieron cargar las categorías')
      }
    } finally {
      if (mounted.current) setReady(true)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const refetch = useCallback(() => loadCategories({ silent: true }), [loadCategories])

  return { categories, ready, error, refetch }
}
