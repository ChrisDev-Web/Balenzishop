import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { listShalonsPublic } from '../../api/clientDirections'
import { mapShalonOption } from '../../utils/addressMapper'
import SearchableCombobox from '../ui/SearchableCombobox'

const DEBOUNCE_MS = 300
const PAGE_SIZE = 50

export default function ShalonSearchCombobox({ value, selectedLabel, onChange, disabled }) {
  const [options, setOptions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const debounceRef = useRef(null)
  const requestIdRef = useRef(0)

  const comboboxOptions = useMemo(
    () => options.map((shalon) => ({
      value: shalon.idShalon,
      label: shalon.label,
      searchText: shalon.searchText,
      raw: shalon,
    })),
    [options],
  )

  const fetchShalons = useCallback(async (search) => {
    const requestId = ++requestIdRef.current
    setIsLoading(true)

    try {
      const response = await listShalonsPublic({
        page: 1,
        page_size: PAGE_SIZE,
        search: search || undefined,
      })

      if (requestId !== requestIdRef.current) return

      setOptions((response.data?.items ?? []).map(mapShalonOption))
    } catch {
      if (requestId !== requestIdRef.current) return
      setOptions([])
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchShalons('')

    return () => {
      requestIdRef.current += 1
    }
  }, [fetchShalons])

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  const handleQueryChange = useCallback((query) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      fetchShalons(query.trim())
    }, DEBOUNCE_MS)
  }, [fetchShalons])

  return (
    <SearchableCombobox
      value={value}
      selectedLabel={selectedLabel}
      placeholder="Busca sede Shalon por nombre o dirección…"
      searchPlaceholder="Ej. PRO, Los Olivos, Miraflores…"
      options={comboboxOptions}
      isLoading={isLoading}
      disabled={disabled}
      filterLocally={false}
      searchMode="contains"
      emptyMessage="No hay sedes Shalon que coincidan."
      onQueryChange={handleQueryChange}
      onChange={onChange}
    />
  )
}
