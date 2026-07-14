import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  loginClient,
  registerClient,
  fetchCurrentClient,
  updateClientProfile,
  logoutClient,
} from '../api/clients'
import {
  createClientDirection,
  deleteClientDirection,
  fetchClientDirections,
  updateClientDirection,
} from '../api/clientDirections'
import { clearUserSessionsCache } from '../utils/clearUserSessions'
import {
  mapClientToUser,
  mapRegisterFormToPayload,
  mapUserToProfilePayload,
} from '../utils/clientMapper'
import { mapAddressFormToPayload, mapDirectionToAddress } from '../utils/addressMapper'
import { USER_ROLES } from '../utils/pricing'

let bootstrapSessionPromise = null
let bootstrapSessionToken = null

function resetBootstrapSession() {
  bootstrapSessionPromise = null
  bootstrapSessionToken = null
}

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

async function loadDirectionsForUser(accessToken, user) {
  const response = await fetchClientDirections(accessToken)
  const addresses = (response.data ?? []).map(mapDirectionToAddress).filter(Boolean)
  return { ...user, addresses }
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      hasHydrated: false,

      bootstrapSession: () => {
        const { accessToken, user } = get()
        if (!accessToken) return Promise.resolve()

        if (bootstrapSessionPromise && bootstrapSessionToken === accessToken) {
          return bootstrapSessionPromise
        }

        bootstrapSessionToken = accessToken
        bootstrapSessionPromise = fetchCurrentClient(accessToken)
          .then(async (response) => {
            let nextUser = mapClientToUser(response.data, user)
            try {
              nextUser = await loadDirectionsForUser(accessToken, nextUser)
            } catch {
              nextUser = { ...nextUser, addresses: user?.addresses || [] }
            }
            set({ user: nextUser, isAuthenticated: true })
          })
          .catch(() => {
            resetBootstrapSession()
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
            })
          })

        return bootstrapSessionPromise
      },

      loginWithEmail: async (email, password) => {
        try {
          const response = await loginClient(email, password)
          const { client, access_token, refresh_token } = response.data
          let user = applySession(set, client, {
            access_token,
            refresh_token,
          })
          try {
            user = await loadDirectionsForUser(access_token, user)
            set({ user })
          } catch {
            // Mantener sesión aunque falle la carga inicial de direcciones
          }
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

      syncAddresses: async () => {
        const { user, accessToken } = get()
        if (!user || !accessToken) return { success: false, error: 'Sesión no válida' }

        try {
          const nextUser = await loadDirectionsForUser(accessToken, user)
          set({ user: nextUser })
          return { success: true, addresses: nextUser.addresses }
        } catch (err) {
          return { success: false, error: err.message || 'No se pudieron cargar las direcciones' }
        }
      },

      addAddress: async (address) => {
        const { user, accessToken } = get()
        if (!user || !accessToken) return { success: false, error: 'Sesión no válida' }

        try {
          const response = await createClientDirection(
            mapAddressFormToPayload(address),
            accessToken,
          )
          const created = mapDirectionToAddress(response.data)
          let addresses = [...(user.addresses || []), created]

          if (created.isPrimary) {
            addresses = addresses.map((item) => ({
              ...item,
              isPrimary: item.id === created.id,
            }))
          }

          set({ user: { ...user, addresses } })
          return { success: true, address: created }
        } catch (err) {
          return { success: false, error: err.message || 'No se pudo guardar la dirección' }
        }
      },

      updateAddress: async (id, data) => {
        const { user, accessToken } = get()
        if (!user || !accessToken) return { success: false, error: 'Sesión no válida' }

        const current = user.addresses?.find((item) => item.id === String(id))
        if (!current) return { success: false, error: 'Dirección no encontrada' }

        const merged = { ...current, ...data }

        try {
          const response = await updateClientDirection(
            current.idClientDirection ?? id,
            mapAddressFormToPayload(merged),
            accessToken,
          )
          const updated = mapDirectionToAddress(response.data)
          let addresses = user.addresses.map((item) => (item.id === String(id) ? updated : item))

          if (updated.isPrimary) {
            addresses = addresses.map((item) => ({
              ...item,
              isPrimary: item.id === updated.id,
            }))
          }

          set({ user: { ...user, addresses } })
          return { success: true, address: updated }
        } catch (err) {
          return { success: false, error: err.message || 'No se pudo actualizar la dirección' }
        }
      },

      deleteAddress: async (id) => {
        const { user, accessToken } = get()
        if (!user || !accessToken) return { success: false, error: 'Sesión no válida' }

        const current = user.addresses?.find((item) => item.id === String(id))
        if (!current) return { success: false, error: 'Dirección no encontrada' }

        try {
          await deleteClientDirection(current.idClientDirection ?? id, accessToken)
          const syncResult = await get().syncAddresses()
          if (!syncResult.success) {
            let addresses = user.addresses.filter((item) => item.id !== String(id))
            if (addresses.length && !addresses.some((item) => item.isPrimary)) {
              addresses = addresses.map((item, index) => ({
                ...item,
                isPrimary: index === 0,
              }))
            }
            set({ user: { ...user, addresses } })
          }
          return { success: true }
        } catch (err) {
          return { success: false, error: err.message || 'No se pudo eliminar la dirección' }
        }
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

        resetBootstrapSession()

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },

      clearAllSessions: () => {
        clearUserSessionsCache()
        resetBootstrapSession()
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
        useAuthStore.setState({ hasHydrated: true })

        if (!state?.user) return

        useAuthStore.setState({
          isAuthenticated: Boolean(state.accessToken && state.user),
        })
      },
    },
  ),
)
