import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ShoppingBag, Eye, Plus, Wallet } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useCartStore } from '../../stores/cartStore'
import { fetchMyClientOrders } from '../../api/clientOrders'
import { fetchActivePaymentMethods } from '../../api/paymentMethods'
import { mapApiClientOrders, mapApiClientOrder } from '../../utils/clientOrderMapper'
import { buildBalancePaymentWhatsAppMessage, formatOrderDate, openWhatsAppOrder } from '../../utils/orderMessage'
import BalancePaymentModal from '../../components/account/BalancePaymentModal'
import OrderDetailModal from '../../components/account/OrderDetailModal'
import Pagination from '../../components/catalog/Pagination'
import { paginate } from '../../utils/filterPerfumes'

const ORDERS_PER_PAGE = 5

const tabs = [
  { key: 'all', label: 'Todos Mis Pedidos' },
  { key: 'pending', label: 'Pendientes', statuses: ['Pendiente'] },
  { key: 'process', label: 'En proceso', statuses: ['En Proceso'] },
  { key: 'shipped', label: 'Enviados', statuses: ['Enviado'] },
  { key: 'received', label: 'Recibidos', statuses: ['Recibido'] },
  { key: 'cancelled', label: 'Cancelados', statuses: ['Cancelado'] },
]

const STATUS_STYLES = {
  Pendiente: 'bg-amber-100 text-amber-800',
  'En Proceso': 'bg-blue-100 text-blue-800',
  Enviado: 'bg-green-100 text-green-800',
  Recibido: 'bg-gray-100 text-gray-800',
  Cancelado: 'bg-gray-100 text-gray-600',
}

const periods = [
  { value: '3m', label: 'últimos 3 meses' },
  { value: '6m', label: 'últimos 6 meses' },
  { value: '1y', label: 'último año' },
  { value: 'all', label: 'todos' },
]

export default function OrdersPage() {
  const navigate = useNavigate()
  const { accessToken, user } = useAuthStore()
  const loadOrderForEditing = useCartStore((s) => s.loadOrderForEditing)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState('3m')
  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [balanceOrder, setBalanceOrder] = useState(null)
  const [paymentMethods, setPaymentMethods] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const activeTabConfig = tabs.find((t) => t.key === activeTab)

  function reloadOrders() {
    if (!accessToken) return Promise.resolve()

    return fetchMyClientOrders(accessToken, { page: 1, page_size: 50 })
      .then((response) => {
        setOrders(mapApiClientOrders(response.data?.items ?? []))
      })
  }

  useEffect(() => {
    fetchActivePaymentMethods()
      .then((methods) => setPaymentMethods(methods ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!accessToken) {
      setOrders([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setLoadError('')

    fetchMyClientOrders(accessToken, { page: 1, page_size: 50 })
      .then((response) => {
        if (cancelled) return
        setOrders(mapApiClientOrders(response.data?.items ?? []))
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [accessToken])

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

  async function handleBalancePaymentSubmitted(apiOrder, { payments }) {
    const mapped = mapApiClientOrder(apiOrder)
    const message = buildBalancePaymentWhatsAppMessage({
      orderId: mapped.orderNumber,
      date: formatOrderDate(new Date()),
      total: mapped.total,
      balanceDue: mapped.balanceDue,
      amountPaid: mapped.amountPaid,
      payments,
      customer: user,
    })

    await openWhatsAppOrder(message)
    await reloadOrders()
    setBalanceOrder(null)
  }

  return (
    <div className="flex flex-1 flex-col">
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
            className={`shrink-0 -mb-px border-b-2 pb-3 text-sm font-medium transition ${
              activeTab === tab.key
                ? 'border-black text-black'
                : 'border-transparent text-gray-600 hover:text-gray-900'
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

      <section className="mt-6 flex flex-1 flex-col">
        {loading ? (
          <>
            <p className="py-8 text-center text-sm text-gray-500">Cargando pedidos…</p>
            <div className="min-h-[12rem] flex-1" aria-hidden="true" />
          </>
        ) : loadError ? (
          <>
            <p className="py-8 text-center text-sm text-red-600">{loadError}</p>
            <div className="min-h-[12rem] flex-1" aria-hidden="true" />
          </>
        ) : totalItems === 0 ? (
          <>
            <div className="flex flex-col items-center py-8 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                <ShoppingBag className="h-10 w-10 text-gray-300" />
              </div>
              <p className="mt-6 max-w-md text-sm text-gray-500">
                {orders.length === 0
                  ? 'Aún no tienes ningún pedido registrado. Cuando reserves un pedido en el catálogo, aparecerá aquí.'
                  : 'No encontramos pedidos que cumplan con tus criterios de búsqueda. Prueba con otro número de pedido o cambia el filtro.'}
              </p>
            </div>
            <div className="min-h-[12rem] flex-1" aria-hidden="true" />
          </>
        ) : (
          <>
            <ul className="space-y-3">
              {paginatedOrders.map((order) => {
                const itemCount = order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0
                const isPending = order.status === 'Pendiente'
                const canPayBalance = order.canSubmitBalancePayment

                return (
                  <li
                    key={order.idClientOrder || order.id}
                    className="rounded-lg border border-gray-200 bg-white p-4 sm:flex sm:items-center sm:justify-between sm:gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900">#{order.id}</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-800'}`}>
                          {order.status}
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
                      {canPayBalance && (
                        <button
                          type="button"
                          onClick={() => setBalanceOrder(order)}
                          className="flex w-full items-center justify-center gap-1.5 rounded-full bg-black px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-gray-800 sm:w-auto sm:py-1.5"
                        >
                          <Wallet className="h-3.5 w-3.5" />
                          Pago restante
                        </button>
                      )}
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

            {totalItems > ORDERS_PER_PAGE && (
              <div className="mt-3 shrink-0 [&_nav]:!mt-0">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}

            <div className="min-h-[12rem] flex-1" aria-hidden="true" />
          </>
        )}
      </section>

      {balanceOrder && (
        <BalancePaymentModal
          open={Boolean(balanceOrder)}
          onClose={() => setBalanceOrder(null)}
          order={balanceOrder}
          accessToken={accessToken}
          paymentMethods={paymentMethods}
          customer={user}
          onSubmitted={handleBalancePaymentSubmitted}
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
