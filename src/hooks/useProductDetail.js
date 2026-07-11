import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchCatalogProductDetail } from '../api/products'
import { useAuthStore } from '../stores/authStore'
import { isMayorista } from '../utils/pricing'

export function useProductDetail(productId) {
  const accessToken = useAuthStore((state) => state.accessToken)
  const role = useAuthStore((state) => state.user?.role)
  const wholesale = isMayorista(role)

  const [state, setState] = useState({
    product: null,
    error: '',
    ready: false,
  })
  const [isFetching, setIsFetching] = useState(false)
  const [refreshCounter, setRefreshCounter] = useState(0)
  const fetchIdRef = useRef(0)

  const requestKey = useMemo(
    () => `${productId}|${wholesale}|${accessToken ?? ''}|${refreshCounter}`,
    [productId, wholesale, accessToken, refreshCounter],
  )

  useEffect(() => {
    if (!productId) return undefined

    if (wholesale && !accessToken) {
      setState({
        product: null,
        error: 'Inicia sesión como mayorista para ver este producto.',
        ready: true,
      })
      setIsFetching(false)
      return undefined
    }

    const fetchId = ++fetchIdRef.current

    setIsFetching(true)
    setState((prev) => ({
      ...prev,
      error: '',
    }))

    fetchCatalogProductDetail(productId, {
      token: wholesale ? accessToken : null,
      wholesale,
    })
      .then((product) => {
        if (fetchId !== fetchIdRef.current) return

        setState({
          product,
          error: '',
          ready: true,
        })
      })
      .catch((error) => {
        if (fetchId !== fetchIdRef.current) return

        setState((prev) => ({
          product: prev.ready ? prev.product : null,
          error: error.message || 'No se pudo cargar el producto',
          ready: true,
        }))
      })
      .finally(() => {
        if (fetchId === fetchIdRef.current) {
          setIsFetching(false)
        }
      })

    return undefined
  }, [requestKey])

  return {
    product: state.product,
    error: state.error,
    ready: state.ready,
    isFetching,
    refresh: () => setRefreshCounter((count) => count + 1),
  }
}
