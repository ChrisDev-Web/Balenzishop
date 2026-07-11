const inflightRequests = new Map()
const completedCache = new Map()

export function buildRequestKey(method, url, params = {}) {
  const sortedEntries = Object.keys(params)
    .sort()
    .map((key) => [key, params[key]])

  return `${method}:${url}:${JSON.stringify(sortedEntries)}`
}

export function dedupeRequest(cacheKey, requestFn, { ttlMs = 3000 } = {}) {
  const inflight = inflightRequests.get(cacheKey)
  if (inflight) return inflight

  const cached = completedCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.promise
  }

  const promise = Promise.resolve()
    .then(requestFn)
    .then((result) => {
      completedCache.set(cacheKey, {
        promise: Promise.resolve(result),
        expiresAt: Date.now() + ttlMs,
      })
      return result
    })
    .finally(() => {
      if (inflightRequests.get(cacheKey) === promise) {
        inflightRequests.delete(cacheKey)
      }
    })

  inflightRequests.set(cacheKey, promise)
  return promise
}
