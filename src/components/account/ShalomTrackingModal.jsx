import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, X } from 'lucide-react'
import ImageZoomPreview from './ImageZoomPreview.jsx'
import ShalomReceiptPreview, { ShalomReceiptEmptyState } from './ShalomReceiptPreview.jsx'
import useBodyScrollLock from '../../hooks/useBodyScrollLock'
import { isShalomReceiptPdf } from '../../utils/shalomReceipt.js'

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

export default function ShalomTrackingModal({
  orderNumber,
  orderClientId = null,
  guideNumber,
  guideCode = '',
  pickupKey = '',
  timeline = [],
  receiptUrl = '',
  receiptName = '',
  receiptIsPdf = false,
  isLoading = false,
  error = '',
  onClose,
}) {
  const [activeTab, setActiveTab] = useState('tracking')
  const [isReceiptPreviewOpen, setIsReceiptPreviewOpen] = useState(false)

  const tabs = [
    { id: 'tracking', label: 'Estado del envío' },
    { id: 'receipt', label: 'Boleta Shalom' },
  ]

  useBodyScrollLock(true)

  return createPortal(
    <>
      <div className="fixed inset-0 z-[210] flex items-end justify-center p-0 sm:items-center sm:p-4">
        <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
        <div
          role="dialog"
          aria-labelledby="shalom-tracking-title"
          className="relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-xl"
        >
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h2 id="shalom-tracking-title" className="text-lg font-bold text-gray-900">
                Estado del envío
              </h2>
              <p className="mt-0.5 text-sm text-gray-500">
                Pedido #{orderNumber}
                {guideNumber ? ` · Guía ${guideNumber}` : ''}
                {guideCode ? ` · ${guideCode}` : ''}
                {pickupKey ? ` · Clave ${pickupKey}` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="border-b px-5">
            <div className="flex gap-1" role="tablist" aria-label="Secciones del envío">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={`border-b-2 px-3 py-3 text-sm font-semibold transition ${
                    activeTab === tab.id
                      ? 'border-black text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto px-5 py-6">
            {activeTab === 'tracking' && (
              <>
                {isLoading && (
                  <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Consultando estado en Shalom…
                  </div>
                )}

                {!isLoading && error && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    {error}
                  </div>
                )}

                {!isLoading && !error && (
                  <ol className="m-0 list-none p-0">
                    {timeline.map((step, index) => {
                      const isLast = index === timeline.length - 1

                      return (
                        <li key={step.key} className={`relative flex gap-4 ${isLast ? '' : 'pb-5'}`}>
                          <div className="relative flex w-4 shrink-0 justify-center">
                            {!isLast && (
                              <span
                                className="absolute left-1/2 top-3 bottom-0 w-px -translate-x-1/2 bg-gray-200"
                                aria-hidden="true"
                              />
                            )}
                            <span
                              className={`relative z-10 mt-1 block h-3 w-3 shrink-0 rounded-full ${
                                step.completed
                                  ? 'bg-black'
                                  : 'border-2 border-gray-300 bg-white'
                              }`}
                              aria-hidden="true"
                            />
                          </div>

                          <div className="min-w-0 flex-1 pt-0.5">
                            <p
                              className={`text-sm font-semibold leading-snug ${
                                step.completed ? 'text-gray-900' : 'text-gray-400'
                              }`}
                            >
                              {step.label}
                            </p>
                            {step.date && (
                              <p className="mt-1 text-xs text-gray-500">{formatTrackingDate(step.date)}</p>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                )}
              </>
            )}

            {activeTab === 'receipt' && (
              <>
                {receiptUrl ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Boleta registrada por el equipo de Balenzishop para tu envío Shalom.
                    </p>
                    <ShalomReceiptPreview
                      orderClientId={orderClientId}
                      receiptUrl={receiptUrl}
                      receiptName={receiptName}
                      receiptIsPdf={receiptIsPdf}
                      onPreviewClick={
                        isShalomReceiptPdf({ receiptIsPdf, receiptName, receiptUrl })
                          ? undefined
                          : () => setIsReceiptPreviewOpen(true)
                      }
                    />
                    {!isShalomReceiptPdf({ receiptIsPdf, receiptName, receiptUrl }) ? (
                      <p className="text-xs text-gray-500">
                        Toca la imagen para ampliar y usar los controles de zoom.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <ShalomReceiptEmptyState />
                )}
              </>
            )}
          </div>

          <div className="border-t px-4 py-3 sm:px-5 sm:py-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-full border border-gray-300 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 sm:text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {!isShalomReceiptPdf({ receiptIsPdf, receiptName, receiptUrl }) ? (
        <ImageZoomPreview
          src={receiptUrl}
          alt="Boleta Shalom"
          open={isReceiptPreviewOpen}
          onClose={() => setIsReceiptPreviewOpen(false)}
        />
      ) : null}
    </>,
    document.body,
  )
}
