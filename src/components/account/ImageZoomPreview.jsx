import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Minus, Plus, X } from 'lucide-react'
import useBodyScrollLock from '../../hooks/useBodyScrollLock'

const MIN_SCALE = 1
const MAX_SCALE = 4
const ZOOM_STEP = 0.25

function clampScale(value) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value))
}

function scaleToSlider(scale) {
  return Math.round(clampScale(scale) * 100)
}

function sliderToScale(value) {
  return clampScale(Number(value) / 100)
}

export default function ImageZoomPreview({ src, alt = 'Vista previa', open, onClose }) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [isTouchPanning, setIsTouchPanning] = useState(false)
  const lastPointRef = useRef({ x: 0, y: 0 })
  const isTouchPanningRef = useRef(false)

  const resetView = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
    setIsPanning(false)
    setIsTouchPanning(false)
    isTouchPanningRef.current = false
  }, [])

  const applyScale = useCallback((nextScale) => {
    const clamped = clampScale(nextScale)
    setScale(clamped)
    if (clamped === MIN_SCALE) {
      setPosition({ x: 0, y: 0 })
    }
  }, [])

  useEffect(() => {
    if (open) {
      resetView()
    }
  }, [open, src, resetView])

  useEffect(() => {
    if (!open) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!isPanning) return undefined

    function handleMouseMove(event) {
      const deltaX = event.clientX - lastPointRef.current.x
      const deltaY = event.clientY - lastPointRef.current.y
      lastPointRef.current = { x: event.clientX, y: event.clientY }

      setPosition((current) => ({
        x: current.x + deltaX,
        y: current.y + deltaY,
      }))
    }

    function handleMouseUp(event) {
      if (event.button === 2) {
        setIsPanning(false)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isPanning])

  function handleZoomIn() {
    applyScale(Number((scale + ZOOM_STEP).toFixed(2)))
  }

  function handleZoomOut() {
    applyScale(Number((scale - ZOOM_STEP).toFixed(2)))
  }

  function handleSliderChange(event) {
    applyScale(sliderToScale(event.target.value))
  }

  function handleContextMenu(event) {
    event.preventDefault()
  }

  function handleMouseDown(event) {
    if (event.button !== 2 || scale <= MIN_SCALE) return

    event.preventDefault()
    setIsPanning(true)
    lastPointRef.current = { x: event.clientX, y: event.clientY }
  }

  function handleTouchStart(event) {
    if (event.touches.length !== 1 || scale <= MIN_SCALE) return

    isTouchPanningRef.current = true
    setIsTouchPanning(true)
    lastPointRef.current = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    }
  }

  function handleTouchMove(event) {
    if (!isTouchPanningRef.current || event.touches.length !== 1 || scale <= MIN_SCALE) return

    event.preventDefault()

    const touch = event.touches[0]
    const deltaX = touch.clientX - lastPointRef.current.x
    const deltaY = touch.clientY - lastPointRef.current.y
    lastPointRef.current = { x: touch.clientX, y: touch.clientY }

    setPosition((current) => ({
      x: current.x + deltaX,
      y: current.y + deltaY,
    }))
  }

  function handleTouchEnd() {
    isTouchPanningRef.current = false
    setIsTouchPanning(false)
  }

  useBodyScrollLock(open && Boolean(src))

  if (!open || !src) return null

  return createPortal(
    <div className="fixed inset-0 z-[220] flex flex-col bg-black/90">
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
        <p className="truncate text-sm font-medium">{alt}</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 hover:bg-white/10"
          aria-label="Cerrar vista previa"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex flex-1 flex-col overflow-hidden px-4 pb-4">
        <div
          className={`relative flex flex-1 touch-none items-center justify-center overflow-hidden rounded-xl bg-black/40 ${
            scale > MIN_SCALE ? 'cursor-grab' : ''
          } ${isPanning ? 'cursor-grabbing' : ''}`}
          onContextMenu={handleContextMenu}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          <div
            className="max-h-full max-w-full select-none"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isPanning || isTouchPanning ? 'none' : 'transform 120ms ease-out',
            }}
          >
            <img
              src={src}
              alt={alt}
              className="max-h-[calc(100dvh-12rem)] max-w-full object-contain"
              draggable={false}
            />
          </div>

          <div
            className="absolute bottom-2 left-1/2 z-10 flex max-w-[min(240px,calc(100%-1.5rem))] -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/10 bg-black/55 px-2 py-1 shadow-md backdrop-blur-md"
            onMouseDown={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
            onContextMenu={(event) => event.preventDefault()}
          >
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={scale <= MIN_SCALE}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/90 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Alejar"
            >
              <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>

            <input
              type="range"
              min={scaleToSlider(MIN_SCALE)}
              max={scaleToSlider(MAX_SCALE)}
              step={5}
              value={scaleToSlider(scale)}
              onChange={handleSliderChange}
              className="image-zoom-slider h-1 w-20 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-white/25 accent-white sm:w-24"
              aria-label="Nivel de zoom"
            />

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={scale >= MAX_SCALE}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/90 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Acercar"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>

            <span className="min-w-[2.25rem] text-center text-[10px] font-medium tabular-nums text-white/75">
              {Math.round(scale * 100)}%
            </span>
          </div>
        </div>

        <p className="mt-2 text-center text-[10px] text-white/50">
          <span className="hidden sm:inline">Clic derecho + arrastrar para mover</span>
          <span className="sm:hidden">Desliza para mover</span>
        </p>
      </div>
    </div>,
    document.body,
  )
}
