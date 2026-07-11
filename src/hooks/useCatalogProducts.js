import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchCatalogProducts } from '../api/products'
import { useAuthStore } from '../stores/authStore'
import { isMayorista } from '../utils/pricing'

export function useCatalogProducts(filters, page, pageSize, filtersKey = null) {
  const accessToken = useAuthStore((state) => state.accessToken)
  const role = useAuthStore((state) => state.user?.role)
  const wholesale = isMayorista(role)

  const resolvedFiltersKey = filtersKey ?? JSON.stringify(filters)
  const filtersRef = useRef(filters)
  filtersRef.current = filters

  const [state, setState] = useState({
    items: [],
    meta: null,
    error: '',
    ready: false,
  })
  const [isFetching, setIsFetching] = useState(false)
  const [refreshCounter, setRefreshCounter] = useState(0)
  const fetchIdRef = useRef(0)

  const requestKey = useMemo(
    () => `${wholesale}|${resolvedFiltersKey}|${page}|${pageSize}|${refreshCounter}`,
    [wholesale, resolvedFiltersKey, page, pageSize, refreshCounter],
  )

  useEffect(() => {
    if (wholesale && !accessToken) {
      setState({
        items: [],
        meta: null,
        error: 'Inicia sesión como mayorista para ver el catálogo.',
        ready: true,
      })
      setIsFetching(false)
      return undefined
    }

    const fetchId = ++fetchIdRef.current

    setIsFetching(true)

    fetchCatalogProducts({
      filters: filtersRef.current,
      page,
      pageSize,
      token: wholesale ? accessToken : null,
      wholesale,
    })
      .then((response) => {
        if (fetchId !== fetchIdRef.current) return

        setState({
          items: response.items,
          meta: response.meta,
          error: '',
          ready: true,
        })
      })
      .catch((error) => {
        if (fetchId !== fetchIdRef.current) return

        setState((prev) => ({
          items: prev.ready ? prev.items : [],
          meta: prev.ready ? prev.meta : null,
          error: error.message || 'No se pudieron cargar los productos',
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
    items: state.items,
    meta: state.meta,
    error: state.error,
    ready: state.ready,
    isFetching,
    refresh: () => setRefreshCounter((count) => count + 1),
  }
}
