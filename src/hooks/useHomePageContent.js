import { useMemo } from 'react'
import { useShopPageSection } from './useShopPageSection'
import { mapHomeHeroImage, mapHomeSpotlightItem } from '../utils/shopPageItemMapper'

export function useHomePageContent() {
  const { items, ready, error, refetch } = useShopPageSection('inicio')

  const heroImage = useMemo(() => mapHomeHeroImage(items), [items])
  const spotlight = useMemo(() => mapHomeSpotlightItem(items), [items])

  return {
    heroImage,
    spotlight,
    ready,
    error,
    refetch,
  }
}
