import { useCallback, useState } from 'react'
import { getCacheEntry, setCacheEntry } from './moduleCache'
import { useModuleCacheVersion } from './useModuleCacheVersion'

function getErrorMessage(error, fallback) {
  return error?.message || fallback
}

function buildInitialListState(namespace, stableCacheKey, queryKey) {
  const cachedEntry = stableCacheKey ? getCacheEntry(namespace, stableCacheKey) : null
  if (!cachedEntry) {
    return { key: '', items: [], meta: null, error: '' }
  }

  return {
    key: queryKey,
    items: cachedEntry.items ?? [],
    meta: cachedEntry.meta ?? null,
    error: cachedEntry.error ?? '',
  }
}

export function usePersistedListQuery({
  namespace,
  stableCacheKey,
  queryKey,
  enabled = true,
}) {
  useModuleCacheVersion()

  const cachedEntry = stableCacheKey ? getCacheEntry(namespace, stableCacheKey) : null
  const [data, setData] = useState(() =>
    buildInitialListState(namespace, stableCacheKey, queryKey),
  )

  const hasResolvedData = data.key === queryKey
  const items = hasResolvedData ? data.items : (cachedEntry?.items ?? [])
  const meta = hasResolvedData ? data.meta : (cachedEntry?.meta ?? null)
  const isFetching = enabled && !hasResolvedData
  const isInitialLoading = isFetching && items.length === 0
  const isRefreshing = isFetching && items.length > 0
  const error = hasResolvedData ? data.error : (cachedEntry?.error ?? '')

  const commitListResult = useCallback(
    (result) => {
      setCacheEntry(namespace, stableCacheKey, {
        items: result.items,
        meta: result.meta,
        error: result.error,
      })
      setData(result)
    },
    [namespace, stableCacheKey],
  )

  return {
    items,
    meta,
    error,
    isFetching,
    isInitialLoading,
    isRefreshing,
    hasResolvedData,
    ready: hasResolvedData || Boolean(cachedEntry) || items.length > 0,
    data,
    setData,
    commitListResult,
    cachedEntry,
  }
}

export function runPersistedListFetch({
  fetcher,
  queryKey,
  commitListResult,
  fallbackError,
}) {
  return fetcher()
    .then((response) => {
      commitListResult({
        key: queryKey,
        items: response.items ?? [],
        meta: response.meta ?? null,
        error: '',
      })
    })
    .catch((err) => {
      commitListResult({
        key: queryKey,
        items: [],
        meta: null,
        error: getErrorMessage(err, fallbackError),
      })
    })
}
