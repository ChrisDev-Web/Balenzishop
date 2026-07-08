import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  loginClient,
  registerClient,
  fetchCurrentClient,
  updateClientProfile,
  logoutClient,
} from '../api/clients'
import { clearUserSessionsCache } from '../utils/clearUserSessions'
import {
  mapClientToUser,
  mapRegisterFormToPayload,
  mapUserToProfilePayload,
} from '../utils/clientMapper'
import { USER_ROLES } from '../utils/pricing'

function applySession(set, client, tokens, existingUser = null) {
  const user = mapClientToUser(client, existingUser)
  set({
    user,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    isAuthenticated: true,
  })
  return user
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      bootstrapSession: async () => {
        const { accessToken, user } = get()
        if (!accessToken) return

        try {
          const response = await fetchCurrentClient(accessToken)
          const nextUser = mapClientToUser(response.data, user)
          set({ user: nextUser, isAuthenticated: true })
        } catch {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          })
        }
      },

      loginWithEmail: async (email, password) => {
        try {
          const response = await loginClient(email, password)
          const { client, access_token, refresh_token } = response.data
          const user = applySession(set, client, {
            access_token,
            refresh_token,
          })
          return { success: true, needsProfile: !user.profileComplete }
        } catch (err) {
          return { success: false, error: err.message || 'Correo o contraseña incorrectos' }
        }
      },

      registerWithEmail: async (form) => {
        try {
          const response = await registerClient(mapRegisterFormToPayload(form))
          const { client, access_token, refresh_token } = response.data
          const user = applySession(set, client, {
            access_token,
            refresh_token,
          })
          return { success: true, needsProfile: !user.profileComplete }
        } catch (err) {
          return { success: false, error: err.message || 'No se pudo registrar la cuenta' }
        }
      },

      loginWithGoogle: async () => ({
        success: false,
        error: 'El inicio de sesión con Google estará disponible próximamente',
      }),

      completeProfile: async (data) => {
        const { user, accessToken } = get()
        if (!user || !accessToken) return { success: false, error: 'Sesión no válida' }

        const payload = mapUserToProfilePayload({
          ...user,
          ...data,
        })

        try {
          const response = await updateClientProfile(payload, accessToken)
          const nextUser = mapClientToUser(response.data, user)
          set({ user: nextUser })
          return { success: true }
        } catch (err) {
          return { success: false, error: err.message || 'No se pudo actualizar el perfil' }
        }
      },

      updateProfile: async (data) => {
        const { user, accessToken } = get()
        if (!user || !accessToken) return { success: false, error: 'Sesión no válida' }

        const payload = mapUserToProfilePayload({
          ...user,
          ...data,
        })

        try {
          const response = await updateClientProfile(payload, accessToken)
          const nextUser = mapClientToUser(response.data, user)
          set({ user: nextUser })
          return { success: true }
        } catch (err) {
          return { success: false, error: err.message || 'No se pudo actualizar el perfil' }
        }
      },

      addAddress: (address) => {
        const { user } = get()
        if (!user) return

        const newAddress = { id: crypto.randomUUID(), ...address }
        let addresses = [...(user.addresses || []), newAddress]

        if (address.isPrimary || addresses.length === 1) {
          addresses = addresses.map((a) => ({
            ...a,
            isPrimary: a.id === newAddress.id,
          }))
        }

        set({ user: { ...user, addresses } })
      },

      updateAddress: (id, data) => {
        const { user } = get()
        if (!user) return

        let addresses = user.addresses.map((a) => (a.id === id ? { ...a, ...data } : a))

        if (data.isPrimary) {
          addresses = addresses.map((a) => ({ ...a, isPrimary: a.id === id }))
        }

        set({ user: { ...user, addresses } })
      },

      deleteAddress: (id) => {
        const { user } = get()
        if (!user) return

        let addresses = user.addresses.filter((a) => a.id !== id)
        if (addresses.length && !addresses.some((a) => a.isPrimary)) {
          addresses[0].isPrimary = true
        }

        set({ user: { ...user, addresses } })
      },

      addOrder: (order) => {
        const { user } = get()
        if (!user) return null

        const newOrder = {
          id: order.id,
          date: order.date,
          status: 'pending',
          items: order.items,
          subtotal: order.subtotal,
          discount: order.discount,
          discountCode: order.discountCode || null,
          deliveryFee: order.deliveryFee ?? 0,
          deliveryLabel: order.deliveryLabel || null,
          deliveryMode: order.deliveryMode || null,
          total: order.total,
          address: order.address,
        }

        set({
          user: {
            ...user,
            orders: [newOrder, ...(user.orders || [])],
          },
        })

        return newOrder
      },

      updateOrder: (orderId, orderData) => {
        const { user } = get()
        if (!user) return null

        const orders = (user.orders || []).map((o) => {
          if (o.id !== orderId || o.status !== 'pending') return o
          return {
            ...o,
            date: orderData.date,
            items: orderData.items,
            subtotal: orderData.subtotal,
            discount: orderData.discount,
            discountCode: orderData.discountCode || null,
            deliveryFee: orderData.deliveryFee ?? o.deliveryFee ?? 0,
            deliveryLabel: orderData.deliveryLabel ?? o.deliveryLabel,
            deliveryMode: orderData.deliveryMode ?? o.deliveryMode,
            total: orderData.total,
            address: orderData.address,
          }
        })

        set({ user: { ...user, orders } })
        return orders.find((o) => o.id === orderId) || null
      },

      setUserRole: (userId, role) => {
        if (!Object.values(USER_ROLES).includes(role)) return

        const { user } = get()
        if (user?.id !== String(userId)) return

        set({ user: { ...user, role } })
      },

      logout: async () => {
        const { accessToken, refreshToken } = get()

        if (accessToken && refreshToken) {
          try {
            await logoutClient(refreshToken, accessToken)
          } catch {
            // Invalidar sesión local aunque falle el backend
          }
        }

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },

      clearAllSessions: () => {
        clearUserSessionsCache()
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },
    }),
    {
      name: 'balenzi-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state?.user) return
        useAuthStore.setState({
          isAuthenticated: Boolean(state.accessToken && state.user),
        })
      },
    },
  ),
)
