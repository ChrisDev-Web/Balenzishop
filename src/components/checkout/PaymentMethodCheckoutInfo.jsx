import { useState } from 'react'
import { Copy, Download, Eye, X } from 'lucide-react'
import useBodyScrollLock from '../../hooks/useBodyScrollLock'
import {
  PAYMENT_METHOD_TYPE_POS,
  PAYMENT_METHOD_TYPE_TRANSFER,
  PAYMENT_METHOD_TYPE_WALLET,
  downloadPaymentMethodQr,
  resolvePaymentMethodType,
} from '../../utils/paymentMethods'
import { POS_SURCHARGE_RATE } from '../../utils/paymentSurcharge'

export default function PaymentMethodCheckoutInfo({ method, compact = false }) {
  const [copied, setCopied] = useState(false)
  const [numberCopied, setNumberCopied] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [downloadError, setDownloadError] = useState('')

  useBodyScrollLock(previewOpen)

  if (!method) {
    return null
  }

  const type = resolvePaymentMethodType(method)

  async function handleCopyAccountNumber() {
    if (!method.number_count) return

    try {
      await navigator.clipboard.writeText(method.number_count)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  async function handleCopyWalletNumber() {
    if (!method.number) return

    try {
      await navigator.clipboard.writeText(method.number)
      setNumberCopied(true)
      window.setTimeout(() => setNumberCopied(false), 2000)
    } catch {
      setNumberCopied(false)
    }
  }

  async function handleDownloadQr() {
    const paymentMethodId = method.id ?? method.id_payment_method
    if (!paymentMethodId) return

    setDownloadError('')

    try {
      const safeName = (method.name || 'codigo-qr').replace(/\s+/g, '-').toLowerCase()
      await downloadPaymentMethodQr(paymentMethodId, safeName)
    } catch (error) {
      setDownloadError(error.message || 'No se pudo descargar el QR')
    }
  }

  if (type === PAYMENT_METHOD_TYPE_POS) {
    return (
      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
        <p className="font-semibold">Pago con tarjeta en POS</p>
        <p className="mt-1 leading-relaxed">
          Al usar este método se aplica un recargo del {(POS_SURCHARGE_RATE * 100).toFixed(0)}% sobre el total del pedido.
          Solo disponible para delivery Balenzi.
        </p>
      </div>
    )
  }

  if (type === PAYMENT_METHOD_TYPE_TRANSFER && (method.full_name || method.number_count)) {
    return (
      <div className={`rounded-lg border border-gray-200 bg-gray-50 ${compact ? 'mt-2 space-y-2 px-2.5 py-2' : 'mt-3 space-y-3 px-3 py-3'}`}>
        {method.full_name && (
          <div>
            <p className={`font-semibold uppercase tracking-wide text-gray-700 ${compact ? 'text-[10px]' : 'text-xs'}`}>
              Nombre completo
            </p>
            <p className={`font-semibold text-gray-900 ${compact ? 'mt-0.5 text-xs' : 'mt-1 text-sm'}`}>{method.full_name}</p>
          </div>
        )}
        {method.number_count && (
          <>
            <p className={`font-semibold uppercase tracking-wide text-gray-700 ${compact ? 'text-[10px]' : 'text-xs'}`}>
              Número de cuenta
            </p>
            <button
              type="button"
              onClick={handleCopyAccountNumber}
              className={`flex w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white text-left font-semibold text-gray-900 transition hover:bg-gray-50 ${
                compact ? 'mt-1 px-2 py-1.5 text-xs' : 'mt-2 gap-3 px-3 py-2.5 text-sm'
              }`}
            >
              <span className="break-all">{method.number_count}</span>
              <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold text-gray-700">
                <Copy className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
                {copied ? 'Copiado' : 'Copiar'}
              </span>
            </button>
          </>
        )}
      </div>
    )
  }

  if (type === PAYMENT_METHOD_TYPE_WALLET && (method.full_name || method.number || method.photo_url)) {
    const buttonClass = compact
      ? 'inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-2 text-[11px] font-bold text-gray-900 hover:bg-gray-100 sm:px-4 sm:py-2.5 sm:text-xs'
      : 'inline-flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-xs font-bold text-gray-900 hover:bg-gray-100 sm:px-5 sm:py-3 sm:text-sm'

    const iconClass = compact ? 'h-3.5 w-3.5 sm:h-4 sm:w-4' : 'h-4 w-4 sm:h-5 sm:w-5'

    return (
      <>
        <div className={`rounded-lg border border-gray-200 bg-gray-50 ${compact ? 'mt-2 px-2.5 py-2' : 'mt-3 px-3 py-3 sm:px-4 sm:py-4'}`}>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:gap-5">
            <div className="min-w-0 space-y-2 sm:space-y-3">
              {method.full_name && (
                <div>
                  <p className={`font-semibold uppercase tracking-wide text-gray-700 ${compact ? 'text-[10px]' : 'text-[10px] sm:text-xs'}`}>
                    Nombre completo
                  </p>
                  <p className={`font-semibold text-gray-900 break-words ${compact ? 'mt-0.5 text-xs' : 'mt-0.5 text-xs sm:mt-1 sm:text-sm'}`}>
                    {method.full_name}
                  </p>
                </div>
              )}

              {method.number && (
                <div>
                  <p className={`font-semibold uppercase tracking-wide text-gray-700 ${compact ? 'text-[10px]' : 'text-[10px] sm:text-xs'}`}>
                    Número
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyWalletNumber}
                    title="Copiar número"
                    className={`group mt-0.5 flex w-full items-center gap-2 text-left font-semibold text-gray-900 transition hover:text-black sm:mt-1 ${
                      compact ? 'text-xs' : 'text-xs sm:text-sm'
                    }`}
                  >
                    <span className="break-all">{method.number}</span>
                    <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold text-gray-500 group-hover:text-gray-700">
                      <Copy className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
                      {numberCopied ? 'Copiado' : 'Copiar'}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {method.photo_url && (
              <div className="flex w-[7.25rem] shrink-0 flex-col gap-2 sm:w-40 sm:gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className={buttonClass}
                >
                  <Download className={iconClass} />
                  Descargar QR
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className={buttonClass}
                >
                  <Eye className={iconClass} />
                  Ver QR
                </button>
              </div>
            )}
          </div>

          {downloadError && <p className="mt-2 text-[10px] text-red-600 sm:text-xs">{downloadError}</p>}
        </div>

        {previewOpen && method.photo_url && (
          <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/70"
              onClick={() => setPreviewOpen(false)}
              aria-hidden="true"
            />
            <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-4 shadow-2xl">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-gray-900">Escanea el QR de {method.name}</h3>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
                  aria-label="Cerrar vista previa"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <img
                src={method.photo_url}
                alt={`QR de ${method.name}`}
                className="mx-auto max-h-[70vh] w-full max-w-xs object-contain"
              />
            </div>
          </div>
        )}
      </>
    )
  }

  return null
}
