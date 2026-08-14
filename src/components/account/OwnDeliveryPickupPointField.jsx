import { useState } from 'react'
import { Copy, ExternalLink } from 'lucide-react'
import { OWN_DELIVERY_PICKUP_POINT_URL } from '../../utils/deliveryTypes'

const readonlyClass =
  'w-full min-w-0 cursor-pointer truncate rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700'

const actionBtnClass =
  'inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:border-black hover:bg-gray-50 hover:text-black sm:w-auto sm:shrink-0'

export default function OwnDeliveryPickupPointField() {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(OWN_DELIVERY_PICKUP_POINT_URL)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="min-w-0 sm:col-span-2">
      <label className="block text-sm text-gray-600">Punto de Entrega</label>
      <div className="mt-1 flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch">
        <input
          type="text"
          readOnly
          value={OWN_DELIVERY_PICKUP_POINT_URL}
          onClick={handleCopy}
          className={`${readonlyClass} sm:flex-1`}
          aria-readonly="true"
          title="Haz clic para copiar el enlace"
        />
        <button type="button" onClick={handleCopy} className={actionBtnClass}>
          <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {copied ? 'Copiado' : 'Copiar'}
        </button>
        <a
          href={OWN_DELIVERY_PICKUP_POINT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={actionBtnClass}
        >
          <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>Google Maps</span>
        </a>
      </div>
      <p className="mt-1 text-xs text-gray-500">
        Envía tu courier a este punto de recojo. Haz clic en el enlace para copiarlo.
      </p>
    </div>
  )
}
