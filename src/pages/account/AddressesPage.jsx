import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Star, Trash2, MapPin, Eye, Pencil, Map } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useUiStore } from '../../stores/uiStore'
import { AUTH_INTENT, getRouteAfterAddress, resolveReturnTo } from '../../utils/authFlow'
import { LIMA_CITY } from '../../data/shalonLocations'
import {
  listDistrictsPublic,
  listProvincesPublic,
  listRegionsPublic,
  listShalonsPublic,
} from '../../api/clientDirections'
import {
  buildShalonMapsUrl,
  mapDistrictOption,
  mapProvinceOption,
  mapRegionOption,
  mapShalonOption,
} from '../../utils/addressMapper'
import { buildFormFromAddress, formatAddressCityLabel } from '../../utils/addressFormHelpers'
import SearchableCombobox from '../../components/ui/SearchableCombobox'
import AddressModal from '../../components/account/AddressModal'
import DeleteAddressConfirmModal from '../../components/account/DeleteAddressConfirmModal'
import DeliveryZoneModal from '../../components/account/DeliveryZoneModal'
import LimaDeliveryTypeModal from '../../components/account/LimaDeliveryTypeModal'
import LimaDeliveryProviderModal from '../../components/account/LimaDeliveryProviderModal'
import DeliveryLocationPicker from '../../components/account/DeliveryLocationPicker'
import OwnDeliveryPickupPointField from '../../components/account/OwnDeliveryPickupPointField'
import {
  DELIVERY_TYPES,
  getDeliveryProviderLabel,
  getOwnDeliveryPickupFormValues,
  isHomeDeliveryType,
  isOwnDeliveryType,
} from '../../utils/deliveryTypes'

const emptyForm = {
  idRegion: '',
  region: '',
  city: '',
  idProvince: '',
  idDistrict: '',
  idShalon: '',
  district: '',
  shalonName: '',
  shalonLat: null,
  shalonLng: null,
  shalon: '',
  deliveryType: 'shalon',
  fullAddress: '',
  googleMapsLink: '',
  geoLat: null,
  geoLng: null,
  isPrimary: false,
}

