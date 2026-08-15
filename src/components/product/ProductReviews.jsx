import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Star, ThumbsDown, ThumbsUp } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useUiStore } from '../../stores/uiStore'
import { AUTH_INTENT, captureAuthReturnTo } from '../../utils/authFlow'
import { formatRelativeReviewDate } from '../../utils/reviewFormat'
import {
  createProductReview,
  fetchProductReviewsPublic,
  reactToProductReview,
  updateProductReview,
} from '../../api/productReviews'
import StarRating from './StarRating'
import './product-reviews.css'

const PAGE_SIZE = 6

const SORT_OPTIONS = [
  { value: 'best', label: 'Mejores evaluaciones' },
  { value: 'newest', label: 'Más recientes' },
  { value: 'rating_high', label: 'Mayor calificación' },
  { value: 'rating_low', label: 'Menor calificación' },
]

const EMPTY_SUMMARY = {
  average_rating: null,
  total_reviews: 0,
  rating_distribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
}

function ReactionButton({ active, count, label, icon: Icon, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      className={`product-reviews__reaction${active ? ' product-reviews__reaction--active' : ''}`}
    >
      <Icon size={14} strokeWidth={2} aria-hidden />
      <span>{count}</span>
    </button>
  )
}

function RatingDistribution({ distribution, total }) {
  return (
    <div className="product-reviews__distribution">
      {[5, 4, 3, 2, 1].map((stars) => {
        const count = distribution[String(stars)] ?? 0
        const width = total > 0 ? `${(count / total) * 100}%` : '0%'

        return (
          <div key={stars} className="product-reviews__distribution-row">
            <span>{stars}</span>
            <Star size={14} className="text-amber-400" fill="currentColor" strokeWidth={1.5} aria-hidden />
            <div className="product-reviews__distribution-bar">
              <div className="product-reviews__distribution-fill" style={{ width }} />
            </div>
            <span className="product-reviews__distribution-count">{count}</span>
          </div>
        )
      })}
    </div>
  )
}

function ReviewCard({ review, onEdit, onReact, isReacting }) {
  const relativeDate = formatRelativeReviewDate(review.created_at)

  return (
    <article className="product-reviews__card">
      <div className="product-reviews__card-header">
        <span className="product-reviews__card-author">{review.display_name}</span>
        <div className="product-reviews__card-meta">
          <StarRating value={review.rating} size={14} />
          {relativeDate && <span className="product-reviews__card-date">{relativeDate}</span>}
        </div>
      </div>

      <p className="product-reviews__card-body">{review.comment}</p>

      <div className="product-reviews__card-footer">
        <div className="product-reviews__reactions">
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
          <button type="button" className="product-reviews__edit-link" onClick={() => onEdit(review)}>
            Editar
          </button>
        )}
      </div>
    </article>
  )
}

