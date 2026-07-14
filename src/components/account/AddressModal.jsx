import { useState, useMemo, useEffect } from 'react'
import { X, MapPin, Star, Pencil } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { LIMA_CITY } from '../../data/shalonLocations'
import {
  listDistrictsPublic,
  listProvincesPublic,
  listRegionsPublic,
  listShalonsPublic,
} from '../../api/clientDirections'
import {
  mapDistrictOption,
  mapProvinceOption,
  mapRegionOption,
  mapShalonOption,
} from '../../utils/addressMapper'
import { resolveLimaProvinceIds } from '../../utils/addressFormHelpers'
import SearchableCombobox from '../ui/SearchableCombobox'

const readonlyClass =
  'mt-1 w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700'

function buildFormFromAddress(address) {
  return {
    idRegion: address.idRegion ? String(address.idRegion) : '',
    region: address.region || '',
    city: address.city || '',
    idProvince: address.idProvince ? String(address.idProvince) : '',
    idDistrict: address.idDistrict ? String(address.idDistrict) : '',
    idShalon: address.idShalon ? String(address.idShalon) : '',
    district: address.district || '',
    shalon: address.shalon || '',
    isPrimary: address.isPrimary || false,
  }
}

export default function AddressModal({ address, initialMode = 'view', onClose }) {
  const { updateAddress } = useAuthStore()
  const [editing, setEditing] = useState(initialMode === 'edit')
  const [form, setForm] = useState(buildFormFromAddress(address))
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [regionOptions, setRegionOptions] = useState([])
  const [provinceOptions, setProvinceOptions] = useState([])
  const [districtOptions, setDistrictOptions] = useState([])
  const [shalonOptions, setShalonOptions] = useState([])
  const [isLoadingRegions, setIsLoadingRegions] = useState(false)
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false)
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false)
  const [isLoadingShalons, setIsLoadingShalons] = useState(false)
  const [limaProvinceIds, setLimaProvinceIds] = useState([])
  const [isResolvingLimaProvinces, setIsResolvingLimaProvinces] = useState(false)

  const deliveryScope = address.deliveryScope || null
  const isLimaScope = deliveryScope === 'lima'
  const isProvinciaScope = deliveryScope === 'provincia'

  const regions = useMemo(
    () => [...regionOptions].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [regionOptions],
  )

  const provinces = useMemo(
    () => [...provinceOptions].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [provinceOptions],
  )

  const districts = useMemo(
    () => [...districtOptions].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [districtOptions],
  )

  const regionComboboxOptions = useMemo(
    () => regions.map((region) => ({
      value: region.idRegion,
      label: region.label,
      searchText: region.name,
      raw: region,
    })),
    [regions],
  )

  const provinceComboboxOptions = useMemo(
    () => provinces.map((province) => ({
      value: province.idProvince,
      label: province.label,
      searchText: province.name,
      raw: province,
    })),
    [provinces],
  )

  const districtComboboxOptions = useMemo(
    () => districts.map((district) => ({
      value: district.idDistrict,
      label: district.name,
      searchText: district.name,
      raw: district,
    })),
    [districts],
  )

  const shalonComboboxOptions = useMemo(
    () => shalonOptions.map((shalon) => ({
      value: shalon.idShalon,
      label: shalon.label,
      searchText: shalon.label,
      raw: shalon,
    })),
    [shalonOptions],
  )

  useEffect(() => {
    setEditing(initialMode === 'edit')
    setForm(buildFormFromAddress(address))
    setError('')
  }, [address, initialMode])

  useEffect(() => {
    if (!editing || !isProvinciaScope) {
      setRegionOptions([])
      return undefined
    }

    let ignore = false
    setIsLoadingRegions(true)

    listRegionsPublic({ page: 1, page_size: 100 })
      .then((response) => {
        if (ignore) return
        setRegionOptions((response.data?.items ?? []).map(mapRegionOption))
      })
      .catch(() => {
        if (!ignore) setRegionOptions([])
      })
      .finally(() => {
        if (!ignore) setIsLoadingRegions(false)
      })

    return () => {
      ignore = true
    }
  }, [editing, isProvinciaScope])

  useEffect(() => {
    if (!editing || !isProvinciaScope || !form.idRegion) {
      setProvinceOptions([])
      return undefined
    }

    let ignore = false
    setIsLoadingProvinces(true)

    listProvincesPublic({ page: 1, page_size: 100, id_region: form.idRegion })
      .then((response) => {
        if (ignore) return
        setProvinceOptions((response.data?.items ?? []).map(mapProvinceOption))
      })
      .catch(() => {
        if (!ignore) setProvinceOptions([])
      })
      .finally(() => {
        if (!ignore) setIsLoadingProvinces(false)
      })

    return () => {
      ignore = true
    }
  }, [editing, isProvinciaScope, form.idRegion])

  useEffect(() => {
    if (!editing || !isLimaScope) {
      setLimaProvinceIds([])
      return undefined
    }

    let ignore = false
    setIsResolvingLimaProvinces(true)

    resolveLimaProvinceIds()
      .then((ids) => {
        if (!ignore) setLimaProvinceIds(Array.isArray(ids) ? ids : [])
      })
      .catch(() => {
        if (!ignore) setLimaProvinceIds([])
      })
      .finally(() => {
        if (!ignore) setIsResolvingLimaProvinces(false)
      })

    return () => {
      ignore = true
    }
  }, [editing, isLimaScope])

  useEffect(() => {
    if (!editing) {
      setDistrictOptions([])
      return undefined
    }

    const canLoadDistricts = isProvinciaScope
      ? Boolean(form.idProvince)
      : isLimaScope && limaProvinceIds.length > 0

    if (!canLoadDistricts) {
      setDistrictOptions([])
      return undefined
    }

    let ignore = false
    setIsLoadingDistricts(true)

    const request = isProvinciaScope
      ? listDistrictsPublic({ page: 1, page_size: 100, id_province: form.idProvince })
      : listDistrictsPublic({ page: 1, page_size: 100, id_provinces: limaProvinceIds })

    request
      .then((response) => {
        if (ignore) return
        setDistrictOptions((response.data?.items ?? []).map(mapDistrictOption))
      })
      .catch(() => {
        if (!ignore) setDistrictOptions([])
      })
      .finally(() => {
        if (!ignore) setIsLoadingDistricts(false)
      })

    return () => {
      ignore = true
    }
  }, [editing, isProvinciaScope, isLimaScope, form.idProvince, limaProvinceIds])

  useEffect(() => {
    if (!editing || !form.idDistrict) {
      setShalonOptions([])
      return undefined
    }

    let ignore = false
    setIsLoadingShalons(true)

    listShalonsPublic({ page: 1, page_size: 100, id_district: form.idDistrict })
      .then((response) => {
        if (ignore) return
        setShalonOptions((response.data?.items ?? []).map(mapShalonOption))
      })
      .catch(() => {
        if (!ignore) setShalonOptions([])
      })
      .finally(() => {
        if (!ignore) setIsLoadingShalons(false)
      })

    return () => {
      ignore = true
    }
  }, [editing, form.idDistrict])

  const handleRegionSelect = (value, option) => {
    const selected = option?.raw
      ?? regions.find((item) => String(item.idRegion) === String(value))

    setForm((prev) => ({
      ...prev,
      idRegion: selected ? String(selected.idRegion) : '',
      region: selected?.name || '',
      city: '',
      idProvince: '',
      idDistrict: '',
      district: '',
      idShalon: '',
      shalon: '',
    }))
  }

  const handleProvinceSelect = (value, option) => {
    const selected = option?.raw
      ?? provinces.find((item) => String(item.idProvince) === String(value))

    setForm((prev) => ({
      ...prev,
      idProvince: selected ? String(selected.idProvince) : '',
      city: selected?.name || '',
      idDistrict: '',
      district: '',
      idShalon: '',
      shalon: '',
    }))
  }

  const handleDistrictSelect = (value, option) => {
    const selected = option?.raw
      ?? districts.find((item) => String(item.idDistrict) === String(value))

    setForm((prev) => ({
      ...prev,
      idProvince: selected ? String(selected.idProvince) : prev.idProvince,
      idDistrict: selected ? String(selected.idDistrict) : '',
      district: selected?.name || '',
      idShalon: '',
      shalon: '',
    }))
  }

  const handleShalonSelect = (value, option) => {
    const selected = option?.raw
      ?? shalonOptions.find((item) => String(item.idShalon) === String(value))

    setForm((prev) => ({
      ...prev,
      idShalon: selected ? String(selected.idShalon) : '',
      shalon: selected?.label || '',
    }))
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')

    if (isProvinciaScope && !form.idRegion) {
      setError('Selecciona una región')
      return
    }

    if (!form.idProvince || !form.idDistrict || !form.idShalon) {
      setError('Completa ciudad, distrito y punto de recojo')
      return
    }

    setIsSaving(true)
    const result = await updateAddress(address.id, {
      idProvince: form.idProvince,
      idDistrict: form.idDistrict,
      idShalon: form.idShalon,
      isPrimary: form.isPrimary,
      deliveryScope: address.deliveryScope,
    })
    setIsSaving(false)

    if (!result.success) {
      setError(result.error || 'No se pudo actualizar la dirección')
      return
    }

    onClose()
  }

  const handleCancelEdit = () => {
    setForm(buildFormFromAddress(address))
    setError('')
    setEditing(false)
  }

  const districtsDisabled = isProvinciaScope
    ? !form.idProvince || isLoadingDistricts
    : isResolvingLimaProvinces || limaProvinceIds.length === 0 || isLoadingDistricts

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-labelledby="address-modal-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 id="address-modal-title" className="text-lg font-bold text-gray-900">
            {editing ? 'Editar dirección' : 'Detalle de dirección'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {!editing ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-4">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gray-700" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-900">
                      {address.district}, {address.city}
                    </p>
                    {address.isPrimary && (
                      <span className="flex items-center gap-1 rounded-full bg-black px-2 py-0.5 text-xs font-medium text-white">
                        <Star className="h-3 w-3" /> Principal
                      </span>
                    )}
                  </div>
                  {address.region && isProvinciaScope && (
                    <p className="mt-1 text-xs text-gray-500">{address.region}</p>
                  )}
                </div>
              </div>

              <dl className="space-y-3 text-sm">
                {isProvinciaScope && (
                  <div>
                    <dt className="font-medium text-gray-500">Región</dt>
                    <dd className="mt-0.5 text-gray-900">{address.region || '—'}</dd>
                  </div>
                )}
                <div>
                  <dt className="font-medium text-gray-500">Ciudad</dt>
                  <dd className="mt-0.5 text-gray-900">{address.city}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Distrito</dt>
                  <dd className="mt-0.5 text-gray-900">{address.district}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Punto de recojo Shalon</dt>
                  <dd className="mt-0.5 text-gray-900">{address.shalon || '—'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Tipo</dt>
                  <dd className="mt-0.5 text-gray-900">
                    {address.isPrimary ? 'Dirección principal' : 'Dirección secundaria'}
                  </dd>
                </div>
              </dl>
            </div>
          ) : (
            <form id="address-edit-form" onSubmit={handleSave} className="space-y-4">
              {isProvinciaScope && (
                <div>
                  <label className="block text-sm text-gray-600">Región *</label>
                  <SearchableCombobox
                    value={form.idRegion}
                    selectedLabel={form.region}
                    placeholder="Selecciona una región"
                    searchPlaceholder="Escribe para buscar región…"
                    options={regionComboboxOptions}
                    isLoading={isLoadingRegions}
                    emptyMessage="No hay regiones disponibles."
                    onChange={handleRegionSelect}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-600">Ciudad *</label>
                {isLimaScope ? (
                  <input
                    type="text"
                    value={LIMA_CITY}
                    readOnly
                    className={readonlyClass}
                    aria-readonly="true"
                  />
                ) : (
                  <SearchableCombobox
                    value={form.idProvince}
                    selectedLabel={form.city}
                    placeholder="Selecciona una provincia"
                    searchPlaceholder="Escribe para buscar provincia…"
                    options={provinceComboboxOptions}
                    isLoading={isLoadingProvinces}
                    disabled={!form.idRegion}
                    emptyMessage={
                      form.idRegion
                        ? 'No hay provincias en esta región.'
                        : 'Primero elige una región.'
                    }
                    onChange={handleProvinceSelect}
                  />
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-600">Distrito *</label>
                <SearchableCombobox
                  value={form.idDistrict}
                  selectedLabel={form.district}
                  placeholder="Selecciona un distrito"
                  searchPlaceholder="Escribe para buscar distrito…"
                  options={districtComboboxOptions}
                  isLoading={isLoadingDistricts || isResolvingLimaProvinces}
                  disabled={districtsDisabled}
                  emptyMessage={
                    isProvinciaScope && !form.idProvince
                      ? 'Primero elige una provincia.'
                      : 'No hay distritos disponibles.'
                  }
                  onChange={handleDistrictSelect}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600">Recojo en Shalon *</label>
                <SearchableCombobox
                  value={form.idShalon}
                  selectedLabel={form.shalon}
                  placeholder={
                    form.idDistrict
                      ? 'Selecciona un Shalon cercano'
                      : 'Primero elige un distrito'
                  }
                  searchPlaceholder="Escribe para buscar Shalon…"
                  options={shalonComboboxOptions}
                  isLoading={isLoadingShalons}
                  disabled={!form.idDistrict}
                  emptyMessage="No hay Shalons disponibles en este distrito."
                  onChange={handleShalonSelect}
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  name="isPrimary"
                  checked={form.isPrimary}
                  onChange={handleChange}
                  className="accent-gray-900"
                />
                Establecer como dirección principal
              </label>

              {error && <p className="text-sm text-red-600">{error}</p>}
            </form>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t px-5 py-4 sm:flex-row">
          {!editing ? (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-black py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
              >
                <Pencil className="h-4 w-4" />
                Editar
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cerrar
              </button>
            </>
          ) : (
            <>
              <button
                type="submit"
                form="address-edit-form"
                disabled={isSaving}
                className="flex-1 rounded-full bg-black py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
              >
                {isSaving ? 'Guardando…' : 'Guardar cambios'}
              </button>
              <button
                type="button"
                onClick={initialMode === 'edit' ? onClose : handleCancelEdit}
                className="flex-1 rounded-full border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
