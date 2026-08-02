import { useCartAnimationStore } from '../stores/cartAnimationStore'

function isElementVisible(element) {
  const rect = element.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return false

  const style = window.getComputedStyle(element)
  if (style.display === 'none' || style.visibility === 'hidden') return false

  return true
}

function getVisibleCartTargetRect() {
  const targets = document.querySelectorAll('[data-cart-target]')

  for (const target of targets) {
    if (!isElementVisible(target)) continue

    const rect = target.getBoundingClientRect()
    return rect
  }

  return null
}

function isCompactViewport() {
  return window.matchMedia('(max-width: 1279px)').matches
}

function resolveFlySourcePoint(event) {
  const button = event?.currentTarget

  if (button) {
    const buttonRect = button.getBoundingClientRect()

    if (isCompactViewport()) {
      return {
        x: buttonRect.left + buttonRect.width / 2,
        y: buttonRect.top + buttonRect.height / 2,
      }
    }

    const root = button.closest(
      'article, .product-detail__hero, .product-detail__actions, a.group, [data-product-card]',
    )
    const image = root?.querySelector('.product-gallery__image, img:not([aria-hidden="true"])')

    if (image && isElementVisible(image)) {
      const rect = image.getBoundingClientRect()
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      }
    }

    return {
      x: buttonRect.left + buttonRect.width / 2,
      y: buttonRect.top + buttonRect.height / 2,
    }
  }

  return {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  }
}

export function triggerFlyToCartAnimation({ image, event }) {
  const { launchFlight, bumpCart } = useCartAnimationStore.getState()

  if (!image) {
    bumpCart()
    return
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    bumpCart()
    return
  }

  const cartRect = getVisibleCartTargetRect()
  if (!cartRect) {
    bumpCart()
    return
  }

  const from = resolveFlySourcePoint(event)
  const to = {
    x: cartRect.left + cartRect.width / 2,
    y: cartRect.top + cartRect.height / 2,
  }

  launchFlight({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    image,
    from,
    to,
    deltaX: to.x - from.x,
    deltaY: to.y - from.y,
  })
}
