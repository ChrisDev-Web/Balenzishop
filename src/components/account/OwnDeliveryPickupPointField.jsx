import { useState } from 'react'
import { Copy, ExternalLink } from 'lucide-react'
import { OWN_DELIVERY_PICKUP_POINT_URL } from '../../utils/deliveryTypes'

const readonlyClass =
  'mt-1 w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700'

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
    <div className="sm:col-span-2">
      <label className="block text-sm text-gray-600">Punto de Entrega</label>
      <div className="mt-1 flex items-stretch gap-2">
        <input
          type="text"
          readOnly
          value={OWN_DELIVERY_PICKUP_POINT_URL}
          onClick={handleCopy}
          className={readonlyClass}
          aria-readonly="true"
          title="Haz clic para copiar el enlace"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:border-black hover:bg-gray-50 hover:text-black"
        >
          <Copy className="h-3.5 w-3.5" aria-hidden />
          {copied ? 'Copiado' : 'Copiar'}
        </button>
        <a
          href={OWN_DELIVERY_PICKUP_POINT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:border-black hover:bg-gray-50 hover:text-black"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          <span className="hidden sm:inline">Google Maps</span>
        </a>
      </div>
      <p className="mt-1 text-xs text-gray-500">
        Envía tu courier a este punto de recojo. Haz clic en el enlace para copiarlo.
      </p>
    </div>
  )
}
