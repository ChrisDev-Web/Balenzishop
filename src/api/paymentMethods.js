import { apiGet } from './client'
import { dedupeRequest, buildRequestKey } from './requestDedupe'

export async function fetchActivePaymentMethods() {
  const cacheKey = buildRequestKey('GET', 'payment_methods/list_active_public')
  const response = await dedupeRequest(cacheKey, () =>
    apiGet('payment_methods/list_active_public'),
  )

  return (response.data ?? []).map((method) => ({
    id: method.id_payment_method,
    name: method.name,
    description: method.description,
    ...method,
  }))
}
