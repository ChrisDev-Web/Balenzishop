import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, ThumbsDown, ThumbsUp } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useUiStore } from '../../stores/uiStore'
import { AUTH_INTENT, captureAuthReturnTo } from '../../utils/authFlow'
import { buildReviewCardTitle, formatRelativeReviewDate } from '../../utils/reviewFormat'
import {
  createProductReview,
  fetchProductReviewsPublic,
  reactToProductReview,
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

function ReactionButton({ active, count, label, icon: Icon, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? 'border-gray-900 bg-gray-900 text-white'
          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-500'
      }`}
    >
      <Icon size={14} strokeWidth={2} aria-hidden />
      <span>{count}</span>
    </button>
  )
}

function ReviewCard({ review, onEdit, onReact, isReacting }) {
  const title = buildReviewCardTitle(review.comment)
  const relativeDate = formatRelativeReviewDate(review.created_at)

  return (
    <article className="flex h-full flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-bold uppercase leading-snug text-gray-900">{title}</h3>
        <StarRating value={review.rating} size={14} className="shrink-0" />
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-gray-500">
        <span>por {review.display_name}</span>
        {relativeDate && <span>{relativeDate}</span>}
      </div>

      <p className="mt-4 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
        {review.comment}
      </p>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
        <div className="flex items-center gap-2">
          <ReactionButton
            active={review.my_reaction === 'like'}
            count={review.likes_count ?? 0}
            label="Me gusta"
            icon={ThumbsUp}
            onClick={() => onReact(review, 'like')}
            disabled={isReacting}
          />
          <ReactionButton
            active={review.my_reaction === 'dislike'}
            count={review.dislikes_count ?? 0}
            label="No me gusta"
            icon={ThumbsDown}
            onClick={() => onReact(review, 'dislike')}
            disabled={isReacting}
          />
        </div>

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
  const [reactingReviewId, setReactingReviewId] = useState(null)

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

  const handleReact = async (review, reaction) => {
    setReactingReviewId(review.id_product_review)
    setError('')

    try {
      const response = await reactToProductReview(
        review.id_product_review,
        reaction,
        accessToken,
      )
      const updated = response.data
      setItems((current) =>
        current.map((item) =>
          item.id_product_review === updated.id_product_review ? updated : item,
        ),
      )
    } catch (reactError) {
      setError(reactError.message || 'No se pudo registrar tu reacción')
    } finally {
      setReactingReviewId(null)
    }
  }

  return (
    <section ref={sectionRef} className="mt-16 border-t border-gray-200 pt-10">
      <h2 className="text-center text-2xl font-bold text-gray-800">Comentarios</h2>
      <p className="mt-2 text-center text-sm text-gray-500">
        Comparte tu experiencia con este producto
      </p>

      <div className="mx-auto mt-8 max-w-6xl px-4">
        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-gray-50 p-5">
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map((review) => (
                  <ReviewCard
                    key={review.id_product_review}
                    review={review}
                    onEdit={handleEdit}
                    onReact={handleReact}
                    isReacting={reactingReviewId === review.id_product_review}
                  />
                ))}
              </div>

              {meta.last_page > 1 && (
                <div className="mt-6 flex items-center justify-center gap-4">
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
