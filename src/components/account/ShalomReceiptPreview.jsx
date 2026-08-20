import { Download, FileText } from 'lucide-react'
import { isShalomReceiptPdf } from '../../utils/shalomReceipt.js'
import ShalomReceiptPdfViewer from './ShalomReceiptPdfViewer.jsx'

export default function ShalomReceiptPreview({
  orderClientId = null,
  receiptUrl,
  receiptName = '',
  receiptIsPdf = false,
  compact = false,
  onPreviewClick,
}) {
  if (!receiptUrl) return null

  const isPdf = isShalomReceiptPdf({ receiptIsPdf, receiptName, receiptUrl })

  if (isPdf && orderClientId) {
    return (
      <ShalomReceiptPdfViewer
        orderClientId={orderClientId}
        receiptName={receiptName || 'boleta-shalom.pdf'}
        compact={compact}
      />
    )
  }

  if (onPreviewClick) {
    return (
      <button
        type="button"
        onClick={onPreviewClick}
        className="group relative mt-2 block w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-3 text-left transition hover:border-gray-300 hover:bg-gray-100"
      >
        <img
          src={receiptUrl}
          alt="Boleta Shalom"
          className="mx-auto max-h-72 w-full object-contain transition group-hover:scale-[1.01]"
        />
      </button>
    )
  }

  return (
    <a
      href={receiptUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-block"
    >
      <img
        src={receiptUrl}
        alt="Boleta Shalom"
        className={`rounded-lg border border-gray-200 object-contain ${
          compact ? 'max-h-48' : 'max-h-72'
        }`}
      />
    </a>
  )
}

export function ShalomReceiptEmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
      <FileText className="mx-auto h-8 w-8 text-gray-400" aria-hidden />
      <p className="mt-2 text-sm font-medium text-gray-700">Aún no hay boleta disponible</p>
      <p className="mt-1 text-xs text-gray-500">
        Cuando el equipo suba la boleta de Shalom, aparecerá aquí.
      </p>
    </div>
  )
}
