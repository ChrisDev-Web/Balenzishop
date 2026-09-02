const STORAGE_KEY = 'balenzishop_guest_orders'

function readStore() {
  if (typeof window === 'undefined') {
    return { orders: [] }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { orders: [] }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed?.orders)) {
      return { orders: [] }
    }

    return parsed
  } catch {
    return { orders: [] }
  }
}

function writeStore(store) {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // Ignore storage failures.
  }
}

export function listGuestOrders() {
  return readStore().orders
}

export function saveGuestOrder(entry) {
  if (!entry?.id_client_order || !entry?.guest_token) return

  const store = readStore()
  const nextEntry = {
    id_client_order: Number(entry.id_client_order),
    order_number: entry.order_number ?? '',
    guest_token: entry.guest_token,
    created_at: entry.created_at ?? new Date().toISOString(),
    total_amount: entry.total_amount ?? null,
    status: entry.status ?? 'Pendiente',
    display_status: entry.display_status ?? entry.status ?? 'Pendiente',
  }

  const orders = [
    nextEntry,
    ...store.orders.filter((order) => order.id_client_order !== nextEntry.id_client_order),
  ]

  writeStore({ orders })
}

export function updateGuestOrder(id, patch) {
  const store = readStore()
  const orders = store.orders.map((order) =>
    order.id_client_order === Number(id) ? { ...order, ...patch } : order,
  )

  writeStore({ orders })
}

export function removeGuestOrder(id) {
  const store = readStore()
  writeStore({
    orders: store.orders.filter((order) => order.id_client_order !== Number(id)),
  })
}

export function findGuestOrder(id) {
  return listGuestOrders().find((order) => order.id_client_order === Number(id)) ?? null
}
