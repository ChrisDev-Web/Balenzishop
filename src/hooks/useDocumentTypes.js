import { useEffect, useState } from 'react'
import { fetchActiveDocumentTypes } from '../api/documentTypes'

export function useDocumentTypes() {
  const [documentTypes, setDocumentTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

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
  }, [])

  return { documentTypes, loading, error }
}
