import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useUiStore } from '../../stores/uiStore'
import { AUTH_INTENT, captureAuthReturnTo } from '../../utils/authFlow'
import { fetchMyProductRating, upsertMyProductRating } from '../../api/productReviews'
import StarRating from './StarRating'

const PENDING_RATING_KEY = 'balenzi-pending-product-rating'

function readPendingRating(productId) {
  try {
    const raw = sessionStorage.getItem(PENDING_RATING_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Number(parsed?.productId) !== Number(productId)) return null
    const rating = Number(parsed?.rating)
    return rating >= 1 && rating <= 5 ? rating : null
  } catch {
    return null
  }
}

function clearPendingRating() {
  sessionStorage.removeItem(PENDING_RATING_KEY)
}

function savePendingRating(productId, rating) {
  sessionStorage.setItem(
    PENDING_RATING_KEY,
    JSON.stringify({ productId: Number(productId), rating: Number(rating) }),
  )
}

export default function ProductStarVote({ productId, onRated }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const accessToken = useAuthStore((s) => s.accessToken)
  const openLoginModal = useUiStore((s) => s.openLoginModal)

  const [rating, setRating] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const applyRating = useCallback(
    async (nextRating, { scrollAfter = false } = {}) => {
      if (!accessToken) return

      setIsSaving(true)
      try {
        await upsertMyProductRating(productId, nextRating, accessToken)
        setRating(nextRating)
        if (scrollAfter && onRated) onRated()
      } finally {
        setIsSaving(false)
      }
    },
    [accessToken, onRated, productId],
  )

  useEffect(() => {
    if (!isAuthenticated || !accessToken || !productId) {
      setRating(0)
      return
    }

    let cancelled = false
    setIsLoading(true)

    fetchMyProductRating(productId, accessToken)
      .then(async (response) => {
        if (cancelled) return

        const currentRating = Number(response.data?.rating) || 0
        const pendingRating = readPendingRating(productId)

        if (pendingRating) {
          clearPendingRating()
          await applyRating(pendingRating, { scrollAfter: true })
          return
        }

        setRating(currentRating)
      })
      .catch(() => {
        if (!cancelled) setRating(0)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [accessToken, applyRating, isAuthenticated, productId])

  const handleChange = async (nextRating) => {
    if (!isAuthenticated) {
      savePendingRating(productId, nextRating)
      openLoginModal(AUTH_INTENT.REVIEW, captureAuthReturnTo())
      return
    }

    await applyRating(nextRating, { scrollAfter: true })
  }

  return (
    <div className="mt-5 flex flex-col items-start gap-2">
      <p className="text-sm font-semibold text-gray-800">Califica este producto</p>
      <StarRating
        value={rating}
        onChange={handleChange}
        size={32}
        className={isLoading || isSaving ? 'pointer-events-none opacity-60' : ''}
      />
    </div>
  )
}
