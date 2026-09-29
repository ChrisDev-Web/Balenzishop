import { useEffect, useRef, useState } from 'react'
import { fetchCatalogProducts } from '../api/products'
import { runPersistedListFetch, usePersistedListQuery } from '../core/cache/usePersistedListQuery'
import { STORE_NS } from '../core/cache/moduleCacheNamespaces'
import { useAuthStore } from '../stores/authStore'
import { useWholesaleGuestStore } from '../stores/wholesaleGuestStore'
import { isMayorista } from '../utils/pricing'

export function useCatalogProducts(filters, page, pageSize, filtersKey = null, options = {}) {
  const { wholesale = false } = options
  const accessToken = useAuthStore((state) => state.accessToken)
  const user = useAuthStore((state) => state.user)
  const guestToken = useWholesaleGuestStore((state) => state.guestToken)

  const resolvedFiltersKey = filtersKey ?? JSON.stringify(filters)
  const filtersRef = useRef(filters)
  filtersRef.current = filters

  const [refreshCounter, setRefreshCounter] = useState(0)
  const stableCacheKey = `${wholesale}|${resolvedFiltersKey}|${page}|${pageSize}`
  const queryKey = `${stableCacheKey}|${refreshCounter}|${guestToken ?? ''}|${accessToken ?? ''}`

  const wholesaleAuthToken = wholesale && isMayorista(user?.role) ? accessToken : null
  const wholesaleGuestAuthToken = wholesale && !wholesaleAuthToken ? guestToken : null
  const enabled = !wholesale || Boolean(wholesaleAuthToken || wholesaleGuestAuthToken)

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
        error: 'Ingresa tu clave de acceso mayorista para ver el catálogo.',
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
          token: wholesaleAuthToken,
          wholesaleGuestToken: wholesaleGuestAuthToken,
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
  }, [
    commitListResult,
    enabled,
    page,
    pageSize,
    queryKey,
    setData,
    wholesale,
    wholesaleAuthToken,
    wholesaleGuestAuthToken,
  ])

  const ready = enabled ? cachedReady : true

  return {
    items: enabled ? items : [],
    meta: enabled ? meta : null,
    error: enabled ? error : 'Ingresa tu clave de acceso mayorista para ver el catálogo.',
    ready,
    isFetching: enabled && isFetching,
    refresh: () => setRefreshCounter((count) => count + 1),
  }
}
