import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { orderItemsToCartItems } from '../utils/orderUtils'
import {
  prepareCartItem,
  getDecantCartOptions,
  getMinQuantity,
  capQuantityByStock,
  getCartLineTotal,
} from '../utils/pricing'
import { CART_MODES, resolvePricingRoleForMode } from '../utils/shoppingMode'

function sameCartLine(a, b) {
  return String(a.id) === String(b.id)
    && (a.idProductDecant ?? null) === (b.idProductDecant ?? null)
}

function emptyEditingState() {
  return {
    editingOrderId: null,
    editingOrderDate: null,
    editingDiscountCode: null,
  }
}

function getItemsForMode(state, mode) {
  return mode === CART_MODES.MAYORISTA ? state.mayoristaItems : state.minoristaItems
}

function setItemsForMode(state, mode, items) {
  if (mode === CART_MODES.MAYORISTA) {
    return { mayoristaItems: items }
  }

  return { minoristaItems: items }
}

function getEditingForMode(state, mode) {
  return state.editingByMode?.[mode] ?? emptyEditingState()
}

function setEditingForMode(state, mode, editing) {
  return {
    editingByMode: {
      ...state.editingByMode,
      [mode]: {
        ...getEditingForMode(state, mode),
        ...editing,
      },
    },
  }
}

function migrateLegacyCartState(state) {
  if (Array.isArray(state?.items) && state.minoristaItems == null && state.mayoristaItems == null) {
    return {
      minoristaItems: state.items,
      mayoristaItems: [],
      editingByMode: {
        [CART_MODES.MINORISTA]: {
          editingOrderId: state.editingOrderId ?? null,
          editingOrderDate: state.editingOrderDate ?? null,
          editingDiscountCode: state.editingDiscountCode ?? null,
        },
        [CART_MODES.MAYORISTA]: emptyEditingState(),
      },
      checkoutTab: CART_MODES.MINORISTA,
      isOpen: Boolean(state.isOpen),
    }
  }

  return state
}

