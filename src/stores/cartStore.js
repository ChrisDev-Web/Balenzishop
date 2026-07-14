import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuthStore } from './authStore'
import { orderItemsToCartItems } from '../utils/orderUtils'
import {
  prepareCartItem,
  getMinQuantity,
  capQuantityByStock,
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
          items: get()
            .items.map((item) => {
              const basePrice = item.basePrice ?? item.price
              const quantity = capQuantityByStock(Math.max(item.quantity, minQty), item.stock, role)
              if (quantity < minQty) return null
              return prepareCartItem({ ...item, price: basePrice, basePrice }, role, quantity)
            })
            .filter(Boolean),
        })
      },

      addItem: (perfume, quantity = 1) => {
        const role = getCurrentRole()
        const minQty = getMinQuantity(role)
        const { items } = get()
        const existing = items.find((i) => i.id === perfume.id)
        const nextQuantity = existing ? existing.quantity + quantity : quantity
        const mergedProduct = {
          ...perfume,
          basePrice: existing?.basePrice ?? perfume.basePrice ?? perfume.price,
          stock: perfume.stock ?? existing?.stock,
        }
        const prepared = prepareCartItem(mergedProduct, role, nextQuantity)

        if (prepared.quantity < minQty) return

        if (existing) {
          if (prepared.quantity === existing.quantity) return

          set({
            items: items.map((i) =>
              i.id === perfume.id ? prepared : i,
            ),
          })
        } else {
          set({
            items: [...items, prepared],
          })
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) })
      },

      updateQuantity: (id, quantity) => {
        const role = getCurrentRole()
        const minQty = getMinQuantity(role)
        const item = get().items.find((i) => i.id === id)

        if (!item) return

        if (quantity < minQty) {
          get().removeItem(id)
          return
        }

        const cappedQuantity = capQuantityByStock(quantity, item.stock, role)

        if (cappedQuantity < minQty) {
          get().removeItem(id)
          return
        }

        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity: cappedQuantity } : i,
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
