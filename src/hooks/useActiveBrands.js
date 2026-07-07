import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchActiveBrands } from '../api/brands'

export function useActiveBrands() {
  const [brands, setBrands] = useState([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const loadBrands = useCallback(async ({ silent = false } = {}) => {
    try {
      const items = await fetchActiveBrands()
      if (mounted.current) {
        setBrands(items)
        setError(null)
      }
    } catch (err) {
      if (mounted.current && !silent) {
        setError(err.message || 'No se pudieron cargar las marcas')
      }
    } finally {
      if (mounted.current) setReady(true)
    }
  }, [])

  useEffect(() => {
    loadBrands()
  }, [loadBrands])

  useEffect(() => {
    const handleFocus = () => loadBrands({ silent: true })
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loadBrands])

  const refetch = useCallback(() => loadBrands({ silent: true }), [loadBrands])

  return { brands, ready, error, refetch }
}
