import { useCallback, useEffect, useState } from 'react'
import { Download, ExternalLink, Loader2 } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { fetchShalomReceiptBlob } from '../../api/clientOrders'
import { inspectShalomReceiptBlob, prefersNativePdfEmbed } from '../../utils/shalomReceipt.js'
import ShalomReceiptMobilePdfCanvas from './ShalomReceiptMobilePdfCanvas.jsx'

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || 'boleta-shalom.pdf'
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function ShalomReceiptPdfViewer({
  orderClientId,
  receiptName = 'boleta-shalom.pdf',
  compact = false,
}) {
  const accessToken = useAuthStore((state) => state.accessToken)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [useNativeEmbed] = useState(() => prefersNativePdfEmbed())

  useEffect(() => {
    if (!orderClientId || !accessToken) {
      setLoading(false)
      setError('No se pudo cargar la boleta.')
      return undefined
    }

    let cancelled = false
    let blobUrlToRevoke = ''

    async function loadReceipt() {
      setLoading(true)
      setError('')
      setPreview(null)

      try {
        const blob = await fetchShalomReceiptBlob(orderClientId, accessToken)
        if (cancelled) return

        const inspected = await inspectShalomReceiptBlob(blob)
        if (cancelled) return

        const nextBlobUrl = URL.createObjectURL(inspected.blob)
        if (cancelled) {
          URL.revokeObjectURL(nextBlobUrl)
          return
        }

        blobUrlToRevoke = nextBlobUrl
        setPreview({
          kind: inspected.kind,
          blobUrl: nextBlobUrl,
          blob: inspected.blob,
        })
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError?.message || 'No se pudo cargar la boleta PDF.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadReceipt()

    return () => {
      cancelled = true
      if (blobUrlToRevoke) {
        URL.revokeObjectURL(blobUrlToRevoke)
      }
    }
  }, [orderClientId, accessToken])

  const handleDownload = useCallback(() => {
    if (!preview?.blob) return
    triggerBlobDownload(preview.blob, receiptName)
  }, [preview, receiptName])

  const viewerHeight = compact ? 'h-52' : 'min-h-[min(58vh,28rem)]'

  if (loading) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 ${compact ? 'h-52' : 'h-64'}`}>
        <span className="inline-flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Cargando boleta…
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
        <p className="text-sm text-gray-600">{error}</p>
      </div>
    )
  }

  if (!preview) return null

  return (
    <div className={`space-y-3${compact ? '' : ' mt-2'}`}>
      <div className={`overflow-hidden rounded-xl border border-gray-200 bg-gray-50 ${viewerHeight}`}>
        {preview.kind === 'image' ? (
          <img
            src={preview.blobUrl}
            alt="Boleta Shalom"
            className="mx-auto h-full max-h-[min(58vh,28rem)] w-full object-contain"
          />
        ) : useNativeEmbed ? (
          <object
            data={preview.blobUrl}
            type="application/pdf"
            className={`block w-full bg-white ${compact ? 'h-52' : 'h-[min(58vh,28rem)]'}`}
          >
            <iframe
              src={preview.blobUrl}
              title="Boleta Shalom"
              className={`block w-full border-0 bg-white ${compact ? 'h-52' : 'h-[min(58vh,28rem)]'}`}
            />
          </object>
        ) : (
          <ShalomReceiptMobilePdfCanvas
            blob={preview.blob}
            blobUrl={preview.blobUrl}
            compact={compact}
          />
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {preview.kind === 'pdf' ? (
          <a
            href={preview.blobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 sm:text-sm"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            Abrir PDF
          </a>
        ) : null}
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 sm:text-sm"
        >
          <Download className="h-4 w-4" aria-hidden />
          Descargar {preview.kind === 'pdf' ? 'PDF' : 'boleta'}
        </button>
      </div>
    </div>
  )
}
