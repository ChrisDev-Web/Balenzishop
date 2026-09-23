import { Component, lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, Loader2, Package, Truck } from 'lucide-react'
import {
  fetchGuestOrderTrackingDetail,
  fetchGuestOrderTrackingShalom,
} from '../api/guestOrderTracking'
import { mapGuestTrackingOrder } from '../utils/guestOrderTrackingMapper'
import { isShalomReceiptPdf } from '../utils/shalomReceipt.js'

const ShalomReceiptPreview = lazy(() => import('../components/account/ShalomReceiptPreview.jsx'))
const ShalomReceiptEmptyState = lazy(async () => {
  const module = await import('../components/account/ShalomReceiptPreview.jsx')
  return { default: module.ShalomReceiptEmptyState }
})

const STATUS_BADGE_STYLES = {
  Pendiente: 'bg-amber-100 text-amber-800',
  'En Proceso': 'bg-blue-100 text-blue-800',
  Enviado: 'bg-emerald-100 text-emerald-800',
  Entregado: 'bg-gray-100 text-gray-800',
  Cancelado: 'bg-gray-100 text-gray-600',
}

function formatTrackingDate(value) {
  if (!value) return null

  const normalized = value.replace(' ', 'T')
  const date = new Date(normalized)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatCurrency(value) {
  return `S/ ${Number(value || 0).toFixed(2)}`
}

class GuestOrderTrackingErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <GuestOrderTrackingShell>
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-700">
            No se pudo mostrar el seguimiento del pedido. Intenta abrir el enlace nuevamente.
          </div>
        </GuestOrderTrackingShell>
      )
    }

    return this.props.children
  }
}

function GuestOrderTrackingShell({ children }) {
  return (
    <div className="relative min-h-dvh flex-1 bg-[#eef1f5]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-white/70" />
        <div className="absolute -right-24 top-1/4 h-[28rem] w-[28rem] rounded-full bg-white/50" />
        <div className="absolute bottom-10 left-1/3 h-64 w-64 rounded-full bg-white/40" />
      </div>

      <div className="relative mx-auto w-full max-w-3xl px-4 py-8 lg:px-6 lg:py-10">
        {children}
      </div>
    </div>
  )
}

function GuestOrderTrackingHeader() {
  return (
    <header className="mb-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition hover:text-brand-dark"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a Balenzishop
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#1f2937] sm:text-[2rem]">
        Seguimiento de tu pedido
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
        Consulta el estado de tu envío Shalom y descarga tu boleta.
      </p>
    </header>
  )
}

function ShalomGuideDetails({ shalom }) {
  if (!shalom?.guideNumber) return null

  const parts = [
    <>
      Guía Shalom: <span className="font-semibold text-gray-900">{shalom.guideNumber}</span>
    </>,
  ]

  if (shalom.guideCode) {
    parts.push(
      <>
        Código: <span className="font-semibold text-gray-900">{shalom.guideCode}</span>
      </>,
    )
  }

  if (shalom.pickupKey) {
    parts.push(
      <>
        Clave: <span className="font-semibold text-gray-900">{shalom.pickupKey}</span>
      </>,
    )
  }

  return (
    <p className="mt-2 text-sm text-gray-500">
      {parts.map((part, index) => (
        <span key={index}>
          {index > 0 ? <span className="mx-2 text-gray-300">|</span> : null}
          {part}
        </span>
      ))}
    </p>
  )
}