function ComposeCard({
  displayName,
  comment,
  rating,
  isSubmitting,
  isEditing,
  onCommentChange,
  onRatingChange,
  onSubmit,
  onCancel,
}) {
  return (
    <article className="product-reviews__card product-reviews__card--compose">
      <div className="product-reviews__card-header">
        <span className="product-reviews__card-author">{displayName}</span>
        <div className="product-reviews__card-meta">
          <StarRating value={rating} onChange={onRatingChange} size={18} />
        </div>
      </div>

      <textarea
        value={comment}
        onChange={(event) => onCommentChange(event.target.value)}
        rows={4}
        placeholder="Cuéntanos qué te pareció…"
        className="product-reviews__card-textarea"
      />

      <div className="product-reviews__card-footer">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="btn-fill rounded-full px-6 py-2.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Guardando…' : isEditing ? 'Actualizar comentario' : 'Publicar comentario'}
        </button>

        {isEditing && (
          <button type="button" className="product-reviews__edit-link" onClick={onCancel}>
            Cancelar
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
  const [summary, setSummary] = useState(EMPTY_SUMMARY)
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState('best')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState(5)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingReview, setEditingReview] = useState(null)
  const [reactingReviewId, setReactingReviewId] = useState(null)
  const [showCompose, setShowCompose] = useState(false)
  const [reviewsVisible, setReviewsVisible] = useState(true)

  const displayName = useMemo(() => {
    const parts = [user?.firstName, user?.lastNamePaternal, user?.lastNameMaternal]
      .map((part) => part?.trim())
      .filter(Boolean)
    return parts.join(' ') || 'Cliente'
  }, [user])

  const loadReviews = useCallback(
    async (targetPage = 1, targetSort = sort) => {
      if (!productId) return

      setIsLoading(true)
      setError('')

      try {
        const response = await fetchProductReviewsPublic(
          productId,
          { page: targetPage, page_size: PAGE_SIZE, sort: targetSort },
          accessToken,
        )
        setItems(response.data?.items ?? [])
        setMeta(response.data?.meta ?? { current_page: 1, last_page: 1, total: 0 })
        setSummary(response.data?.summary ?? EMPTY_SUMMARY)
        setPage(targetPage)
      } catch (loadError) {
        setError(loadError.message || 'No se pudieron cargar los comentarios')
      } finally {
        setIsLoading(false)
      }
    },
    [accessToken, productId, sort],
  )

  useEffect(() => {
    loadReviews(1, sort)
  }, [loadReviews, sort])

  const handleWriteReview = () => {
    if (!isAuthenticated) {
      openLoginModal(AUTH_INTENT.REVIEW, captureAuthReturnTo())
      return
    }

    setEditingReview(null)
    setComment('')
    setRating(5)
    setShowCompose(true)
    setReviewsVisible(true)
  }

  const handleSubmit = async () => {
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
      setShowCompose(false)
      await loadReviews(1, sort)
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
    setShowCompose(true)
    setReviewsVisible(true)
    sectionRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const cancelEdit = () => {
    setEditingReview(null)
    setComment('')
    setRating(5)
    setShowCompose(false)
  }

  const goToPage = (nextPage) => {
    if (nextPage < 1 || nextPage > meta.last_page || nextPage === page) return
    loadReviews(nextPage, sort)
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

  const averageLabel =
    summary.average_rating !== null ? summary.average_rating.toFixed(1) : '—'

  const pageNumbers = useMemo(() => {
    const pages = []
    for (let index = 1; index <= meta.last_page; index += 1) {
      pages.push(index)
    }
    return pages
  }, [meta.last_page])

  return (
    <section ref={sectionRef} className="product-reviews min-w-0 max-w-full">
      <h2 className="product-reviews__title">Opiniones de este producto</h2>

      <div className="product-reviews__summary">
        <div className="product-reviews__score">
          <div>
            <span className="product-reviews__average">{averageLabel}</span>
            {summary.average_rating !== null && (
              <span className="product-reviews__average-suffix"> / 5</span>
            )}
          </div>
          {summary.average_rating !== null && (
            <StarRating value={Math.round(summary.average_rating)} size={18} />
          )}
          <p className="product-reviews__count">
            {summary.total_reviews}{' '}
            {summary.total_reviews === 1 ? 'comentario' : 'comentarios'}
          </p>
        </div>

        <RatingDistribution
          distribution={summary.rating_distribution}
          total={summary.total_reviews}
        />
      </div>

      <div className="product-reviews__toolbar">
        <div className="product-reviews__toolbar-actions">
          <button
            type="button"
            onClick={handleWriteReview}
            className="btn-fill rounded-full px-8 py-3 text-xs sm:text-sm"
          >
            Escribir una reseña
          </button>

          {summary.total_reviews > 0 && (
            <button
              type="button"
              className="product-reviews__toggle"
              onClick={() => setReviewsVisible((visible) => !visible)}
            >
              {reviewsVisible ? 'Ocultar todas las opiniones' : 'Mostrar todas las opiniones'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="product-reviews__error" role="alert">
          {error}
        </p>
      )}

      {reviewsVisible && (
        <>
          {summary.total_reviews > 0 && (
            <div className="product-reviews__sort">
              <label htmlFor="product-reviews-sort">Ordenar por:</label>
              <select
                id="product-reviews-sort"
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value)
                  setPage(1)
                }}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isLoading ? (
            <p className="product-reviews__loading">Cargando comentarios…</p>
          ) : (
            <>
              <div className="product-reviews__grid">
                {showCompose && (
                  <ComposeCard
                    displayName={displayName}
                    comment={comment}
                    rating={rating}
                    isSubmitting={isSubmitting}
                    isEditing={Boolean(editingReview)}
                    onCommentChange={setComment}
                    onRatingChange={setRating}
                    onSubmit={handleSubmit}
                    onCancel={cancelEdit}
                  />
                )}

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

              {!showCompose && items.length === 0 && (
                <p className="product-reviews__empty">
                  Aún no hay comentarios. Sé el primero en compartir tu opinión.
                </p>
              )}

              {meta.last_page > 1 && (
                <div className="product-reviews__pagination">
                  <button
                    type="button"
                    className="product-reviews__page-btn"
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {pageNumbers.map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      className={`product-reviews__page-btn${
                        pageNumber === page ? ' product-reviews__page-btn--active' : ''
                      }`}
                      onClick={() => goToPage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="product-reviews__page-btn"
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= meta.last_page}
                    aria-label="Página siguiente"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  )
}
