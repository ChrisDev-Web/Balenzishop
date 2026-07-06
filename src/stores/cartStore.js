import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuthStore } from './authStore'
import { orderItemsToCartItems } from '../utils/orderUtils'
import {
  prepareCartItem,
  getMinQuantity,
  USER_ROLES,
} from '../utils/pricing'

function getCurrentRole() {
  return useAuthStore.getState().user?.role || USER_ROLES.MINORISTA
}

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      editingOrderId: null,
      editingOrderDate: null,
      editingDiscountCode: null,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set({ isOpen: !get().isOpen }),

      loadOrderForEditing: (order) => {
        const role = getCurrentRole()
        set({
          items: orderItemsToCartItems(order.items).map((item) =>
            prepareCartItem({ ...item, price: item.basePrice ?? item.price }, role, item.quantity),
          ),
          editingOrderId: order.id,
          editingOrderDate: order.date,
          editingDiscountCode: order.discountCode || null,
          isOpen: false,
        })
      },

      clearEditingOrder: () =>
        set({
          editingOrderId: null,
          editingOrderDate: null,
          editingDiscountCode: null,
        }),

      syncWithUserRole: (role = getCurrentRole()) => {
        const minQty = getMinQuantity(role)
        set({
          items: get().items.map((item) => {
            const basePrice = item.basePrice ?? item.price
            const quantity = Math.max(item.quantity, minQty)
            return prepareCartItem({ ...item, price: basePrice, basePrice }, role, quantity)
          }),
        })
      },

      addItem: (perfume, quantity = 1) => {
        const role = getCurrentRole()
        const { items } = get()
        const existing = items.find((i) => i.id === perfume.id)

        if (existing) {
          set({
            items: items.map((i) =>
              i.id === perfume.id
                ? prepareCartItem(
                    { ...perfume, basePrice: i.basePrice ?? perfume.price },
                    role,
                    i.quantity + quantity,
                  )
                : i,
            ),
          })
        } else {
          set({
            items: [...items, prepareCartItem(perfume, role, quantity)],
          })
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) })
      },

      updateQuantity: (id, quantity) => {
        const role = getCurrentRole()
        const minQty = getMinQuantity(role)

        if (quantity < minQty) {
          get().removeItem(id)
          return
        }

        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity } : i,
          ),
        })
      },

      clearCart: () =>
        set({
          items: [],
          editingOrderId: null,
          editingOrderDate: null,
          editingDiscountCode: null,
        }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: 'balenzi-cart' },
  ),
)
