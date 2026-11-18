import { useCallback, useEffect, useMemo, useState } from 'react'
import { listShalonsPublic } from '../../api/clientDirections'
import { applyShalonSelectionToForm, mapShalonOption } from '../../utils/addressMapper'
import SearchableCombobox from '../ui/SearchableCombobox'

export default function CompraRapidaDistrictShalonSelect({
  districtId,
  value,
  selectedLabel,
  onChange,
  disabled = false,
}) {
  const [options, setOptions] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const comboboxOptions = useMemo(
    () => options.map((shalon) => ({
      value: shalon.idShalon,
      label: shalon.label,
      searchText: shalon.searchText,
      raw: shalon,
    })),
    [options],
  )

  const fetchShalons = useCallback(async () => {
    if (!districtId) {
      setOptions([])
      return
    }

    setIsLoading(true)
    try {
      const response = await listShalonsPublic({
        page: 1,
        page_size: 100,
        id_district: districtId,
      })
      setOptions((response.data?.items ?? []).map(mapShalonOption))
    } catch {
      setOptions([])
    } finally {
      setIsLoading(false)
    }
  }, [districtId])

  useEffect(() => {
    fetchShalons()
  }, [fetchShalons])

  return (
    <SearchableCombobox
      value={value}
      selectedLabel={selectedLabel}
      placeholder={districtId ? 'Selecciona sede Shalom…' : 'Primero elige distrito'}
      searchPlaceholder="Buscar en este distrito…"
      options={comboboxOptions}
      isLoading={isLoading}
      disabled={disabled || !districtId || isLoading}
      emptyMessage={districtId ? 'No hay sedes en este distrito.' : 'Elige provincia y distrito.'}
      onChange={(nextId, option) => {
        if (!option?.raw) return
        onChange(applyShalonSelectionToForm(option.raw))
      }}
    />
  )
}