export const useCartStore = create(
  persist(
    (set, get) => ({
      minoristaItems: [],
      mayoristaItems: [],
      checkoutTab: CART_MODES.MINORISTA,
      editingByMode: {
        [CART_MODES.MINORISTA]: emptyEditingState(),
        [CART_MODES.MAYORISTA]: emptyEditingState(),
      },
      isOpen: false,

      getItems: (mode = CART_MODES.MINORISTA) => getItemsForMode(get(), mode),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set({ isOpen: !get().isOpen }),

      setCheckoutTab: (mode) => set({ checkoutTab: mode }),

      loadOrderForEditing: (order, mode = CART_MODES.MINORISTA) => {
        const role = resolvePricingRoleForMode(mode)
        set((state) => ({
          ...setItemsForMode(state, mode, orderItemsToCartItems(order.items).map((item) =>
            prepareCartItem({ ...item, price: item.basePrice ?? item.price }, role, item.quantity),
          )),
          ...setEditingForMode(state, mode, {
            editingOrderId: order.id,
            editingOrderDate: order.date,
            editingDiscountCode: order.discountCode || null,
          }),
          checkoutTab: mode,
          isOpen: false,
        }))
      },

      clearEditingOrder: (mode = CART_MODES.MINORISTA) => {
        set((state) => setEditingForMode(state, mode, emptyEditingState()))
      },

      syncCartMode: (mode = CART_MODES.MINORISTA) => {
        const role = resolvePricingRoleForMode(mode)
        const minQty = getMinQuantity(role)

        set((state) => {
          const currentItems = getItemsForMode(state, mode)
          const nextItems = currentItems
            .map((item) => {
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
                      items: currentItems,
                      productId: item.id,
                      excludeDecantId: item.idProductDecant ?? null,
                    })
                  : null,
              )
              if (quantity < itemMinQty) return null
              return prepareCartItem(
                { ...item, price: basePrice, basePrice },
                role,
                quantity,
                currentItems,
              )
            })
            .filter(Boolean)

          return setItemsForMode(state, mode, nextItems)
        })
      },

      addItem: (perfume, quantity = 1, mode = CART_MODES.MINORISTA) => {
        const role = resolvePricingRoleForMode(mode)
        const minQty = getMinQuantity(role)
        const items = getItemsForMode(get(), mode)
        const existing = items.find((item) => sameCartLine(item, perfume))
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

          set((state) => ({
            ...setItemsForMode(
              state,
              mode,
              items.map((item) => (sameCartLine(item, perfume) ? prepared : item)),
            ),
          }))
          return
        }

        set((state) => ({
          ...setItemsForMode(state, mode, [...items, prepared]),
        }))
      },

      removeItem: (id, idProductDecant = null, mode = CART_MODES.MINORISTA) => {
        set((state) => ({
          ...setItemsForMode(
            state,
            mode,
            getItemsForMode(state, mode).filter(
              (item) =>
                !(String(item.id) === String(id)
                  && (item.idProductDecant ?? null) === idProductDecant),
            ),
          ),
        }))
      },

      updateQuantity: (id, quantity, idProductDecant = null, mode = CART_MODES.MINORISTA) => {
        const role = resolvePricingRoleForMode(mode)
        const minQty = getMinQuantity(role)
        const items = getItemsForMode(get(), mode)
        const item = items.find(
          (cartItem) =>
            String(cartItem.id) === String(id)
            && (cartItem.idProductDecant ?? null) === idProductDecant,
        )

        if (!item) return

        const isDecant = Boolean(item.isDecant || item.idProductDecant)
        const itemMinQty = isDecant ? 1 : minQty

        if (quantity < itemMinQty) {
          get().removeItem(id, idProductDecant, mode)
          return
        }

        const cappedQuantity = capQuantityByStock(
          quantity,
          item.stock,
          role,
          isDecant,
          isDecant
            ? getDecantCartOptions(item, {
                items,
                productId: item.id,
                excludeDecantId: item.idProductDecant ?? null,
              })
            : null,
        )

        if (cappedQuantity < itemMinQty) {
          get().removeItem(id, idProductDecant, mode)
          return
        }

        set((state) => ({
          ...setItemsForMode(
            state,
            mode,
            items.map((cartItem) =>
              sameCartLine(cartItem, item) ? { ...cartItem, quantity: cappedQuantity } : cartItem,
            ),
          ),
        }))
      },

      clearCart: (mode = CART_MODES.MINORISTA) => {
        set((state) => ({
          ...setItemsForMode(state, mode, []),
          ...setEditingForMode(state, mode, emptyEditingState()),
        }))
      },

      totalItems: (mode = CART_MODES.MINORISTA) =>
        getItemsForMode(get(), mode).reduce((sum, item) => sum + item.quantity, 0),

      totalPrice: (mode = CART_MODES.MINORISTA) =>
        getItemsForMode(get(), mode).reduce((sum, item) => sum + getCartLineTotal(item), 0),

      getEditingState: (mode = CART_MODES.MINORISTA) => getEditingForMode(get(), mode),
    }),
    {
      name: 'balenzi-carts',
      version: 1,
      migrate: (persistedState, version) => {
        if (version === 0) {
          return migrateLegacyCartState(persistedState)
        }

        return persistedState
      },
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...migrateLegacyCartState(persistedState ?? {}),
      }),
      onRehydrateStorage: () => (state) => {
        if (!state || state.minoristaItems?.length || state.mayoristaItems?.length) {
          return
        }

        try {
          const legacyRaw = localStorage.getItem('balenzi-cart')
          if (!legacyRaw) return

          const legacyState = JSON.parse(legacyRaw)?.state
          if (Array.isArray(legacyState?.items) && legacyState.items.length > 0) {
            state.minoristaItems = legacyState.items
          }
        } catch {
          // Ignore invalid legacy cart payloads.
        }
      },
    },
  ),
)
