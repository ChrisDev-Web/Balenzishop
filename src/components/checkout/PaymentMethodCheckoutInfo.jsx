import { useState } from 'react'
import { Copy, Download, Eye, X } from 'lucide-react'
import {
  PAYMENT_METHOD_TYPE_POS,
  PAYMENT_METHOD_TYPE_TRANSFER,
  PAYMENT_METHOD_TYPE_WALLET,
  downloadPaymentMethodQr,
  resolvePaymentMethodType,
} from '../../utils/paymentMethods'
import { POS_SURCHARGE_RATE } from '../../utils/paymentSurcharge'

export default function PaymentMethodCheckoutInfo({ method }) {
  const [copied, setCopied] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [downloadError, setDownloadError] = useState('')

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
          Solo disponible para delivery Rainau.
        </p>
      </div>
    )
  }

  if (type === PAYMENT_METHOD_TYPE_TRANSFER && (method.full_name || method.number_count)) {
    return (
      <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 space-y-3">
        {method.full_name && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-700">
              Nombre completo
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900">{method.full_name}</p>
          </div>
        )}
        {method.number_count && (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-700">
              Número de cuenta
            </p>
            <button
              type="button"
              onClick={handleCopyAccountNumber}
              className="mt-2 flex w-full items-center justify-between gap-3 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-left text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
            >
              <span className="break-all">{method.number_count}</span>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-gray-700">
                <Copy className="h-4 w-4" />
                {copied ? 'Copiado' : 'Copiar'}
              </span>
            </button>
          </>
        )}
      </div>
    )
  }

  if (type === PAYMENT_METHOD_TYPE_WALLET && (method.full_name || method.number || method.photo_url)) {
    return (
      <>
        <div className="mt-3 space-y-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
          {method.full_name && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-700">
                Nombre completo
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{method.full_name}</p>
            </div>
          )}

          {method.number && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-700">
                Número
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{method.number}</p>
            </div>
          )}

          {method.photo_url && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownloadQr}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-900 hover:bg-gray-100"
              >
                <Download className="h-4 w-4" />
                Descargar QR
              </button>
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-900 hover:bg-gray-100"
              >
                <Eye className="h-4 w-4" />
                Ver QR
              </button>
            </div>
          )}

          {downloadError && <p className="text-xs text-red-600">{downloadError}</p>}
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
