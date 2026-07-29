import { useCallback, useState } from 'react'
import { isImageLoaded, markImageLoaded, unmarkImageLoaded } from '../utils/imageLoadCache'

export function useCachedImageReady(src) {
  const cachedHint = Boolean(src && isImageLoaded(src))
  const [loadedSrc, setLoadedSrc] = useState(null)
  const ready = Boolean(src) && loadedSrc === src

  const markReady = useCallback(() => {
    if (!src) return
    markImageLoaded(src)
    setLoadedSrc(src)
  }, [src])

  const markError = useCallback(() => {
    if (!src) return
    unmarkImageLoaded(src)
    setLoadedSrc(null)
  }, [src])

  const handleRef = useCallback(
    (node) => {
      if (node?.complete && node.naturalWidth > 0) {
        markReady()
      }
    },
    [markReady],
  )

  return { ready, cachedHint, markReady, markError, handleRef }
}
