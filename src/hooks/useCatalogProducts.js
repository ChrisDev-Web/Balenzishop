import { useEffect, useRef, useState } from 'react'
import { fetchCatalogProducts } from '../api/products'
import { runPersistedListFetch, usePersistedListQuery } from '../core/cache/usePersistedListQuery'
import { STORE_NS } from '../core/cache/moduleCacheNamespaces'
import { useAuthStore } from '../stores/authStore'
import { isMayorista } from '../utils/pricing'

export function useCatalogProducts(filters, page, pageSize, filtersKey = null) {
  const accessToken = useAuthStore((state) => state.accessToken)
  const role = useAuthStore((state) => state.user?.role)
  const wholesale = isMayorista(role)

  const resolvedFiltersKey = filtersKey ?? JSON.stringify(filters)
  const filtersRef = useRef(filters)
  filtersRef.current = filters

  const [refreshCounter, setRefreshCounter] = useState(0)
  const stableCacheKey = `${wholesale}|${resolvedFiltersKey}|${page}|${pageSize}`
  const queryKey = `${stableCacheKey}|${refreshCounter}`
  const enabled = !(wholesale && !accessToken)

  const {
    items,
    meta,
    error,
    ready: cachedReady,
    isFetching,
    commitListResult,
    setData,
  } = usePersistedListQuery({
    namespace: STORE_NS.catalogProducts,
    stableCacheKey,
    queryKey,
    enabled,
  })

  useEffect(() => {
    if (!enabled) {
      setData({
        key: queryKey,
        items: [],
        meta: null,
        error: 'Inicia sesión como mayorista para ver el catálogo.',
      })
      return undefined
    }

    let ignore = false

    runPersistedListFetch({
      fetcher: () =>
        fetchCatalogProducts({
          filters: filtersRef.current,
          page,
          pageSize,
          token: wholesale ? accessToken : null,
          wholesale,
        }),
      queryKey,
      commitListResult: (result) => {
        if (!ignore) commitListResult(result)
      },
      fallbackError: 'No se pudieron cargar los productos',
    })

    return () => {
      ignore = true
    }
  }, [accessToken, commitListResult, enabled, page, pageSize, queryKey, setData, wholesale])

  const ready = enabled ? cachedReady : true

  return {
    items: enabled ? items : [],
    meta: enabled ? meta : null,
    error: enabled ? error : 'Inicia sesión como mayorista para ver el catálogo.',
    ready,
    isFetching: enabled && isFetching,
    refresh: () => setRefreshCounter((count) => count + 1),
  }
}
