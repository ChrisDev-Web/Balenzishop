import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { AUTH_INTENT } from '../utils/authFlow'

export const useUiStore = create(
  persist(
    (set) => ({
      loginModalOpen: false,
      authIntent: AUTH_INTENT.ONBOARDING,

      openLoginModal: (intent = AUTH_INTENT.ONBOARDING) =>
        set({ loginModalOpen: true, authIntent: intent }),

      closeLoginModal: () => set({ loginModalOpen: false }),

      clearAuthIntent: () => set({ authIntent: AUTH_INTENT.ONBOARDING }),
    }),
    {
      name: 'balenzi-ui',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ authIntent: state.authIntent }),
    },
  ),
)
