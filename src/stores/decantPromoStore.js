import { create } from 'zustand'
import { fetchActiveDecantPromotions, fetchBrandSegmentMap } from '../api/decantPromotions'

let loadPromise = null

export const useDecantPromoStore = create((set, get) => ({
  promotions: [],
  brandSegments: {},
  isLoaded: false,
  isLoading: false,
  error: null,

  ensureLoaded: async () => {
    if (get().isLoaded) return
    if (loadPromise) {
      await loadPromise
      return
    }

    set({ isLoading: true, error: null })

    loadPromise = Promise.all([
      fetchActiveDecantPromotions(),
      fetchBrandSegmentMap(),
    ])
      .then(([promotions, brandSegments]) => {
        set({
          promotions,
          brandSegments,
          isLoaded: true,
          isLoading: false,
          error: null,
        })
      })
      .catch((error) => {
        set({
          isLoading: false,
          error: error?.message ?? 'No se pudieron cargar las promociones',
        })
      })
      .finally(() => {
        loadPromise = null
      })

    await loadPromise
  },

  refresh: async () => {
    set({ isLoaded: false })
    await get().ensureLoaded()
  },
}))
