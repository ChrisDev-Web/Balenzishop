import { useEffect, useMemo, useState } from 'react'
import { Map, ShieldCheck, Truck } from 'lucide-react'
import { listDistrictsPublic } from '../../api/clientDirections'
import SearchableCombobox from '../ui/SearchableCombobox'
import DeliveryLocationPicker from '../account/DeliveryLocationPicker'
import { LIMA_CITY } from '../../data/shalonLocations'
import {
  mapDistrictOption,
  mapProvinceOption,
  buildShalonMapsUrl,
} from '../../utils/addressMapper'
import {
  fetchAllProvincesPublic,
  inferDeliveryScopeFromShalonProvince,
} from '../../utils/addressFormHelpers'
import {
  COMPRA_RAPIDA_CHANNELS,
  useCompraRapidaStore,
} from '../../stores/compraRapidaStore'
import { useDocumentTypes } from '../../hooks/useDocumentTypes'
import {
  formatDocumentInputById,
  guestCheckoutDocumentTypeLabel,
  resolveGuestCheckoutDocumentTypes,
  validateDocumentById,
} from '../../utils/documentValidation'
import {
  isSelectableRainauCoverage,
  RAINAU_COVERAGE_REQUIRED_MESSAGE,
  resolveRainauCoverage,
} from '../../utils/rainauCoverage'
import CompraRapidaDistrictShalonSelect from './CompraRapidaDistrictShalonSelect'
import { useCartStore } from '../../stores/cartStore'
import { CART_MODES } from '../../utils/shoppingMode'

function splitFullName(fullName) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  return {
    name: parts[0] ?? '',
    last_name_paternal: parts[1] ?? '',
    last_name_maternal: parts.slice(2).join(' ') || '',
  }
}

