import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useUiStore } from '../../stores/uiStore'
import { AUTH_INTENT, captureAuthReturnTo } from '../../utils/authFlow'
import {
  createProductReview,
  fetchProductReviewsPublic,
  updateProductReview,
} from '../../api/productReviews'
import StarRating from './StarRating'

const PAGE_SIZE = 3

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

function ReviewAvatar({ review }) {
  if (review.avatar_url) {
    return (
      <img
        src={review.avatar_url}
        alt=""
        className="h-11 w-11 shrink-0 rounded-full border border-gray-200 object-cover"
      />
    )
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
      {getInitials(review.display_name)}
    </div>
  )
}

function ReviewCard({ review, onEdit }) {
  return (
    <article className="min-w-full snap-center rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <ReviewAvatar review={review} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-gray-900">{review.display_name}</h3>
            {review.is_mine && (
              <button
                type="button"
                onClick={() => onEdit(review)}
                className="text-xs font-semibold text-gray-600 underline hover:text-gray-900"
              >
                Editar
              </button>
            )}
          </div>
          <StarRating value={review.rating} size={16} className="mt-1" />
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {review.comment}
          </p>
        </div>
      </div>
    </article>
  )
}

export default function ProductReviews({ productId, sectionRef }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const openLoginModal = useUiStore((s) => s.openLoginModal)

  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState(5)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingReview, setEditingReview] = useState(null)
  const [touchStartX, setTouchStartX] = useState(null)

  const carouselRef = useRef(null)

  const displayName = useMemo(() => {
    const parts = [user?.firstName, user?.lastNamePaternal, user?.lastNameMaternal]
      .map((part) => part?.trim())
      .filter(Boolean)
    return parts.join(' ') || 'Cliente'
  }, [user])

  const loadReviews = useCallback(
    async (targetPage = 1) => {
      if (!productId) return

      setIsLoading(true)
      setError('')

      try {
        const response = await fetchProductReviewsPublic(
          productId,
          { page: targetPage, page_size: PAGE_SIZE },
          accessToken,
        )
        setItems(response.data?.items ?? [])
        setMeta(response.data?.meta ?? { current_page: 1, last_page: 1, total: 0 })
        setPage(targetPage)
      } catch (loadError) {
        setError(loadError.message || 'No se pudieron cargar los comentarios')
      } finally {
        setIsLoading(false)
      }
    },
    [accessToken, productId],
  )

  useEffect(() => {
    loadReviews(1)
  }, [loadReviews])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!isAuthenticated) {
      openLoginModal(AUTH_INTENT.REVIEW, captureAuthReturnTo())
      return
    }

    const trimmed = comment.trim()
    if (trimmed.length < 3) {
      setError('Escribe al menos 3 caracteres en tu comentario.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      if (editingReview) {
        await updateProductReview(
          editingReview.id_product_review,
          { comment: trimmed, rating },
          accessToken,
        )
        setEditingReview(null)
      } else {
        await createProductReview(productId, { comment: trimmed, rating }, accessToken)
      }

      setComment('')
      setRating(5)
      await loadReviews(1)
    } catch (submitError) {
      setError(submitError.message || 'No se pudo guardar el comentario')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (review) => {
    setEditingReview(review)
    setComment(review.comment)
    setRating(review.rating)
    sectionRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const cancelEdit = () => {
    setEditingReview(null)
    setComment('')
    setRating(5)
  }

  const goToPage = (nextPage) => {
    if (nextPage < 1 || nextPage > meta.last_page || nextPage === page) return
    loadReviews(nextPage)
  }

  const handleTouchStart = (event) => {
    setTouchStartX(event.touches[0]?.clientX ?? null)
  }

  const handleTouchEnd = (event) => {
    if (touchStartX === null) return

    const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX
    const delta = touchEndX - touchStartX

    if (Math.abs(delta) >= 50) {
      if (delta < 0) goToPage(page + 1)
      else goToPage(page - 1)
    }

    setTouchStartX(null)
  }

  return (
    <section ref={sectionRef} className="mt-16 border-t border-gray-200 pt-10">
      <h2 className="text-center text-2xl font-bold text-gray-800">Comentarios</h2>
      <p className="mt-2 text-center text-sm text-gray-500">
        Comparte tu experiencia con este producto
      </p>

      <div className="mx-auto mt-8 max-w-3xl">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
              {getInitials(displayName)}
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                <StarRating value={rating} onChange={setRating} size={18} className="mt-1" />
              </div>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={4}
                placeholder="Cuéntanos qué te pareció…"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-fill rounded-full px-6 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting
                    ? 'Guardando…'
                    : editingReview
                      ? 'Actualizar comentario'
                      : 'Publicar comentario'}
                </button>
                {editingReview && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="text-sm font-medium text-gray-600 hover:text-gray-900"
                  >
                    Cancelar edición
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>

        {error && (
          <p className="mt-4 text-center text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="mt-8">
          {isLoading ? (
            <p className="text-center text-sm text-gray-500">Cargando comentarios…</p>
          ) : items.length === 0 ? (
            <p className="text-center text-sm text-gray-500">
              Aún no hay comentarios. Sé el primero en compartir tu opinión.
            </p>
          ) : (
            <>
              <div
                ref={carouselRef}
                className="flex snap-x snap-mandatory overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {items.map((review) => (
                  <ReviewCard key={review.id_product_review} review={review} onEdit={handleEdit} />
                ))}
              </div>

              {meta.last_page > 1 && (
                <div className="mt-4 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1}
                    className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40"
                    aria-label="Comentarios anteriores"
                  >
                    <ChevronLeft size={16} />
                    Anterior
                  </button>
                  <span className="text-sm text-gray-600">
                    {page} / {meta.last_page}
                  </span>
                  <button
                    type="button"
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= meta.last_page}
                    className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40"
                    aria-label="Comentarios siguientes"
                  >
                    Siguiente
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
