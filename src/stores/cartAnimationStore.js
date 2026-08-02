import { create } from 'zustand'

export const useCartAnimationStore = create((set) => ({
  flights: [],
  cartShake: false,

  launchFlight: (flight) =>
    set((state) => ({
      flights: [...state.flights, flight],
    })),

  removeFlight: (id) =>
    set((state) => ({
      flights: state.flights.filter((flight) => flight.id !== id),
    })),

  bumpCart: () => {
    set({ cartShake: true })
    window.setTimeout(() => {
      set({ cartShake: false })
    }, 550)
  },
}))
