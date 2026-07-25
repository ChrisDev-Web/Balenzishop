import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { X } from 'lucide-react'
import {
  SHIPPING_NOTICE_DISPLAY_MS,
  SHIPPING_NOTICE_INTERVAL_MS,
  getShippingNoticeContent,
  getShippingNoticePreviewSequence,
  isShippingNoticePreviewMode,
  markShippingNoticeShown,
  shouldShowShippingNotice,
} from '../../utils/shippingCutoffNotice'

const PREVIEW_GAP_MS = 1000

export default function ShippingCutoffNotice() {
  const [searchParams] = useSearchParams()
  const isPreviewMode = isShippingNoticePreviewMode(searchParams.toString())

  const [visible, setVisible] = useState(false)
  const [content, setContent] = useState(getShippingNoticeContent)
  const [previewLabel, setPreviewLabel] = useState('')
  const [dragX, setDragX] = useState(0)
  const touchStartX = useRef(null)
  const dismissTimerRef = useRef(null)
  const gapTimerRef = useRef(null)
  const visibleRef = useRef(false)
  const previewStepRef = useRef(-1)
  const onPreviewStepCompleteRef = useRef(null)

  const clearDismissTimer = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current)
      dismissTimerRef.current = null
    }
  }, [])

  const clearGapTimer = useCallback(() => {
    if (gapTimerRef.current) {
      clearTimeout(gapTimerRef.current)
      gapTimerRef.current = null
    }
  }, [])

  const hideNotice = useCallback(() => {
    clearDismissTimer()
    visibleRef.current = false
    setVisible(false)
    setDragX(0)
    onPreviewStepCompleteRef.current?.()
    onPreviewStepCompleteRef.current = null
  }, [clearDismissTimer])

  const presentNotice = useCallback(
    (nextContent, { persist = true, previewBadge = '' } = {}) => {
      setContent(nextContent)
      setPreviewLabel(previewBadge)
      visibleRef.current = true
      setVisible(true)
      setDragX(0)
      clearDismissTimer()

      if (persist) {
        markShippingNoticeShown()
      }

      dismissTimerRef.current = window.setTimeout(() => {
        hideNotice()
      }, SHIPPING_NOTICE_DISPLAY_MS)
    },
    [clearDismissTimer, hideNotice],
  )

  const showNotice = useCallback(() => {
    if (visibleRef.current) {
      return
    }

    presentNotice(getShippingNoticeContent())
  }, [presentNotice])

  const dismiss = useCallback(() => {
    hideNotice()
  }, [hideNotice])

  const tryShowNotice = useCallback(() => {
    if (!shouldShowShippingNotice()) {
      return
    }

    showNotice()
  }, [showNotice])

  useEffect(() => {
    if (isPreviewMode) {
      const sequence = getShippingNoticePreviewSequence()

      const showPreviewStep = (stepIndex) => {
        if (stepIndex >= sequence.length) {
          setPreviewLabel('')
          return
        }

        previewStepRef.current = stepIndex
        presentNotice(sequence[stepIndex], {
          persist: false,
          previewBadge: `Vista previa ${stepIndex + 1}/${sequence.length}`,
        })

        onPreviewStepCompleteRef.current = () => {
          gapTimerRef.current = window.setTimeout(() => {
            showPreviewStep(stepIndex + 1)
          }, PREVIEW_GAP_MS)
        }
      }

      showPreviewStep(0)

      return () => {
        clearDismissTimer()
        clearGapTimer()
        previewStepRef.current = -1
        onPreviewStepCompleteRef.current = null
      }
    }

    tryShowNotice()

    const intervalId = window.setInterval(() => {
      tryShowNotice()
    }, SHIPPING_NOTICE_INTERVAL_MS)

    return () => {
      clearDismissTimer()
      clearGapTimer()
      clearInterval(intervalId)
    }
  }, [
    clearDismissTimer,
    clearGapTimer,
    isPreviewMode,
    presentNotice,
    tryShowNotice,
  ])

  function handleTouchStart(event) {
    touchStartX.current = event.touches[0].clientX
    setDragX(0)
  }

  function handleTouchMove(event) {
    if (touchStartX.current === null) return

    const deltaX = event.touches[0].clientX - touchStartX.current
    if (deltaX > 0) {
      setDragX(deltaX)
    }
  }

  function handleTouchEnd() {
    if (dragX > 72) {
      dismiss()
    }

    touchStartX.current = null
    setDragX(0)
  }

  if (!visible) {
    return null
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-3 top-[calc(var(--navbar-height)+0.75rem)] z-[120] flex justify-end sm:inset-x-auto sm:right-4"
      role="status"
      aria-live="polite"
    >
      <div
        className="pointer-events-auto w-full max-w-sm rounded-xl border border-gray-200 bg-white p-4 shadow-lg ring-1 ring-black/5 sm:max-w-md"
        style={
          dragX > 0
            ? { transform: `translateX(${dragX}px)`, opacity: Math.max(0.35, 1 - dragX / 180) }
            : undefined
        }
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            {previewLabel && (
              <p className="mb-2 inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                {previewLabel}
              </p>
            )}
            <p className="text-sm font-semibold text-gray-900">{content.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{content.message}</p>
            <p className="mt-2 text-[11px] text-gray-400 sm:hidden">
              Desliza hacia la derecha para cerrar
            </p>
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Cerrar aviso"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