export default function CompraRapidaSetupStep() {
  const {
    deliveryChannel,
    setDeliveryChannel,
    customer,
    setCustomer,
    deliveryForm,
    setDeliveryForm,
    deliveryScope,
    setDeliveryScope,
    markSetupSaved,
    setupReturnStep,
  } = useCompraRapidaStore()

  const [fullName, setFullName] = useState(
    [customer.name, customer.last_name_paternal, customer.last_name_maternal].filter(Boolean).join(' '),
  )
  const [error, setError] = useState('')
  const [provinceOptions, setProvinceOptions] = useState([])
  const [districtOptions, setDistrictOptions] = useState([])
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false)
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false)
  const [locationMapTrigger, setLocationMapTrigger] = useState(0)

  const { documentTypes } = useDocumentTypes()
  const guestDocumentTypeOptions = resolveGuestCheckoutDocumentTypes(documentTypes)
  const isShalom = deliveryChannel === COMPRA_RAPIDA_CHANNELS.SHALOM
  const isLimaRainau = deliveryChannel === COMPRA_RAPIDA_CHANNELS.RAINAU_LIMA
  const documentOptional = isLimaRainau

  const provinceComboboxOptions = useMemo(
    () => provinceOptions.map((item) => ({
      value: String(item.idProvince),
      label: item.label,
      searchText: item.label,
      raw: item,
    })),
    [provinceOptions],
  )

  const districtComboboxOptions = useMemo(
    () => districtOptions.map((item) => ({
      value: String(item.idDistrict),
      label: item.name,
      searchText: item.name,
      raw: item,
    })),
    [districtOptions],
  )

  useEffect(() => {
    if (!isShalom) return undefined

    let ignore = false
    setIsLoadingProvinces(true)

    fetchAllProvincesPublic()
      .then((items) => {
        if (!ignore) {
          setProvinceOptions(items.map(mapProvinceOption))
        }
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
  }, [isShalom])

  useEffect(() => {
    if (!isLimaRainau) return undefined

    let ignore = false
    setIsLoadingDistricts(true)
    listDistrictsPublic({ page: 1, page_size: 100, delivery_scope: 'lima' })
      .then((response) => {
        if (!ignore) setDistrictOptions((response.data?.items ?? []).map(mapDistrictOption))
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
  }, [isLimaRainau])

  useEffect(() => {
    if (!isShalom || !deliveryForm.idProvince) {
      setDistrictOptions([])
      return undefined
    }

    let ignore = false
    setIsLoadingDistricts(true)
    listDistrictsPublic({ page: 1, page_size: 100, id_province: deliveryForm.idProvince })
      .then((response) => {
        if (!ignore) setDistrictOptions((response.data?.items ?? []).map(mapDistrictOption))
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
  }, [isShalom, deliveryForm.idProvince])

  function validate() {
    if (!deliveryChannel) return 'Elige Shalom o Motorizado (Lima).'

    const names = splitFullName(fullName)
    if (!names.name || !names.last_name_paternal) {
      return 'Ingresa nombres y apellidos (al menos nombre y apellido paterno).'
    }

    if (!customer.phone?.trim()) return 'Ingresa tu teléfono.'

    if (customer.id_document_type && customer.document_number?.trim()) {
      const docError = validateDocumentById(
        guestDocumentTypeOptions,
        customer.id_document_type,
        customer.document_number,
      )
      if (docError) return docError
    } else if (!documentOptional && (!customer.id_document_type || !customer.document_number?.trim())) {
      return 'Selecciona tipo y número de documento para envío Shalom.'
    }

    if (isShalom) {
      if (!deliveryForm.idProvince) return 'Selecciona la provincia.'
      if (!deliveryForm.idDistrict) return 'Selecciona el distrito.'
      if (!deliveryForm.idShalon) return 'Selecciona la sede Shalom.'
    }

    if (isLimaRainau) {
      if (!deliveryForm.district?.trim()) return 'Selecciona el distrito en Lima.'
      if (!deliveryForm.fullAddress?.trim()) return 'Ingresa tu dirección.'
      if (deliveryForm.geoLat == null || deliveryForm.geoLng == null) {
        return 'Confirma tu ubicación en el mapa de cobertura.'
      }
      const coverage = resolveRainauCoverage(deliveryForm.geoLat, deliveryForm.geoLng)
      if (!isSelectableRainauCoverage(coverage)) {
        return RAINAU_COVERAGE_REQUIRED_MESSAGE
      }
    }

    return ''
  }

  function handleSave(event) {
    event.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    const names = splitFullName(fullName)
    setCustomer({
      ...names,
      id_document_type: customer.id_document_type,
      document_number: customer.document_number,
      phone: customer.phone,
    })

    if (isShalom && deliveryScope == null) {
      setDeliveryScope(inferDeliveryScopeFromShalonProvince(deliveryForm.city))
    }

    if (isLimaRainau) {
      setDeliveryScope('lima')
    }

    setError('')
    const isEditingExistingFlow = setupReturnStep != null
    if (!isEditingExistingFlow) {
      useCartStore.getState().clearCart(CART_MODES.MINORISTA)
    }
    markSetupSaved()
  }

  return (
    <form className="compra-rapida-setup" onSubmit={handleSave}>
      <header className="compra-rapida-setup__header">
        <h1 className="compra-rapida-setup__title">Compra rápida</h1>
        <p className="compra-rapida-setup__subtitle">
          Elige cómo recibirás tu pedido y guarda tus datos para armar el carrito.
        </p>
      </header>

      <div className="compra-rapida-setup__delivery-grid">
        <button
          type="button"
          className={`compra-rapida-delivery-card${deliveryChannel === COMPRA_RAPIDA_CHANNELS.SHALOM ? ' compra-rapida-delivery-card--active' : ''}`}
          onClick={() => setDeliveryChannel(COMPRA_RAPIDA_CHANNELS.SHALOM)}
        >
          <Truck size={18} aria-hidden />
          <span className="compra-rapida-delivery-card__title">Shalom</span>
          <span className="compra-rapida-delivery-card__hint">Provincia o Lima</span>
        </button>
        <button
          type="button"
          className={`compra-rapida-delivery-card${deliveryChannel === COMPRA_RAPIDA_CHANNELS.RAINAU_LIMA ? ' compra-rapida-delivery-card--active' : ''}`}
          onClick={() => setDeliveryChannel(COMPRA_RAPIDA_CHANNELS.RAINAU_LIMA)}
        >
          <ShieldCheck size={18} aria-hidden />
          <span className="compra-rapida-delivery-card__title">Motorizado (Lima)</span>
          <span className="compra-rapida-delivery-card__hint">Entrega Rainau en Lima</span>
        </button>
      </div>

      {deliveryChannel ? (
        <div className="compra-rapida-setup__panel">
          <h2 className="compra-rapida-setup__section-title">Tus datos</h2>
          <label className="compra-rapida-field">
            <span>Nombres y apellidos *</span>
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              autoComplete="name"
              placeholder="Juan Pérez García"
            />
          </label>
          <div className="compra-rapida-field-grid">
            <label className="compra-rapida-field">
              <span>Tipo de documento{documentOptional ? ' (opcional)' : ' *'}</span>
              <select
                value={customer.id_document_type}
                onChange={(event) => setCustomer({ id_document_type: event.target.value })}
              >
                <option value="">— Seleccionar —</option>
                {guestDocumentTypeOptions.map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    {guestCheckoutDocumentTypeLabel(item.name)}
                  </option>
                ))}
              </select>
            </label>
            <label className="compra-rapida-field">
              <span>Número de documento{documentOptional ? ' (opcional)' : ' *'}</span>
              <input
                value={customer.document_number}
                onChange={(event) => setCustomer({
                  document_number: formatDocumentInputById(
                    guestDocumentTypeOptions,
                    customer.id_document_type,
                    event.target.value,
                  ),
                })}
                inputMode="numeric"
              />
            </label>
            <label className="compra-rapida-field compra-rapida-field--full">
              <span>Teléfono *</span>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={customer.phone}
                onChange={(event) => setCustomer({
                  phone: event.target.value.replace(/\D/g, '').slice(0, 11),
                })}
                autoComplete="tel"
                placeholder="9 dígitos"
              />
            </label>
          </div>

          <h2 className="compra-rapida-setup__section-title">Entrega</h2>

          {isShalom ? (
            <div className="compra-rapida-field-grid">
              <label className="compra-rapida-field compra-rapida-field--full">
                <span>Provincia *</span>
                <SearchableCombobox
                  value={deliveryForm.idProvince}
                  selectedLabel={deliveryForm.city}
                  placeholder="Selecciona provincia…"
                  searchPlaceholder="Buscar provincia…"
                  options={provinceComboboxOptions}
                  isLoading={isLoadingProvinces}
                  disabled={isLoadingProvinces}
                  emptyMessage="No hay provincias disponibles."
                  onChange={(id, option) => {
                    setDeliveryForm({
                      idRegion: option?.raw?.idRegion ? String(option.raw.idRegion) : '',
                      region: option?.raw?.regionName ?? '',
                      idProvince: id,
                      city: option?.label ?? '',
                      idDistrict: '',
                      district: '',
                      idShalon: '',
                      shalon: '',
                      shalonName: '',
                    })
                    if (option?.label) {
                      setDeliveryScope(inferDeliveryScopeFromShalonProvince(option.label))
                    }
                  }}
                />
              </label>
              <label className="compra-rapida-field compra-rapida-field--full">
                <span>Distrito *</span>
                <SearchableCombobox
                  value={deliveryForm.idDistrict}
                  selectedLabel={deliveryForm.district}
                  placeholder="Selecciona distrito…"
                  searchPlaceholder="Buscar distrito…"
                  options={districtComboboxOptions}
                  isLoading={isLoadingDistricts}
                  disabled={!deliveryForm.idProvince || isLoadingDistricts}
                  emptyMessage="No hay distritos para esta provincia."
                  onChange={(id, option) => {
                    setDeliveryForm({
                      idDistrict: id,
                      district: option?.label ?? option?.raw?.name ?? '',
                      idShalon: '',
                      shalon: '',
                      shalonName: '',
                    })
                  }}
                />
              </label>
              <label className="compra-rapida-field compra-rapida-field--full">
                <span>Sede Shalom *</span>
                <CompraRapidaDistrictShalonSelect
                  districtId={deliveryForm.idDistrict}
                  value={deliveryForm.idShalon}
                  selectedLabel={deliveryForm.shalon}
                  onChange={(patch) => {
                    setDeliveryForm({ ...deliveryForm, ...patch })
                    if (patch.city) {
                      setDeliveryScope(inferDeliveryScopeFromShalonProvince(patch.city))
                    }
                  }}
                />
              </label>
            </div>
          ) : null}

          {isLimaRainau ? (
            <div className="compra-rapida-lima-fields">
              <label className="compra-rapida-field">
                <span>Ciudad</span>
                <input value={LIMA_CITY} readOnly className="compra-rapida-field__readonly" />
              </label>
              <label className="compra-rapida-field">
                <span>Distrito *</span>
                <SearchableCombobox
                  value={deliveryForm.idDistrict}
                  selectedLabel={deliveryForm.district}
                  placeholder="Selecciona un distrito"
                  searchPlaceholder="Buscar distrito…"
                  options={districtComboboxOptions}
                  isLoading={isLoadingDistricts}
                  disabled={isLoadingDistricts}
                  emptyMessage="No hay distritos disponibles."
                  onChange={(id, option) => {
                    setDeliveryForm({
                      idDistrict: id,
                      district: option?.label ?? option?.raw?.name ?? '',
                      fullAddress: '',
                      googleMapsLink: '',
                      geoLat: null,
                      geoLng: null,
                      coverageZone: null,
                      deliveryFee: 0,
                    })
                    if (id) setLocationMapTrigger((current) => current + 1)
                  }}
                />
              </label>
              {deliveryForm.idDistrict ? (
                <DeliveryLocationPicker
                  value={{ lat: deliveryForm.geoLat, lng: deliveryForm.geoLng }}
                  googleMapsLink={deliveryForm.googleMapsLink}
                  fullAddress={deliveryForm.fullAddress}
                  districtName={deliveryForm.district}
                  mapOpenTrigger={locationMapTrigger}
                  onChange={(patch) => {
                    setDeliveryForm({
                      geoLat: patch.geoLat,
                      geoLng: patch.geoLng,
                      googleMapsLink: patch.googleMapsLink,
                      fullAddress: patch.fullAddress ?? deliveryForm.fullAddress,
                      deliveryFee: patch.deliveryFee ?? deliveryForm.deliveryFee,
                      coverageZone: patch.coverageZone ?? deliveryForm.coverageZone,
                    })
                  }}
                />
              ) : null}
            </div>
          ) : null}

          {error ? (
            <p className="compra-rapida-error" role="alert">{error}</p>
          ) : null}

          <div className="compra-rapida-setup__actions">
            {isShalom && deliveryForm.shalon ? (
              <a
                href={buildShalonMapsUrl({
                  name: deliveryForm.shalonName,
                  district: deliveryForm.district,
                  city: deliveryForm.city,
                  region: deliveryForm.region,
                  shalonLabel: deliveryForm.shalon,
                  geoLat: deliveryForm.shalonLat,
                  geoLng: deliveryForm.shalonLng,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="compra-rapida-maps-link"
              >
                <Map size={16} aria-hidden />
                Ver sede en Maps
              </a>
            ) : (
              <span className="compra-rapida-setup__actions-spacer" aria-hidden="true" />
            )}

            <button type="submit" className="compra-rapida-btn compra-rapida-btn--primary">
              {setupReturnStep ? 'Guardar cambios' : 'Guardar y ver productos'}
            </button>
          </div>
        </div>
      ) : null}
    </form>
  )
}