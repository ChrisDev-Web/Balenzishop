import { useCallback, useEffect, useState } from 'react'
import { fetchActiveCategories } from '../api/categories'
import { STORE_NS } from '../core/cache/moduleCacheNamespaces'
import { runPersistedValueFetch, usePersistedValueQuery } from '../core/cache/usePersistedValueQuery'

const CACHE_KEY = 'default'

export function useActiveCategories() {
  const [refreshCounter, setRefreshCounter] = useState(0)
  const stableCacheKey = CACHE_KEY
  const queryKey = `${stableCacheKey}|${refreshCounter}`

  const {
    value: categories,
    error,
    ready,
    commitValueResult,
  } = usePersistedValueQuery({
    namespace: STORE_NS.categories,
    stableCacheKey,
    queryKey,
    defaultValue: [],
    isEmpty: (items) => !Array.isArray(items) || items.length === 0,
  })

  useEffect(() => {
    let ignore = false

    runPersistedValueFetch({
      fetcher: fetchActiveCategories,
      queryKey,
      commitValueResult: (result) => {
        if (!ignore) commitValueResult(result)
      },
      fallbackError: 'No se pudieron cargar las categorías',
      defaultValue: [],
    })

    return () => {
      ignore = true
    }
  }, [commitValueResult, queryKey])

  const refetch = useCallback(() => setRefreshCounter((count) => count + 1), [])

  return { categories, ready, error, refetch }
}
