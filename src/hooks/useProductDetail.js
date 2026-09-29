import { useEffect, useState } from 'react'
import { fetchCatalogProductDetail } from '../api/products'
import { STORE_NS } from '../core/cache/moduleCacheNamespaces'
import { runPersistedValueFetch, usePersistedValueQuery } from '../core/cache/usePersistedValueQuery'
import { useAuthStore } from '../stores/authStore'
import { useWholesaleGuestStore } from '../stores/wholesaleGuestStore'
import { isMayorista } from '../utils/pricing'

export function useProductDetail(productId, options = {}) {
  const { wholesale = false } = options
  const accessToken = useAuthStore((state) => state.accessToken)
  const user = useAuthStore((state) => state.user)
  const guestToken = useWholesaleGuestStore((state) => state.guestToken)

  const [refreshCounter, setRefreshCounter] = useState(0)
  const stableCacheKey = `${productId}|${wholesale}`
  const queryKey = `${stableCacheKey}|${refreshCounter}|${guestToken ?? ''}|${accessToken ?? ''}`

  const wholesaleAuthToken = wholesale && isMayorista(user?.role) ? accessToken : null
  const wholesaleGuestAuthToken = wholesale && !wholesaleAuthToken ? guestToken : null
  const enabled = Boolean(productId) && (!wholesale || Boolean(wholesaleAuthToken || wholesaleGuestAuthToken))

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

    if (!enabled) {
      setData({
        key: queryKey,
        value: null,
        error: 'Ingresa tu clave de acceso mayorista para ver este producto.',
      })
      return undefined
    }

    let ignore = false

    runPersistedValueFetch({
      fetcher: () =>
        fetchCatalogProductDetail(productId, {
          token: wholesaleAuthToken,
          wholesaleGuestToken: wholesaleGuestAuthToken,
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
  }, [
    commitValueResult,
    enabled,
    productId,
    queryKey,
    setData,
    wholesale,
    wholesaleAuthToken,
    wholesaleGuestAuthToken,
  ])

  const ready = enabled ? cachedReady : true

  return {
    product: enabled ? product : null,
    error: enabled ? error : 'Ingresa tu clave de acceso mayorista para ver este producto.',
    ready,
    isFetching: enabled && isFetching,
    refresh: () => setRefreshCounter((count) => count + 1),
  }
}
