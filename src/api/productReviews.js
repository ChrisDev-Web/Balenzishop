import { apiGet, apiPost, apiPut } from './client'

export async function fetchProductReviewsPublic(productId, params = {}, token = null) {
  return apiGet(`products/${productId}/reviews/list_public`, params, token)
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
