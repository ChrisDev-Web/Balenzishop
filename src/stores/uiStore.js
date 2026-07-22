import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { AUTH_INTENT, captureAuthReturnTo } from '../utils/authFlow'

export const useUiStore = create(
  persist(
    (set) => ({
      loginModalOpen: false,
      authIntent: AUTH_INTENT.ONBOARDING,
      authReturnTo: null,

      openLoginModal: (intent = AUTH_INTENT.ONBOARDING, returnTo = null) =>
        set({
          loginModalOpen: true,
          authIntent: intent,
          authReturnTo: returnTo ?? captureAuthReturnTo(),
        }),

      closeLoginModal: () => set({ loginModalOpen: false }),

      finishAuthFlow: () =>
        set({ authIntent: AUTH_INTENT.ONBOARDING, authReturnTo: null }),

      clearAuthIntent: () =>
        set({ authIntent: AUTH_INTENT.ONBOARDING, authReturnTo: null }),
    }),
    {
      name: 'balenzi-ui',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        authIntent: state.authIntent,
        authReturnTo: state.authReturnTo,
      }),
    },
  ),
)
