import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useCartStore } from './cartStore'
import { CART_MODES } from '../utils/shoppingMode'

export const COMPRA_RAPIDA_STEPS = {
  SETUP: 'setup',
  CATALOG: 'catalog',
  SUMMARY: 'summary',
  CHECKOUT: 'checkout',
}

export const COMPRA_RAPIDA_CHANNELS = {
  SHALOM: 'shalom',
  RAINAU_LIMA: 'rainau_lima',
}

const emptyCustomer = {
  name: '',
  last_name_paternal: '',
  last_name_maternal: '',
  id_document_type: '',
  document_number: '',
  phone: '',
}

const emptyDeliveryForm = {
  idRegion: '',
  region: '',
  city: '',
  idProvince: '',
  idDistrict: '',
  idShalon: '',
  district: '',
  shalonName: '',
  shalonLat: null,
  shalonLng: null,
  shalon: '',
  fullAddress: '',
  googleMapsLink: '',
  geoLat: null,
  geoLng: null,
  coverageZone: null,
  deliveryFee: 0,
}

const initialState = {
  step: COMPRA_RAPIDA_STEPS.SETUP,
  deliveryChannel: null,
  customer: emptyCustomer,
  deliveryForm: emptyDeliveryForm,
  deliveryScope: null,
  catalogTab: 'sellados',
  cartItems: [],
  setupSaved: false,
  setupReturnStep: null,
}

export const useCompraRapidaStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      setStep: (step) => set({ step }),

      openSetupForEdit: (returnStep) => set({
        step: COMPRA_RAPIDA_STEPS.SETUP,
        setupReturnStep: returnStep,
      }),

      setDeliveryChannel: (deliveryChannel) => set({
        deliveryChannel,
        deliveryForm: emptyDeliveryForm,
        deliveryScope: deliveryChannel === COMPRA_RAPIDA_CHANNELS.RAINAU_LIMA ? 'lima' : null,
        setupSaved: false,
      }),

      setCustomer: (patch) => set((state) => ({
        customer: { ...state.customer, ...patch },
        setupSaved: false,
      })),

      setDeliveryForm: (patch) => set((state) => ({
        deliveryForm: { ...state.deliveryForm, ...patch },
        setupSaved: false,
      })),

      setDeliveryScope: (deliveryScope) => set({ deliveryScope, setupSaved: false }),

      setCatalogTab: (catalogTab) => set({ catalogTab }),

      markSetupSaved: () => {
        const returnStep = get().setupReturnStep
        set({
          setupSaved: true,
          step: returnStep ?? COMPRA_RAPIDA_STEPS.CATALOG,
          setupReturnStep: null,
        })
      },

      addCartItem: (product, quantity = 1) => {
        const lineKey = product.idProductDecant
          ? `${product.id}-${product.idProductDecant}`
          : String(product.id)

        set((state) => {
          const existing = state.cartItems.find((item) => item.lineKey === lineKey)

          if (existing) {
            return {
              cartItems: state.cartItems.map((item) => (
                item.lineKey === lineKey
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              )),
            }
          }

          return {
            cartItems: [
              ...state.cartItems,
              {
                lineKey,
                id: product.id,
                idProductDecant: product.idProductDecant ?? null,
                isDecant: Boolean(product.idProductDecant),
                sizeMl: product.sizeMl ?? null,
                name: product.name,
                brand: product.brand ?? '',
                image: product.image ?? '',
                price: Number(product.price ?? 0),
                quantity,
                stock: product.stock ?? null,
              },
            ],
          }
        })
      },

      updateCartQuantity: (lineKey, quantity) => {
        set((state) => ({
          cartItems: state.cartItems
            .map((item) => (
              item.lineKey === lineKey ? { ...item, quantity } : item
            ))
            .filter((item) => item.quantity > 0),
        }))
      },

      removeCartItem: (lineKey) => {
        set((state) => ({
          cartItems: state.cartItems.filter((item) => item.lineKey !== lineKey),
        }))
      },

      resetFlow: () => {
        useCartStore.getState().clearCart(CART_MODES.MINORISTA)
        set({
          ...initialState,
          customer: { ...emptyCustomer },
          deliveryForm: { ...emptyDeliveryForm },
          setupReturnStep: null,
        })
      },

      cartCount: () => get().cartItems.reduce((sum, item) => sum + item.quantity, 0),

      cartSubtotal: () => get().cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      ),
    }),
    {
      name: 'balenzishop-compra-rapida',
      merge: (persisted, current) => {
        const stored = persisted && typeof persisted === 'object' ? persisted : {}
        const validSteps = new Set(Object.values(COMPRA_RAPIDA_STEPS))

        return {
          ...current,
          ...stored,
          customer: {
            ...emptyCustomer,
            ...(stored.customer && typeof stored.customer === 'object' ? stored.customer : {}),
          },
          deliveryForm: {
            ...emptyDeliveryForm,
            ...(stored.deliveryForm && typeof stored.deliveryForm === 'object' ? stored.deliveryForm : {}),
          },
        cartItems: [],
        step: validSteps.has(stored.step) ? stored.step : COMPRA_RAPIDA_STEPS.SETUP,
        }
      },
      partialize: (state) => ({
        step: state.step,
        deliveryChannel: state.deliveryChannel,
        customer: state.customer,
        deliveryForm: state.deliveryForm,
        deliveryScope: state.deliveryScope,
        catalogTab: state.catalogTab,
        setupSaved: state.setupSaved,
      }),
    },
  ),
)