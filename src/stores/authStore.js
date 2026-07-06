import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { resolveUserRole, USER_ROLES } from '../utils/pricing'

const defaultProfile = {
  firstName: '',
  lastNamePaternal: '',
  lastNameMaternal: '',
  email: '',
  documentId: '',
  documentType: '',
  phone: '',
  password: '',
}

function applyRoleToUser(user) {
  if (!user) return null
  const role = resolveUserRole(user.email, user.role)
  const next = { ...user, role }
  delete next.password
  return next
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      registeredUsers: [],

      loginWithEmail: (email, password) => {
        const { registeredUsers } = get()
        const found = registeredUsers.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
        )
        if (!found) return { success: false, error: 'Correo o contraseña incorrectos' }

        const role = resolveUserRole(found.email, found.role)
        const updatedFound = { ...found, role }
        const user = applyRoleToUser(updatedFound)

        set({
          user,
          isAuthenticated: true,
          registeredUsers: registeredUsers.map((u) =>
            u.id === found.id ? { ...updatedFound, password: found.password } : u,
          ),
        })
        return { success: true, needsProfile: !found.profileComplete }
      },

      registerWithEmail: (data) => {
        const { registeredUsers } = get()
        if (registeredUsers.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
          return { success: false, error: 'Este correo ya está registrado' }
        }
        const newUser = {
          id: crypto.randomUUID(),
          ...data,
          role: resolveUserRole(data.email, data.role || USER_ROLES.MINORISTA),
          profileComplete: false,
          addresses: [],
          orders: [],
          authProvider: 'email',
        }
        const user = applyRoleToUser(newUser)
        set({
          registeredUsers: [...registeredUsers, newUser],
          user,
          isAuthenticated: true,
        })
        return { success: true, needsProfile: true }
      },

      loginWithGoogle: (email) => {
        const { registeredUsers } = get()
        let found = registeredUsers.find((u) => u.email.toLowerCase() === email.toLowerCase())

        if (!found) {
          found = {
            id: crypto.randomUUID(),
            email,
            ...defaultProfile,
            email,
            role: resolveUserRole(email, USER_ROLES.MINORISTA),
            profileComplete: false,
            addresses: [],
            orders: [],
            authProvider: 'google',
          }
          set({ registeredUsers: [...registeredUsers, found] })
        } else {
          const role = resolveUserRole(found.email, found.role)
          found = { ...found, role }
          set({
            registeredUsers: registeredUsers.map((u) =>
              u.id === found.id ? { ...found, password: u.password } : u,
            ),
          })
        }

        const user = applyRoleToUser(found)
        set({ user, isAuthenticated: true })
        return { success: true, needsProfile: !found.profileComplete }
      },

      completeProfile: (data) => {
        const { user, registeredUsers } = get()
        if (!user) return

        const updated = {
          ...user,
          ...data,
          profileComplete: true,
        }

        set({
          user: { ...updated, password: undefined },
          registeredUsers: registeredUsers.map((u) =>
            u.id === user.id ? { ...updated } : u,
          ),
        })
      },

      updateProfile: (data) => {
        const { user, registeredUsers } = get()
        if (!user) return

        const updated = { ...user, ...data }
        set({
          user: { ...updated, password: undefined },
          registeredUsers: registeredUsers.map((u) =>
            u.id === user.id ? { ...updated, password: data.password || u.password } : u,
          ),
        })
      },

      addAddress: (address) => {
        const { user, registeredUsers } = get()
        if (!user) return

        const newAddress = { id: crypto.randomUUID(), ...address }
        let addresses = [...(user.addresses || []), newAddress]

        if (address.isPrimary || addresses.length === 1) {
          addresses = addresses.map((a) => ({
            ...a,
            isPrimary: a.id === newAddress.id,
          }))
        }

        const updated = { ...user, addresses }
        set({
          user: updated,
          registeredUsers: registeredUsers.map((u) =>
            u.id === user.id ? { ...updated, password: u.password } : u,
          ),
        })
      },

      updateAddress: (id, data) => {
        const { user, registeredUsers } = get()
        if (!user) return

        let addresses = user.addresses.map((a) => (a.id === id ? { ...a, ...data } : a))

        if (data.isPrimary) {
          addresses = addresses.map((a) => ({ ...a, isPrimary: a.id === id }))
        }

        const updated = { ...user, addresses }
        set({
          user: updated,
          registeredUsers: registeredUsers.map((u) =>
            u.id === user.id ? { ...updated, password: u.password } : u,
          ),
        })
      },

      deleteAddress: (id) => {
        const { user, registeredUsers } = get()
        if (!user) return

        let addresses = user.addresses.filter((a) => a.id !== id)
        if (addresses.length && !addresses.some((a) => a.isPrimary)) {
          addresses[0].isPrimary = true
        }

        const updated = { ...user, addresses }
        set({
          user: updated,
          registeredUsers: registeredUsers.map((u) =>
            u.id === user.id ? { ...updated, password: u.password } : u,
          ),
        })
      },

      addOrder: (order) => {
        const { user, registeredUsers } = get()
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

        const updated = {
          ...user,
          orders: [newOrder, ...(user.orders || [])],
        }

        set({
          user: updated,
          registeredUsers: registeredUsers.map((u) =>
            u.id === user.id ? { ...updated, password: u.password } : u,
          ),
        })

        return newOrder
      },

      updateOrder: (orderId, orderData) => {
        const { user, registeredUsers } = get()
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

        const updated = { ...user, orders }

        set({
          user: updated,
          registeredUsers: registeredUsers.map((u) =>
            u.id === user.id ? { ...updated, password: u.password } : u,
          ),
        })

        return orders.find((o) => o.id === orderId) || null
      },

      /** Para el dashboard administrativo: cambiar rol minorista/mayorista */
      setUserRole: (userId, role) => {
        if (!Object.values(USER_ROLES).includes(role)) return

        const { user, registeredUsers } = get()
        const updatedUsers = registeredUsers.map((u) =>
          u.id === userId ? { ...u, role } : u,
        )
        const nextUser = user?.id === userId ? { ...user, role } : user

        set({ user: nextUser, registeredUsers: updatedUsers })
      },

      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'balenzi-auth',
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const registeredUsers = (state.registeredUsers || []).map((u) => ({
          ...u,
          role: resolveUserRole(u.email, u.role),
        }))
        const user = state.user
          ? applyRoleToUser({ ...state.user, role: resolveUserRole(state.user.email, state.user.role) })
          : null
        useAuthStore.setState({ registeredUsers, user, isAuthenticated: Boolean(user) })
      },
    },
  ),
)
