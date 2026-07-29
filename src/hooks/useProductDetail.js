import { useEffect, useState } from 'react'
import { fetchCatalogProductDetail } from '../api/products'
import { STORE_NS } from '../core/cache/moduleCacheNamespaces'
import { runPersistedValueFetch, usePersistedValueQuery } from '../core/cache/usePersistedValueQuery'
import { useAuthStore } from '../stores/authStore'
import { isMayorista } from '../utils/pricing'

export function useProductDetail(productId) {
  const accessToken = useAuthStore((state) => state.accessToken)
  const role = useAuthStore((state) => state.user?.role)
  const wholesale = isMayorista(role)

  const [refreshCounter, setRefreshCounter] = useState(0)
  const stableCacheKey = `${productId}|${wholesale}`
  const queryKey = `${stableCacheKey}|${refreshCounter}|${accessToken ?? ''}`
  const enabled = Boolean(productId) && !(wholesale && !accessToken)

  const {
    value: product,
    error,
    ready: cachedReady,
    isFetching,
    commitValueResult,
    setData,
  } = usePersistedValueQuery({
    namespace: STORE_NS.productDetail,
    stableCacheKey,
    queryKey,
    defaultValue: null,
    isEmpty: (value) => value == null,
  })

  useEffect(() => {
    if (!productId) return undefined

    if (wholesale && !accessToken) {
      setData({
        key: queryKey,
        value: null,
        error: 'Inicia sesión como mayorista para ver este producto.',
      })
      return undefined
    }

    let ignore = false

    runPersistedValueFetch({
      fetcher: () =>
        fetchCatalogProductDetail(productId, {
          token: wholesale ? accessToken : null,
          wholesale,
        }),
      queryKey,
      commitValueResult: (result) => {
        if (!ignore) commitValueResult(result)
      },
      fallbackError: 'No se pudo cargar el producto',
      defaultValue: null,
    })

    return () => {
      ignore = true
    }
  }, [accessToken, commitValueResult, productId, queryKey, setData, wholesale])

  const ready = wholesale && !accessToken ? true : cachedReady

  return {
    product: wholesale && !accessToken ? null : product,
    error: wholesale && !accessToken
      ? 'Inicia sesión como mayorista para ver este producto.'
      : error,
    ready,
    isFetching: enabled && isFetching,
    refresh: () => setRefreshCounter((count) => count + 1),
  }
}
