import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ShoppingBag, Eye, Plus } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useCartStore } from '../../stores/cartStore'
import OrderDetailModal from '../../components/account/OrderDetailModal'
import Pagination from '../../components/catalog/Pagination'
import { paginate } from '../../utils/filterPerfumes'

const ORDERS_PER_PAGE = 4

const tabs = [
  { key: 'all', label: 'Todos Mis Pedidos' },
  { key: 'in_progress', label: 'Pedidos en Curso', statuses: ['pending', 'in_progress'] },
  { key: 'delivered', label: 'Pedidos Entregados', statuses: ['delivered'] },
  { key: 'cancelled', label: 'Pedidos Cancelados', statuses: ['cancelled'] },
]

const STATUS_LABELS = {
  pending: 'Pendiente',
  in_progress: 'En curso',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-600',
}

const periods = [
  { value: '3m', label: 'últimos 3 meses' },
  { value: '6m', label: 'últimos 6 meses' },
  { value: '1y', label: 'último año' },
  { value: 'all', label: 'todos' },
]

export default function OrdersPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const loadOrderForEditing = useCartStore((s) => s.loadOrderForEditing)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState('3m')
  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState(null)

  const orders = user?.orders || []
  const activeTabConfig = tabs.find((t) => t.key === activeTab)

  const filtered = useMemo(() => orders.filter((o) => {
    if (activeTab !== 'all' && activeTabConfig?.statuses && !activeTabConfig.statuses.includes(o.status)) {
      return false
    }
    if (search && !o.id.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [orders, activeTab, activeTabConfig, search])

  const { items: paginatedOrders, currentPage, totalPages, totalItems } = paginate(filtered, page, ORDERS_PER_PAGE)

  useEffect(() => {
    setPage(1)
  }, [activeTab, search, period])

  useEffect(() => {
    if (page > totalPages) setPage(Math.max(1, totalPages))
  }, [page, totalPages])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [page])

  const handleAddProducts = (order) => {
    loadOrderForEditing(order)
    navigate('/catalogo')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Mis pedidos</h1>
      <p className="mt-1 text-sm text-gray-600">
        Aquí podrás encontrar información sobre el estado, fechas de entrega y otros detalles de tus pedidos online.
      </p>

      <div className="mt-6 flex gap-6 overflow-x-auto border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 pb-3 text-sm font-medium transition ${
              activeTab === tab.key
                ? 'border-b-2 border-black text-black'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600">
          {String(totalItems).padStart(2, '0')} pedidos realizados
          {totalItems > ORDERS_PER_PAGE && (
            <span className="text-gray-400">
              {' '}· Mostrando {(currentPage - 1) * ORDERS_PER_PAGE + 1}–{Math.min(currentPage * ORDERS_PER_PAGE, totalItems)}
            </span>
          )}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por N° de pedido"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-gray-900 focus:outline-none sm:w-64"
            />
          </div>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-900 focus:outline-none"
          >
            {periods.map((p) => (
              <option key={p.value} value={p.value}>Periodo: {p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {totalItems === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
            <ShoppingBag className="h-10 w-10 text-gray-300" />
          </div>
          <p className="mt-6 max-w-md text-sm text-gray-500">
            No encontramos pedidos que cumplan con tus criterios de búsqueda, prueba usar otro número de pedido.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {paginatedOrders.map((order) => {
            const itemCount = order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0
            const isPending = order.status === 'pending'

            return (
              <li
                key={order.id}
                className="rounded-lg border border-gray-200 bg-white p-4 sm:flex sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-900">#{order.id}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-800'}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">{order.date}</p>
                  <div className="mt-2 flex items-baseline justify-between gap-4 sm:hidden">
                    <p className="text-xs text-gray-500">{itemCount} ítem{itemCount !== 1 ? 's' : ''}</p>
                    <p className="text-sm font-bold text-gray-900">S/ {order.total?.toFixed(2)}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3 sm:mt-0 sm:shrink-0 sm:flex-row sm:items-center sm:gap-3 sm:border-0 sm:pt-0">
                  <div className="hidden text-right sm:block">
                    <p className="text-xs text-gray-500">{itemCount} ítem{itemCount !== 1 ? 's' : ''}</p>
                    <p className="text-sm font-bold text-gray-900">S/ {order.total?.toFixed(2)}</p>
                  </div>
                  {isPending && (
                    <button
                      type="button"
                      onClick={() => handleAddProducts(order)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-full bg-black px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-gray-800 sm:w-auto sm:py-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Agregar productos
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(order)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-full border border-black px-3.5 py-2.5 text-xs font-semibold text-black hover:bg-gray-50 sm:w-auto sm:py-1.5"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Ver pedido
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {totalItems > ORDERS_PER_PAGE && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onAddProducts={handleAddProducts}
        />
      )}
    </div>
  )
}
