import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchActiveShopPageItems } from '../api/shopPageItems'
import { STORE_NS } from '../core/cache/moduleCacheNamespaces'
import { runPersistedValueFetch, usePersistedValueQuery } from '../core/cache/usePersistedValueQuery'
import { preloadHeroImage } from '../utils/mediaUrl'
import {
  mapShopPageHeroBanners,
  mapShopPageSeriesGridItems,
} from '../utils/shopPageItemMapper'

export function useShopPageSection(section, catalogHref = '/catalogo') {
  const [refreshCounter, setRefreshCounter] = useState(0)
  const stableCacheKey = section
  const queryKey = `${stableCacheKey}|${refreshCounter}`

  const {
    value: items,
    error,
    ready,
    isInitialLoading,
    commitValueResult,
  } = usePersistedValueQuery({
    namespace: STORE_NS.shopPageItems,
    stableCacheKey,
    queryKey,
    defaultValue: [],
    isEmpty: (value) => !Array.isArray(value) || value.length === 0,
  })

  useEffect(() => {
    let ignore = false

    runPersistedValueFetch({
      fetcher: () => fetchActiveShopPageItems(section),
      queryKey,
      commitValueResult: (result) => {
        if (!ignore) commitValueResult(result)
      },
      fallbackError: 'No se pudieron cargar los banners',
      defaultValue: [],
    })

    return () => {
      ignore = true
    }
  }, [commitValueResult, queryKey, section])

  useEffect(() => {
    const firstHero = items.find(
      (item) =>
        item.placement === 'hero_top' &&
        item.image &&
        (item.section === 'inicio' || item.section === section),
    )
    if (firstHero?.image) {
      preloadHeroImage(firstHero.image)
    }
  }, [items, section])

  const heroBanners = useMemo(
    () => mapShopPageHeroBanners(items, catalogHref),
    [catalogHref, items],
  )
  const seriesItems = useMemo(
    () => mapShopPageSeriesGridItems(items, catalogHref),
    [catalogHref, items],
  )

  const refetch = useCallback(() => setRefreshCounter((count) => count + 1), [])

  return {
    items,
    heroBanners,
    seriesItems,
    ready,
    isInitialLoading,
    error,
    refetch,
  }
}