export default function AddressesPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const flujo = searchParams.get('flujo')
  const isAddingNew = searchParams.get('nueva') === '1'
  const returnToParam = searchParams.get('returnTo')
  const {
    user,
    addAddress,
    updateAddress,
    deleteAddress,
    syncAddresses,
  } = useAuthStore()
  const authIntent = useUiStore((s) => s.authIntent)
  const authReturnTo = useUiStore((s) => s.authReturnTo)
  const finishAuthFlow = useUiStore((s) => s.finishAuthFlow)

  const [showForm, setShowForm] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false)
  const [modalAddress, setModalAddress] = useState(null)
  const [modalMode, setModalMode] = useState('view')
  const [addressToDelete, setAddressToDelete] = useState(null)
  const [isDeletingAddress, setIsDeletingAddress] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [regionOptions, setRegionOptions] = useState([])
  const [provinceOptions, setProvinceOptions] = useState([])
  const [districtOptions, setDistrictOptions] = useState([])
  const [shalonOptions, setShalonOptions] = useState([])
  const [isLoadingRegions, setIsLoadingRegions] = useState(false)
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false)
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false)
  const [isLoadingShalons, setIsLoadingShalons] = useState(false)
  const [locationMapTrigger, setLocationMapTrigger] = useState(0)

  const [showZoneModal, setShowZoneModal] = useState(false)
  const [showLimaTypeModal, setShowLimaTypeModal] = useState(false)
  const [showLimaProviderModal, setShowLimaProviderModal] = useState(false)
  const [deliveryScope, setDeliveryScope] = useState(null)
  const [limaDeliveryType, setLimaDeliveryType] = useState(null)
  const setupWizardStartedRef = useRef(false)
  const scrollToFormOnRevealRef = useRef(false)

  const addresses = user?.addresses || []
  const isSetupFlow = flujo === 'pedido' || flujo === 'onboarding'
  const isProvinciaScope = deliveryScope === 'provincia'
  const isLimaScope = deliveryScope === 'lima'
  const isLimaDelivery = isLimaScope && isHomeDeliveryType(form.deliveryType)
  const isOwnDelivery = isLimaScope && isOwnDeliveryType(form.deliveryType)
  const isBalenziHomeDelivery = isLimaDelivery && !isOwnDelivery
  const isShalonPickup = isProvinciaScope || (isLimaScope && limaDeliveryType === 'shalon')

  const resetFormState = useCallback(() => {
    setForm(emptyForm)
    setDeliveryScope(null)
    setLimaDeliveryType(null)
    setShowLimaProviderModal(false)
    setEditingAddressId(null)
    setError('')
  }, [])

  const resolveWizardCancelDestination = useCallback(() => {
    const fallback = flujo === 'pedido' ? '/catalogo' : '/mi-cuenta'
    return resolveReturnTo(returnToParam || authReturnTo, fallback)
  }, [flujo, returnToParam, authReturnTo])

  const cancelAddressWizard = useCallback(() => {
    setShowZoneModal(false)
    setShowLimaTypeModal(false)
    setShowLimaProviderModal(false)
    setShowForm(false)
    resetFormState()
    setupWizardStartedRef.current = false

    if (isSetupFlow) {
      navigate(resolveWizardCancelDestination(), { replace: true })
      return
    }

    if (isAddingNew) {
      navigate('/mi-cuenta/direcciones', { replace: true })
    }
  }, [isSetupFlow, isAddingNew, navigate, resetFormState, resolveWizardCancelDestination])

  const revealAddressForm = useCallback(() => {
    scrollToFormOnRevealRef.current = true
    setShowForm(true)
  }, [])

  useEffect(() => {
    if (!showForm || !scrollToFormOnRevealRef.current) return
    if (showZoneModal || showLimaTypeModal || showLimaProviderModal) return

    scrollToFormOnRevealRef.current = false

    const timeoutId = window.setTimeout(() => {
      document.getElementById('address-form')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 80)

    return () => window.clearTimeout(timeoutId)
  }, [showForm, showZoneModal, showLimaTypeModal, showLimaProviderModal])

  const startAddressWizard = useCallback(() => {
    resetFormState()
    setShowForm(false)
    setShowZoneModal(true)
  }, [resetFormState])

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
      searchText: shalon.searchText || shalon.label,
      raw: shalon,
    })),
    [shalonOptions],
  )

  useEffect(() => {
    let ignore = false
    setIsLoadingAddresses(true)
    syncAddresses()
      .catch(() => {})
      .finally(() => {
        if (!ignore) setIsLoadingAddresses(false)
      })
    return () => {
      ignore = true
    }
  }, [syncAddresses])

  useEffect(() => {
    if (!isProvinciaScope) {
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
  }, [isProvinciaScope])

  useEffect(() => {
    if (!isProvinciaScope || !form.idRegion) {
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
  }, [isProvinciaScope, form.idRegion])

  useEffect(() => {
    if (!deliveryScope) {
      setDistrictOptions([])
      return undefined
    }

    const canLoadDistricts = isProvinciaScope
      ? Boolean(form.idProvince)
      : isLimaScope

    if (!canLoadDistricts) {
      setDistrictOptions([])
      return undefined
    }

    let ignore = false
    setIsLoadingDistricts(true)

    const request = isProvinciaScope
      ? listDistrictsPublic({ page: 1, page_size: 100, id_province: form.idProvince })
      : listDistrictsPublic({ page: 1, page_size: 100, delivery_scope: 'lima' })

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
  }, [deliveryScope, isProvinciaScope, isLimaScope, form.idProvince])

  useEffect(() => {
    if (!form.idDistrict) {
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
  }, [form.idDistrict])

  useEffect(() => {
    if (!isOwnDelivery || form.idDistrict || districtOptions.length === 0) return

    const firstDistrict = districtOptions[0]
    setForm((prev) => ({
      ...prev,
      idProvince: String(firstDistrict.idProvince),
      idDistrict: String(firstDistrict.idDistrict),
      district: firstDistrict.name,
      city: LIMA_CITY,
      ...getOwnDeliveryPickupFormValues(),
    }))
  }, [isOwnDelivery, districtOptions, form.idDistrict])

  useEffect(() => {
    if (!isSetupFlow || isLoadingAddresses || addresses.length === 0 || isAddingNew) return

    const next = flujo === 'pedido'
      ? '/pedido'
      : getRouteAfterAddress(authIntent, authReturnTo)
    finishAuthFlow()
    navigate(next, { replace: true })
  }, [
    isSetupFlow,
    isLoadingAddresses,
    addresses.length,
    isAddingNew,
    flujo,
    authIntent,
    authReturnTo,
    navigate,
    finishAuthFlow,
  ])

  useEffect(() => {
    if (!isSetupFlow || isLoadingAddresses) return

    const shouldStartWizard = addresses.length === 0 || isAddingNew
    if (!shouldStartWizard) {
      setupWizardStartedRef.current = false
      return
    }

    if (setupWizardStartedRef.current || showZoneModal || showLimaTypeModal || showLimaProviderModal) {
      return
    }

    setupWizardStartedRef.current = true
    resetFormState()
    setShowForm(false)
    setShowZoneModal(true)
  }, [
    isSetupFlow,
    isLoadingAddresses,
    addresses.length,
    isAddingNew,
    showZoneModal,
    showLimaTypeModal,
    showLimaProviderModal,
    resetFormState,
  ])

  const resolveDeliveryTypeFromAddress = (address) => {
    if (address.deliveryScope === 'lima') {
      return isHomeDeliveryType(address.deliveryType) ? 'delivery' : 'shalon'
    }

    if (address.deliveryScope === 'provincia') {
      return 'shalon'
    }

    return null
  }

  const applyLimaDeliveryProvider = (provider) => {
    const deliveryType = provider === 'rainau' ? DELIVERY_TYPES.RAINAU : DELIVERY_TYPES.OWN

    setLimaDeliveryType('delivery')
    setForm((prev) => ({
      ...prev,
      deliveryType,
      idShalon: '',
      shalonName: '',
      shalonLat: null,
      shalonLng: null,
      shalon: '',
      ...(deliveryType === DELIVERY_TYPES.OWN
        ? {
            idProvince: '',
            idDistrict: '',
            district: '',
            city: LIMA_CITY,
            ...getOwnDeliveryPickupFormValues(),
          }
        : {
            fullAddress: '',
            googleMapsLink: '',
            geoLat: null,
            geoLng: null,
          }),
    }))
    setShowLimaProviderModal(false)
    revealAddressForm()
  }

  const openEditForm = (address) => {
    const scrollY = window.scrollY

    setEditingAddressId(address.id)
    setDeliveryScope(address.deliveryScope || null)
    setLimaDeliveryType(resolveDeliveryTypeFromAddress(address))
    setForm(buildFormFromAddress(address))
    setError('')
    setShowForm(true)
    setShowZoneModal(false)
    setShowLimaTypeModal(false)

    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY)
    })
  }

  const handleZoneSelect = (scope) => {
    setDeliveryScope(scope)
    setForm({
      ...emptyForm,
      city: scope === 'lima' ? LIMA_CITY : '',
      isPrimary: addresses.length === 0,
    })
    setShowZoneModal(false)

    if (scope === 'lima') {
      setShowLimaTypeModal(true)
      return
    }

    setLimaDeliveryType('shalon')
    revealAddressForm()
  }

  const handleLimaDeliveryTypeSelect = (type) => {
    if (type === 'delivery') {
      setShowLimaTypeModal(false)
      setShowLimaProviderModal(true)
      return
    }

    setLimaDeliveryType(type)
    setForm((prev) => ({
      ...prev,
      deliveryType: DELIVERY_TYPES.SHALON,
      idShalon: '',
      shalonName: '',
      shalonLat: null,
      shalonLng: null,
      shalon: '',
      fullAddress: '',
      googleMapsLink: '',
      geoLat: null,
      geoLng: null,
    }))
    setShowLimaTypeModal(false)
    revealAddressForm()
  }

  const openAddressForm = () => {
    if (showForm && !editingAddressId) {
      cancelAddressWizard()
      return
    }

    startAddressWizard()
  }

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
      shalonName: '',
      shalonLat: null,
      shalonLng: null,
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
      shalonName: '',
      shalonLat: null,
      shalonLng: null,
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
      shalonName: '',
      shalonLat: null,
      shalonLng: null,
      shalon: '',
      fullAddress: '',
      googleMapsLink: '',
      geoLat: null,
      geoLng: null,
    }))

    if (selected && isBalenziHomeDelivery) {
      setLocationMapTrigger((current) => current + 1)
    }
  }

  const handleDeliveryLocationChange = ({ geoLat, geoLng, googleMapsLink, fullAddress }) => {
    setForm((prev) => ({
      ...prev,
      geoLat,
      geoLng,
      googleMapsLink,
      ...(fullAddress !== undefined ? { fullAddress } : {}),
    }))
  }

  const handleShalonSelect = (value, option) => {
    const selected = option?.raw
      ?? shalonOptions.find((item) => String(item.idShalon) === String(value))

    setForm((prev) => ({
      ...prev,
      idShalon: selected ? String(selected.idShalon) : '',
      shalonName: selected?.name || '',
      shalonLat: selected?.latitude ?? null,
      shalonLng: selected?.longitude ?? null,
      shalon: selected?.label || '',
    }))
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (isProvinciaScope && !form.idRegion) {
      setError('Selecciona una región')
      return
    }

    if (!isOwnDelivery && (!form.idProvince || !form.idDistrict)) {
      setError('Completa ciudad y distrito')
      return
    }

    if (isBalenziHomeDelivery) {
      if (form.geoLat == null || form.geoLng == null) {
        setError('Indica la ubicación exacta en el mapa')
        return
      }

      if (!form.fullAddress?.trim()) {
        setError('Escriba su dirección completa')
        return
      }
    } else if (isOwnDelivery) {
      if (!form.idProvince || !form.idDistrict) {
        setError('Espera un momento mientras cargamos el punto de entrega')
        return
      }

      if (!form.googleMapsLink?.trim()) {
        setError('No se pudo cargar el punto de entrega')
        return
      }
    } else if (!form.idShalon) {
      setError('Selecciona la sede Shalon')
      return
    }

    if (!deliveryScope || (isLimaScope && !limaDeliveryType)) {
      setError('Elige la modalidad de entrega')
      if (isLimaScope && !limaDeliveryType) {
        setShowLimaTypeModal(true)
      } else {
        setShowZoneModal(true)
      }
      return
    }

    setIsSaving(true)
    const payload = {
      idProvince: form.idProvince,
      idDistrict: form.idDistrict,
      idShalon: form.idShalon,
      isPrimary: editingAddressId ? form.isPrimary : (form.isPrimary || addresses.length === 0),
      deliveryScope,
      deliveryType: isLimaDelivery ? form.deliveryType : DELIVERY_TYPES.SHALON,
      fullAddress: form.fullAddress,
      googleMapsLink: form.googleMapsLink,
      geoLat: form.geoLat,
      geoLng: form.geoLng,
    }

    const result = editingAddressId
      ? await updateAddress(editingAddressId, payload)
      : await addAddress(payload)
    setIsSaving(false)

    if (!result.success) {
      setError(
        result.error
          || (editingAddressId
            ? 'No se pudo actualizar la dirección'
            : 'No se pudo guardar la dirección'),
      )
      return
    }

    setShowForm(false)
    resetFormState()

    if (!editingAddressId && isSetupFlow) {
      const next = flujo === 'pedido'
        ? '/pedido'
        : getRouteAfterAddress(authIntent, authReturnTo)
      finishAuthFlow()
      navigate(next)
      return
    }
  }

  const setPrimary = async (id) => {
    const result = await updateAddress(id, { isPrimary: true })
    if (!result.success) {
      setError(result.error || 'No se pudo actualizar la dirección principal')
    }
  }

  const openDeleteConfirm = (addr) => {
    setDeleteError('')
    setAddressToDelete(addr)
  }

  const closeDeleteConfirm = () => {
    if (isDeletingAddress) return
    setAddressToDelete(null)
    setDeleteError('')
  }

  const confirmDelete = async () => {
    if (!addressToDelete) return

    setIsDeletingAddress(true)
    setDeleteError('')
    const result = await deleteAddress(addressToDelete.id)
    setIsDeletingAddress(false)

    if (!result.success) {
      setDeleteError(result.error || 'No se pudo eliminar la dirección')
      return
    }

    setAddressToDelete(null)
  }

  const openModal = (addr, mode) => {
    setModalAddress(addr)
    setModalMode(mode)
  }

  const closeModal = () => {
    setModalAddress(null)
  }

  const readonlyClass = 'mt-1 w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700'
  const districtsDisabled = isProvinciaScope
    ? !form.idProvince || isLoadingDistricts
    : !deliveryScope || isLoadingDistricts

  return (
    <div>
      {showZoneModal && (
        <DeliveryZoneModal
          onSelect={handleZoneSelect}
          onClose={cancelAddressWizard}
        />
      )}

      {showLimaProviderModal && (
        <LimaDeliveryProviderModal
          onSelect={applyLimaDeliveryProvider}
          onBack={() => {
            setShowLimaProviderModal(false)
            setShowLimaTypeModal(true)
          }}
          onClose={cancelAddressWizard}
        />
      )}

      {showLimaTypeModal && (
        <LimaDeliveryTypeModal
          onSelect={handleLimaDeliveryTypeSelect}
          onClose={cancelAddressWizard}
        />
      )}

      <div className="flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Direcciones</h1>
          {flujo === 'pedido' && (
            <p className="mt-1 text-sm text-amber-700">Agrega tu dirección de entrega para continuar con tu pedido.</p>
          )}
          {flujo === 'onboarding' && (
            <p className="mt-1 text-sm text-gray-600">Agrega tu dirección de entrega para completar tu cuenta.</p>
          )}
        </div>
        {!isSetupFlow && (
          <button
            type="button"
            onClick={openAddressForm}
            className="flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Agregar dirección
          </button>
        )}
      </div>

      {showForm && (
        <form
          id="address-form"
          onSubmit={handleSubmit}
          className="mt-6 scroll-mt-24 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h2 className="font-semibold text-gray-900">
            {editingAddressId
              ? 'Editar dirección de entrega'
              : isSetupFlow
                ? 'Tu dirección de entrega'
                : 'Nueva dirección de entrega'}
          </h2>

          {deliveryScope && (
            <p className="mt-1 text-xs text-gray-500">
              Modalidad:{' '}
              {deliveryScope === 'lima'
                ? isLimaDelivery
                  ? getDeliveryProviderLabel(form.deliveryType)
                  : 'Recojo en Shalon (Lima)'
                : 'Provincia — Recojo en Shalon'}
              {isLimaScope && (
                <>
                  {' '}
                  ·{' '}
                  <button
                    type="button"
                    onClick={() => setShowLimaTypeModal(true)}
                    className="font-medium text-black hover:underline"
                  >
                    Cambiar
                  </button>
                </>
              )}
            </p>
          )}

          {!deliveryScope && (
            <button
              type="button"
              onClick={startAddressWizard}
              className="mt-3 text-sm font-medium text-black hover:underline"
            >
              Elegir Lima o provincia
            </button>
          )}

          {isLimaScope && !limaDeliveryType && (
            <button
              type="button"
              onClick={() => setShowLimaTypeModal(true)}
              className="mt-3 text-sm font-medium text-black hover:underline"
            >
              Elegir delivery o recojo en Shalon
            </button>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
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

            {!isOwnDelivery && (
              <>
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

                <div className={isProvinciaScope ? 'sm:col-span-2' : ''}>
                  <label className="block text-sm text-gray-600">Distrito *</label>
                  <SearchableCombobox
                    value={form.idDistrict}
                    selectedLabel={form.district}
                    placeholder="Selecciona un distrito"
                    searchPlaceholder="Escribe para buscar distrito…"
                    options={districtComboboxOptions}
                    isLoading={isLoadingDistricts}
                    disabled={districtsDisabled}
                    emptyMessage={
                      isProvinciaScope && !form.idProvince
                        ? 'Primero elige una provincia.'
                        : 'No hay distritos disponibles.'
                    }
                    onChange={handleDistrictSelect}
                  />
                </div>
              </>
            )}

            {isOwnDelivery && <OwnDeliveryPickupPointField />}

            {isShalonPickup && (
              <div className="sm:col-span-2">
                <label className="block text-sm text-gray-600">Sede Shalon *</label>
                <SearchableCombobox
                  value={form.idShalon}
                  selectedLabel={form.shalon}
                  placeholder={
                    form.idDistrict
                      ? 'Escribe para buscar sede Shalon'
                      : 'Primero elige un distrito'
                  }
                  searchPlaceholder="Busca por nombre o dirección (ej. PRO, Los Olivos)…"
                  options={shalonComboboxOptions}
                  isLoading={isLoadingShalons}
                  disabled={!form.idDistrict}
                  searchMode="contains"
                  emptyMessage="No hay Shalons que coincidan en este distrito."
                  onChange={handleShalonSelect}
                />
                {form.shalon && (
                  <a
                    href={buildShalonMapsUrl({
                      name: form.shalonName,
                      district: form.district,
                      city: form.city,
                      region: form.region,
                      shalonLabel: form.shalon,
                      geoLat: form.shalonLat,
                      geoLng: form.shalonLng,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-black hover:bg-gray-50 hover:text-black"
                  >
                    <Map className="h-4 w-4 shrink-0" />
                    Ver ubicación Shalom
                  </a>
                )}
              </div>
            )}

            {isBalenziHomeDelivery && form.idDistrict && (
              <div className="sm:col-span-2">
                <DeliveryLocationPicker
                  value={{ lat: form.geoLat, lng: form.geoLng }}
                  googleMapsLink={form.googleMapsLink}
                  fullAddress={form.fullAddress}
                  districtName={form.district}
                  mapOpenTrigger={locationMapTrigger}
                  onChange={handleDeliveryLocationChange}
                  isSaving={isSaving}
                />
              </div>
            )}
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              name="isPrimary"
              checked={form.isPrimary}
              onChange={handleChange}
              className="accent-gray-900"
            />
            Establecer como dirección principal
          </label>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-full bg-black px-6 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
            >
              {isSaving
                ? 'Guardando…'
                : editingAddressId
                  ? 'Guardar cambios'
                  : flujo === 'pedido'
                    ? 'Guardar y continuar al pedido'
                    : 'Guardar y continuar'}
            </button>
            {!isSetupFlow ? (
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  resetFormState()
                }}
                className="rounded-full border px-6 py-2 text-sm text-gray-600"
              >
                Cancelar
              </button>
            ) : (
              <button
                type="button"
                onClick={cancelAddressWizard}
                className="rounded-full border px-6 py-2 text-sm text-gray-600"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      <div className="mt-8">
        {isLoadingAddresses ? (
          <p className="text-gray-600">Cargando direcciones…</p>
        ) : addresses.length === 0 ? (
          <p className="text-gray-600">No tienes ninguna dirección registrada.</p>
        ) : (
          <ul className="space-y-3">
            {addresses.map((addr) => (
              <li
                key={addr.id}
                className={`rounded-lg border p-4 sm:flex sm:items-start sm:justify-between sm:gap-4 ${
                  addr.isPrimary ? 'border-black bg-gray-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex min-w-0 flex-1 gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold leading-snug text-gray-900">
                        {isOwnDeliveryType(addr.deliveryType)
                          ? getDeliveryProviderLabel(addr.deliveryType)
                          : `${addr.district}, ${formatAddressCityLabel(addr)}`}
                      </span>
                      {addr.isPrimary && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-black px-2 py-0.5 text-xs font-medium text-white">
                          <Star className="h-3 w-3" /> Principal
                        </span>
                      )}
                    </div>
                    {addr.region && addr.deliveryScope === 'provincia' && (
                      <p className="mt-0.5 text-xs text-gray-500">{addr.region}</p>
                    )}
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">
                      {isOwnDeliveryType(addr.deliveryType)
                        ? (addr.googleMapsLink || addr.fullAddress)
                        : isHomeDeliveryType(addr.deliveryType)
                          ? addr.fullAddress
                          : addr.shalon || addr.street}
                    </p>
                    {addr.shalon && addr.deliveryType !== 'delivery' && (
                      <a
                        href={buildShalonMapsUrl({
                          name: addr.shalonName,
                          district: addr.district,
                          city: addr.city,
                          region: addr.region,
                          shalonLabel: addr.shalon,
                          geoLat: addr.shalonLat,
                          geoLng: addr.shalonLng,
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-black hover:underline"
                      >
                        <Map className="h-3 w-3" />
                        Ver Shalon en mapa
                      </a>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3 sm:mt-0 sm:shrink-0 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:border-0 sm:pt-0">
                  {!addr.isPrimary && (
                    <button
                      type="button"
                      onClick={() => setPrimary(addr.id)}
                      className="w-full rounded-lg border border-gray-300 py-2 text-xs font-semibold text-black hover:bg-gray-50 sm:w-auto sm:border-0 sm:py-0 sm:font-medium sm:hover:underline"
                    >
                      Hacer principal
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                    <button
                      type="button"
                      onClick={() => openModal(addr, 'view')}
                      className="flex items-center justify-center gap-1 rounded-full border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 sm:py-1"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Ver detalle
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditForm(addr)}
                      className="flex items-center justify-center gap-1 rounded-full border border-black px-3 py-2 text-xs font-medium text-black hover:bg-gray-50 sm:py-1"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => openDeleteConfirm(addr)}
                    className="flex items-center justify-center gap-1 rounded-full border border-black px-3 py-2 text-xs font-medium text-black hover:bg-gray-50 sm:py-1.5"
                    aria-label="Eliminar dirección"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={2} />
                    <span className="sm:hidden">Eliminar</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modalAddress && (
        <AddressModal
          address={modalAddress}
          initialMode={modalMode}
          onClose={closeModal}
          onEdit={openEditForm}
        />
      )}

      <DeleteAddressConfirmModal
        address={addressToDelete}
        isProcessing={isDeletingAddress}
        error={deleteError}
        onCancel={closeDeleteConfirm}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
