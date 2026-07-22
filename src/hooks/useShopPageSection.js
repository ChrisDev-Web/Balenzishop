import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchActiveShopPageItems } from '../api/shopPageItems'
import { preloadHeroImage } from '../utils/mediaUrl'
import {
  mapShopPageHeroBanners,
  mapShopPageSeriesGridItems,
} from '../utils/shopPageItemMapper'

export function useShopPageSection(section, catalogHref = '/catalogo') {
  const [items, setItems] = useState([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const loadItems = useCallback(async () => {
    try {
      const data = await fetchActiveShopPageItems(section)
      if (mounted.current) {
        setItems(data)
        setError(null)

        const firstHero = data.find(
          (item) =>
            item.placement === 'hero_top' &&
            item.image &&
            (item.section === 'inicio' || item.section === section),
        )
        if (firstHero?.image) {
          preloadHeroImage(firstHero.image)
        }
      }
    } catch (err) {
      if (mounted.current) {
        setItems([])
        setError(err.message || 'No se pudieron cargar los banners')
      }
    } finally {
      if (mounted.current) {
        setReady(true)
      }
    }
  }, [section])

  useEffect(() => {
    setReady(false)
    loadItems()
  }, [loadItems])

  const heroBanners = useMemo(
    () => mapShopPageHeroBanners(items, catalogHref),
    [catalogHref, items],
  )
  const seriesItems = useMemo(
    () => mapShopPageSeriesGridItems(items, catalogHref),
    [catalogHref, items],
  )

  return {
    items,
    heroBanners,
    seriesItems,
    ready,
    error,
    refetch: loadItems,
  }
}
