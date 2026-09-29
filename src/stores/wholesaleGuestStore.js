import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useWholesaleGuestStore = create(
  persist(
    (set) => ({
      guestToken: null,
      setGuestToken: (guestToken) => set({ guestToken: guestToken || null }),
      clearGuestAccess: () => set({ guestToken: null }),
    }),
    {
      name: 'balenzi-wholesale-guest',
      partialize: (state) => ({ guestToken: state.guestToken }),
    },
  ),
)

export function hasWholesaleGuestAccess() {
  return Boolean(useWholesaleGuestStore.getState().guestToken)
}

export function getWholesaleGuestToken() {
  return useWholesaleGuestStore.getState().guestToken
}
