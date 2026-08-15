import { useCallback, useState } from 'react'
import { getCacheEntry, setCacheEntry } from './moduleCache'
import { useModuleCacheVersion } from './useModuleCacheVersion'

function getErrorMessage(error, fallback) {
  return error?.message || fallback
}

function buildInitialValueState(namespace, stableCacheKey, queryKey, defaultValue) {
  const cachedEntry = stableCacheKey ? getCacheEntry(namespace, stableCacheKey) : null
  if (!cachedEntry) {
    return { key: '', value: defaultValue, error: '' }
  }

  return {
    key: '',
    value: cachedEntry.value ?? defaultValue,
    error: cachedEntry.error ?? '',
  }
}

export function usePersistedValueQuery({
  namespace,
  stableCacheKey,
  queryKey,
  enabled = true,
  defaultValue = null,
  isEmpty = (value) => value == null,
}) {
  useModuleCacheVersion()

  const cachedEntry = stableCacheKey ? getCacheEntry(namespace, stableCacheKey) : null
  const [data, setData] = useState(() =>
    buildInitialValueState(namespace, stableCacheKey, queryKey, defaultValue),
  )

  const hasResolvedData = data.key === queryKey
  const value = hasResolvedData ? data.value : (cachedEntry?.value ?? defaultValue)
  const isFetching = enabled && !hasResolvedData
  const isInitialLoading = isFetching && isEmpty(value)
  const isRefreshing = isFetching && !isEmpty(value)
  const error = hasResolvedData ? data.error : (cachedEntry?.error ?? '')

  const commitValueResult = useCallback(
    (result) => {
      setCacheEntry(namespace, stableCacheKey, {
        value: result.value,
        error: result.error,
      })
      setData(result)
    },
    [namespace, stableCacheKey],
  )

  return {
    value,
    error,
    isFetching,
    isInitialLoading,
    isRefreshing,
    hasResolvedData,
    ready: hasResolvedData || Boolean(cachedEntry) || !isEmpty(value),
    data,
    setData,
    commitValueResult,
    cachedEntry,
  }
}

export function runPersistedValueFetch({
  fetcher,
  queryKey,
  commitValueResult,
  fallbackError,
  defaultValue = null,
}) {
  return fetcher()
    .then((nextValue) => {
      commitValueResult({
        key: queryKey,
        value: nextValue ?? defaultValue,
        error: '',
      })
    })
    .catch((err) => {
      commitValueResult({
        key: queryKey,
        value: defaultValue,
        error: getErrorMessage(err, fallbackError),
      })
    })
}
