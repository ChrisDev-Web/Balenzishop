import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchRainauAvailableDeliveryDates } from '../api/rainauDelivery'
import { getStoreEcho, RAINAU_DELIVERY_AVAILABILITY_CHANNEL, RAINAU_DELIVERY_AVAILABILITY_EVENT } from '../api/realtime/echo'

const DEFAULT_POLL_MS = 5_000
const FAST_POLL_MS = 2_000

export function useRainauAvailableDeliveryDates(
  enabled,
  { pollMs = DEFAULT_POLL_MS, fastPoll = false, deliveryMode = 'delivery' } = {},
) {
  const [dates, setDates] = useState([])
  const [sameDayCutoffPassed, setSameDayCutoffPassed] = useState(false)
  const [revision, setRevision] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const requestIdRef = useRef(0)
  const revisionRef = useRef('')

  const applyPayload = useCallback((payload) => {
    const nextRevision = payload?.revision ?? ''
    if (nextRevision && nextRevision === revisionRef.current) {
      return false
    }

    revisionRef.current = nextRevision
    setRevision(nextRevision)
    setDates(payload?.dates ?? [])
    setSameDayCutoffPassed(Boolean(payload?.same_day_cutoff_passed))
    setError('')
    return true
  }, [])

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!enabled) return

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    if (!silent) {
      setIsLoading(true)
      setError('')
    }

    try {
      const response = await fetchRainauAvailableDeliveryDates({ bustCache: true, deliveryMode })
      if (requestIdRef.current !== requestId) return

      if (!response.success) {
        throw new Error(response.message || 'No se pudieron cargar las fechas de entrega')
      }

      applyPayload(response.data)
    } catch (fetchError) {
      if (requestIdRef.current !== requestId) return
      if (!silent) {
        setError(fetchError.message || 'No se pudieron cargar las fechas de entrega')
      }
    } finally {
      if (requestIdRef.current === requestId && !silent) {
        setIsLoading(false)
      }
    }
  }, [enabled, deliveryMode, applyPayload])

  useEffect(() => {
    if (!enabled) {
      revisionRef.current = ''
      setDates([])
      setRevision('')
      setSameDayCutoffPassed(false)
      setError('')
      setIsLoading(false)
      return undefined
    }

    refresh()

    const intervalMs = fastPoll ? FAST_POLL_MS : pollMs
    const timer = window.setInterval(() => {
      refresh({ silent: true })
    }, intervalMs)

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        refresh({ silent: true })
      }
    }

    window.addEventListener('focus', handleVisibilityChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', handleVisibilityChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, deliveryMode, fastPoll, pollMs, refresh])

  useEffect(() => {
    if (!enabled) return undefined

    const echo = getStoreEcho()
    if (!echo) return undefined

    const channel = echo.channel(RAINAU_DELIVERY_AVAILABILITY_CHANNEL)
    channel.listen(RAINAU_DELIVERY_AVAILABILITY_EVENT, () => {
      refresh({ silent: true })
    })

    return () => {
      channel.stopListening(RAINAU_DELIVERY_AVAILABILITY_EVENT)
      echo.leave(RAINAU_DELIVERY_AVAILABILITY_CHANNEL)
    }
  }, [enabled, refresh])

  return {
    dates,
    sameDayCutoffPassed,
    revision,
    isLoading,
    error,
    refresh,
  }
}