function TrackingTimeline({ timeline }) {
  return (
    <ol className="m-0 list-none p-0">
      {timeline.map((step, index) => {
        const isLast = index === timeline.length - 1

        return (
          <li key={step.key || `${step.label}-${index}`} className={`relative flex gap-4 ${isLast ? '' : 'pb-6'}`}>
            <div className="relative flex w-5 shrink-0 justify-center">
              {!isLast ? (
                <span
                  className="absolute bottom-0 left-1/2 top-4 w-px -translate-x-1/2 bg-gray-200"
                  aria-hidden="true"
                />
              ) : null}
              <span
                className={`relative z-10 mt-1.5 block h-3.5 w-3.5 shrink-0 rounded-full ${
                  step.completed ? 'bg-[#1f2937]' : 'border-2 border-gray-300 bg-white'
                }`}
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className={`text-sm font-semibold leading-snug ${step.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                {step.label}
              </p>
              {step.date ? (
                <p className="mt-1 text-xs text-gray-500">{formatTrackingDate(step.date)}</p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function GuestOrderTrackingContent() {
  const { token = '' } = useParams()
  const [activeTab, setActiveTab] = useState('tracking')
  const [order, setOrder] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [trackingLoading, setTrackingLoading] = useState(false)
  const [error, setError] = useState('')
  const [trackingError, setTrackingError] = useState('')

  useEffect(() => {
    if (!token) {
      setError('El enlace de seguimiento no es válido.')
      setLoading(false)
      return undefined
    }

    let cancelled = false

    async function loadPage() {
      setLoading(true)
      setError('')
      setTrackingError('')

      try {
        const detailResponse = await fetchGuestOrderTrackingDetail(token)
        if (cancelled) return

        if (!detailResponse?.success) {
          setError(detailResponse?.message ?? 'No se pudo cargar el pedido.')
          setOrder(null)
          return
        }

        setOrder(mapGuestTrackingOrder(detailResponse.data))
        setTrackingLoading(true)

        const trackingResponse = await fetchGuestOrderTrackingShalom(token)
        if (cancelled) return

        if (trackingResponse?.success) {
          setTimeline(trackingResponse.data?.timeline ?? [])
        } else {
          setTrackingError(trackingResponse?.message ?? 'No se pudo consultar el estado del envío.')
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError?.message ?? 'No se pudo cargar el pedido.')
          setOrder(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setTrackingLoading(false)
        }
      }
    }

    loadPage()

    return () => {
      cancelled = true
    }
  }, [token])

  const tabs = useMemo(() => ([
    { id: 'tracking', label: 'Estado del envío', icon: Truck },
    { id: 'receipt', label: 'Boleta Shalom', icon: FileText },
  ]), [])

  const receiptIsPdf = isShalomReceiptPdf({
    receiptIsPdf: order?.shalom?.receiptIsPdf,
    receiptName: order?.shalom?.receiptName,
    receiptUrl: order?.shalom?.receiptUrl,
  })

  return (
    <GuestOrderTrackingShell>
      <GuestOrderTrackingHeader />

      {loading ? (
        <div className="flex items-center justify-center py-24 text-sm text-gray-500">
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Cargando pedido...
          </span>
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!loading && !error && order ? (
        <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
          <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-light">
                <Package className="h-5 w-5 text-brand" aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      STATUS_BADGE_STYLES[order.status] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <Truck className="h-3.5 w-3.5" aria-hidden="true" />
                    {order.status}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    Pedido #{order.orderNumber}
                  </span>
                </div>

                <ShalomGuideDetails shalom={order.shalom} />
              </div>
            </div>
          </div>

          <div className="border-b border-gray-100 px-5 sm:px-6">
            <div className="flex gap-1" role="tablist" aria-label="Secciones del envío">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`inline-flex items-center gap-2 border-b-2 px-3 py-3.5 text-sm font-semibold transition sm:px-4 ${
                      isActive
                        ? 'border-brand text-brand'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="px-5 py-6 sm:px-6">
            {activeTab === 'tracking' ? (
              <>
                {trackingLoading ? (
                  <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Consultando estado en Shalom...
                  </div>
                ) : null}

                {!trackingLoading && trackingError ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    {trackingError}
                  </div>
                ) : null}

                {!trackingLoading && !trackingError ? (
                  <TrackingTimeline timeline={timeline} />
                ) : null}
              </>
            ) : null}

            {activeTab === 'receipt' ? (
              <Suspense
                fallback={(
                  <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Cargando boleta...
                  </div>
                )}
              >
                {order.shalom?.receiptUrl ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Boleta registrada por el equipo de Balenzishop para tu envío Shalom.
                    </p>
                    <ShalomReceiptPreview
                      trackingToken={token}
                      receiptUrl={order.shalom.receiptUrl}
                      receiptName={order.shalom.receiptName}
                      receiptIsPdf={receiptIsPdf}
                    />
                  </div>
                ) : (
                  <ShalomReceiptEmptyState />
                )}
              </Suspense>
            ) : null}
          </div>

          <div className="border-t border-gray-100 bg-[#f8f9fb] px-5 py-5 sm:px-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Package className="h-4 w-4 text-gray-700" aria-hidden="true" />
              Resumen del pedido
            </div>

            <ul className="space-y-3 text-sm text-gray-600">
              {order.items?.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4">
                  <span className="min-w-0">
                    {item.quantity} x {item.name}
                  </span>
                  <span className="shrink-0 font-semibold text-gray-900">
                    {formatCurrency(item.discountedSubtotal || item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-center justify-between border-t border-gray-200 pt-4 text-sm font-bold text-gray-900">
              <span className="inline-flex items-center gap-2">
                <Truck className="h-4 w-4 text-gray-700" aria-hidden="true" />
                Total
              </span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>
      ) : null}
    </GuestOrderTrackingShell>
  )
}

export default function GuestOrderTrackingPage() {
  return (
    <GuestOrderTrackingErrorBoundary>
      <GuestOrderTrackingContent />
    </GuestOrderTrackingErrorBoundary>
  )
}
