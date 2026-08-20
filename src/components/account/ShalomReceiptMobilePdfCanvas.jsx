import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  loadPdfJs,
  openPdfFromBlob,
  renderPdfPages,
} from '../../utils/shalomPdfRender.js'

export default function ShalomReceiptMobilePdfCanvas({
  blob,
  blobUrl = '',
  compact = false,
}) {
  const [hostNode, setHostNode] = useState(null)
  const [rendering, setRendering] = useState(true)
  const [renderError, setRenderError] = useState('')

  const hostRef = useCallback((node) => {
    setHostNode(node)
  }, [])

  useEffect(() => {
    if (!blob || !hostNode) return undefined

    let cancelled = false
    hostNode.replaceChildren()

    async function renderPdf() {
      setRendering(true)
      setRenderError('')

      try {
        const { getDocument } = await loadPdfJs()
        if (cancelled) return

        await new Promise((resolve) => {
          window.requestAnimationFrame(resolve)
        })
        if (cancelled) return

        const pdf = await openPdfFromBlob(getDocument, blob, blobUrl)
        if (cancelled) return

        const containerWidth = hostNode.clientWidth
          || hostNode.parentElement?.clientWidth
          || Math.min(window.innerWidth - 48, 480)

        const renderedPages = await renderPdfPages(pdf, hostNode, containerWidth)
        if (cancelled) return

        if (renderedPages === 0) {
          throw new Error('No se pudo renderizar ninguna página.')
        }
      } catch {
        if (!cancelled) {
          setRenderError('No se pudo generar la vista previa en este dispositivo.')
        }
      } finally {
        if (!cancelled) {
          setRendering(false)
        }
      }
    }

    renderPdf()

    return () => {
      cancelled = true
      hostNode.replaceChildren()
    }
  }, [blob, blobUrl, hostNode])

  const viewerHeight = compact ? 'max-h-52' : 'max-h-[min(58vh,28rem)]'

  return (
    <div className={`relative overflow-y-auto p-2 ${viewerHeight}`}>
      {rendering ? (
        <div className={`flex items-center justify-center ${compact ? 'h-48' : 'h-64'}`}>
          <span className="inline-flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Preparando vista previa…
          </span>
        </div>
      ) : null}
      {renderError ? (
        <p className="px-2 py-6 text-center text-sm text-gray-600">{renderError}</p>
      ) : null}
      <div ref={hostRef} className="space-y-3" />
    </div>
  )
}
