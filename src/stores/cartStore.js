import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuthStore } from './authStore'
import { orderItemsToCartItems } from '../utils/orderUtils'
import {
  prepareCartItem,
  getDecantCartOptions,
  getMinQuantity,
  capQuantityByStock,
  getCartLineTotal,
  USER_ROLES,
} from '../utils/pricing'

function getCurrentRole() {
  return useAuthStore.getState().user?.role || USER_ROLES.MINORISTA
}

function sameCartLine(a, b) {
  return String(a.id) === String(b.id)
    && (a.idProductDecant ?? null) === (b.idProductDecant ?? null)
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
              const isDecant = Boolean(item.isDecant || item.idProductDecant)
              const itemMinQty = isDecant ? 1 : minQty
              const quantity = capQuantityByStock(
                Math.max(item.quantity, itemMinQty),
                item.stock,
                role,
                isDecant,
                isDecant
                  ? getDecantCartOptions(item, {
                      items: get().items,
                      productId: item.id,
                      excludeDecantId: item.idProductDecant ?? null,
                    })
                  : null,
              )
              if (quantity < itemMinQty) return null
              return prepareCartItem({ ...item, price: basePrice, basePrice }, role, quantity, get().items)
            })
            .filter(Boolean),
        })
      },

      addItem: (perfume, quantity = 1) => {
        const role = getCurrentRole()
        const minQty = getMinQuantity(role)
        const { items } = get()
        const existing = items.find((i) => sameCartLine(i, perfume))
        const nextQuantity = existing ? existing.quantity + quantity : quantity
        const mergedProduct = {
          ...perfume,
          basePrice: existing?.basePrice ?? perfume.basePrice ?? perfume.price,
          stock: perfume.stock ?? existing?.stock,
          availableMl: perfume.availableMl ?? existing?.availableMl,
          decantSizeMl: perfume.decantSizeMl ?? perfume.sizeMl ?? existing?.decantSizeMl,
        }
        const prepared = prepareCartItem(mergedProduct, role, nextQuantity, items)
        const itemMinQty = prepared.isDecant ? 1 : minQty

        if (prepared.quantity < itemMinQty) return

        if (existing) {
          if (prepared.quantity === existing.quantity) return

          set({
            items: items.map((i) =>
              sameCartLine(i, perfume) ? prepared : i,
            ),
          })
        } else {
          set({
            items: [...items, prepared],
          })
        }
      },

      removeItem: (id, idProductDecant = null) => {
        set({
          items: get().items.filter(
            (i) => !(String(i.id) === String(id) && (i.idProductDecant ?? null) === idProductDecant),
          ),
        })
      },

      updateQuantity: (id, quantity, idProductDecant = null) => {
        const role = getCurrentRole()
        const minQty = getMinQuantity(role)
        const item = get().items.find(
          (i) => String(i.id) === String(id) && (i.idProductDecant ?? null) === idProductDecant,
        )

        if (!item) return

        const isDecant = Boolean(item.isDecant || item.idProductDecant)
        const itemMinQty = isDecant ? 1 : minQty

        if (quantity < itemMinQty) {
          get().removeItem(id, idProductDecant)
          return
        }

        const cappedQuantity = capQuantityByStock(
          quantity,
          item.stock,
          role,
          isDecant,
          isDecant
            ? getDecantCartOptions(item, {
                items: get().items,
                productId: item.id,
                excludeDecantId: item.idProductDecant ?? null,
              })
            : null,
        )

        if (cappedQuantity < itemMinQty) {
          get().removeItem(id, idProductDecant)
          return
        }

        set({
          items: get().items.map((i) =>
            sameCartLine(i, item) ? { ...i, quantity: cappedQuantity } : i,
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
        get().items.reduce((sum, i) => sum + getCartLineTotal(i), 0),
    }),
    { name: 'balenzi-cart' },
  ),
)
