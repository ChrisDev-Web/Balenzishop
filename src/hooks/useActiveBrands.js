import { useCallback, useEffect, useState } from 'react'
import { fetchActiveBrands } from '../api/brands'
import { STORE_NS } from '../core/cache/moduleCacheNamespaces'
import { runPersistedValueFetch, usePersistedValueQuery } from '../core/cache/usePersistedValueQuery'

const CACHE_KEY = 'default'

export function useActiveBrands() {
  const [refreshCounter, setRefreshCounter] = useState(0)
  const stableCacheKey = CACHE_KEY
  const queryKey = `${stableCacheKey}|${refreshCounter}`

  const {
    value: brands,
    error,
    ready,
    commitValueResult,
  } = usePersistedValueQuery({
    namespace: STORE_NS.brands,
    stableCacheKey,
    queryKey,
    defaultValue: [],
    isEmpty: (items) => !Array.isArray(items) || items.length === 0,
  })

  useEffect(() => {
    let ignore = false

    runPersistedValueFetch({
      fetcher: fetchActiveBrands,
      queryKey,
      commitValueResult: (result) => {
        if (!ignore) commitValueResult(result)
      },
      fallbackError: 'No se pudieron cargar las marcas',
      defaultValue: [],
    })

    return () => {
      ignore = true
    }
  }, [commitValueResult, queryKey])

  const refetch = useCallback(() => setRefreshCounter((count) => count + 1), [])

  return { brands, ready, error, refetch }
}
