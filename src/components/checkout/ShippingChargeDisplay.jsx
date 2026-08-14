import { useEffect, useId, useRef, useState } from 'react'
import {
  formatShippingDisplay,
  getShippingChargeHintMessage,
  isShippingChargeHintApplicable,
} from '../../utils/deliveryFee'

export default function ShippingChargeDisplay({
  deliveryFee = 0,
  deliveryMode,
  className = '',
  hintClassName = '',
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const hintId = useId()
  const label = formatShippingDisplay({ deliveryFee })
  const showHint = isShippingChargeHintApplicable({ deliveryFee })

  useEffect(() => {
    if (!open) return undefined

    function handlePointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  if (!showHint) {
    return <span className={className}>{label}</span>
  }

  return (
    <span
      ref={rootRef}
      className={`inline-flex min-w-0 items-center justify-end gap-1.5 ${className}`.trim()}
    >
      <span className="relative inline-flex shrink-0">
        {open ? (
          <span
            role="tooltip"
            id={hintId}
            className={`absolute right-[calc(100%+0.45rem)] top-1/2 z-20 w-max max-w-[min(14rem,calc(100vw-8rem))] -translate-y-1/2 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-left text-[13px] leading-snug text-gray-700 shadow-lg ${hintClassName}`.trim()}
          >
            {getShippingChargeHintMessage(deliveryMode)}
          </span>
        ) : null}
        <button
          type="button"
          className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-gray-400 text-[11px] font-bold leading-none text-gray-600 transition hover:border-gray-900 hover:text-gray-900"
          aria-label="Información sobre el envío"
          aria-expanded={open}
          aria-controls={hintId}
          onClick={() => setOpen((value) => !value)}
        >
          ?
        </button>
      </span>
      <span className="shrink-0">{label}</span>
    </span>
  )
}
