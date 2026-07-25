import { create } from 'zustand'
import { clearPendingCheckoutDraft } from '../utils/checkoutReservationStorage'

export const useCheckoutDraftStore = create((set) => ({
  draftOrderId: null,
  promptCancelOnOpen: false,
  resumeChecked: false,

  setActiveDraft: (orderId, { promptCancelOnOpen = false } = {}) =>
    set({
      draftOrderId: orderId ? Number(orderId) : null,
      promptCancelOnOpen: Boolean(promptCancelOnOpen),
    }),

  clearActiveDraft: () =>
    set({
      draftOrderId: null,
      promptCancelOnOpen: false,
    }),

  dismissPromptCancel: () => set({ promptCancelOnOpen: false }),

  setResumeChecked: (value) => set({ resumeChecked: Boolean(value) }),
}))

export function clearCheckoutDraftSession() {
  clearPendingCheckoutDraft()
  useCheckoutDraftStore.setState({
    draftOrderId: null,
    promptCancelOnOpen: false,
    resumeChecked: false,
  })
}
