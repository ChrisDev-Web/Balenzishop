import { useLayoutEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useCartAnimationStore } from '../../stores/cartAnimationStore'

function isCompactViewport() {
  return window.matchMedia('(max-width: 1279px)').matches
}

function FlyItem({ flight, onComplete }) {
  const nodeRef = useRef(null)

  useLayoutEffect(() => {
    const node = nodeRef.current
    if (!node) return undefined

    const compact = isCompactViewport()
    const arcLift = compact ? 12 : 28
    const duration = compact ? 580 : 720
    const { deltaX, deltaY } = flight

    const animation = node.animate(
      [
        {
          transform: 'translate(-50%, -50%) scale(1)',
          opacity: 1,
        },
        {
          transform: `translate(calc(-50% + ${deltaX * 0.72}px), calc(-50% + ${deltaY * 0.72 - arcLift}px)) scale(${compact ? 0.45 : 0.55})`,
          opacity: 0.94,
          offset: 0.55,
        },
        {
          transform: `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(${compact ? 0.12 : 0.18})`,
          opacity: 0,
        },
      ],
      {
        duration,
        easing: 'cubic-bezier(0.22, 0.85, 0.28, 1)',
        fill: 'forwards',
      },
    )

    let completed = false
    const finish = () => {
      if (completed) return
      completed = true
      onComplete(flight.id)
    }

    animation.addEventListener('finish', finish)

    return () => {
      animation.removeEventListener('finish', finish)
      animation.cancel()
    }
  }, [flight, onComplete])

  return (
    <div
      ref={nodeRef}
      className="cart-fly-item"
      style={{
        left: `${flight.from.x}px`,
        top: `${flight.from.y}px`,
      }}
    >
      <img src={flight.image} alt="" className="cart-fly-item__image" draggable={false} />
    </div>
  )
}

export default function CartFlyAnimation() {
  const flights = useCartAnimationStore((state) => state.flights)
  const removeFlight = useCartAnimationStore((state) => state.removeFlight)
  const bumpCart = useCartAnimationStore((state) => state.bumpCart)

  const handleComplete = useCallback(
    (id) => {
      removeFlight(id)
      bumpCart()
    },
    [removeFlight, bumpCart],
  )

  if (flights.length === 0) {
    return null
  }

  return createPortal(
    <div className="cart-fly-layer" aria-hidden="true">
      {flights.map((flight) => (
        <FlyItem key={flight.id} flight={flight} onComplete={handleComplete} />
      ))}
    </div>,
    document.body,
  )
}
