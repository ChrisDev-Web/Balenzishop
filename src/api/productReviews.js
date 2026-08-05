import { apiGet, apiPost, apiPut } from './client'
import { getShopSessionId } from '../utils/shopSession'

export async function fetchProductReviewsPublic(productId, params = {}, token = null) {
  const sessionId = getShopSessionId()
  return apiGet(
    `products/${productId}/reviews/list_public`,
    {
      ...params,
      session_id: sessionId || undefined,
    },
    token,
  )
}

export async function fetchMyProductRating(productId, token) {
  return apiGet(`products/${productId}/reviews/my_rating`, {}, token)
}

export async function upsertMyProductRating(productId, rating, token) {
  return apiPut(`products/${productId}/reviews/my_rating`, { rating }, token)
}

export async function createProductReview(productId, payload, token) {
  return apiPost(`products/${productId}/reviews/create`, payload, token)
}

export async function updateProductReview(reviewId, payload, token) {
  return apiPut(`product_reviews/edit/${reviewId}`, payload, token)
}

export async function reactToProductReview(reviewId, reaction, token = null) {
  const sessionId = getShopSessionId()
  return apiPost(
    `product_reviews/${reviewId}/react`,
    {
      reaction,
      session_id: sessionId,
    },
    token,
  )
}
