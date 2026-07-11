import { useEffect, useState } from 'react'
import { fetchActiveDocumentTypes } from '../api/documentTypes'

export function useDocumentTypes({ enabled = true } = {}) {
  const [documentTypes, setDocumentTypes] = useState([])
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return undefined
    }

    let cancelled = false
    setLoading(true)

    fetchActiveDocumentTypes()
      .then((items) => {
        if (!cancelled) {
          setDocumentTypes(items)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'No se pudieron cargar los tipos de documento')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [enabled])

  return { documentTypes, loading, error }
}
