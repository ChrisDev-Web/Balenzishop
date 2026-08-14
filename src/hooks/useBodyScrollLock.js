import { useEffect } from 'react'

let lockCount = 0
let savedScrollY = 0

function lockBodyScroll() {
  if (lockCount === 0) {
    savedScrollY = window.scrollY
    const { body } = document
    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${savedScrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
  }

  lockCount += 1
}

function unlockBodyScroll() {
  if (lockCount <= 0) return

  lockCount -= 1

  if (lockCount !== 0) return

  const { body } = document
  body.style.overflow = ''
  body.style.position = ''
  body.style.top = ''
  body.style.left = ''
  body.style.right = ''
  body.style.width = ''
  window.scrollTo(0, savedScrollY)
}

export default function useBodyScrollLock(isLocked) {
  useEffect(() => {
    if (!isLocked) return undefined

    lockBodyScroll()

    return () => {
      unlockBodyScroll()
    }
  }, [isLocked])
}
