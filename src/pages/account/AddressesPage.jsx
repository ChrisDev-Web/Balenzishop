import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Star, Trash2, MapPin, Eye, Pencil, Map } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useUiStore } from '../../stores/uiStore'
import { AUTH_INTENT } from '../../utils/authFlow'
import {
  cities,
  getDistrictsForCity,
  getShalonsForDistrict,
  getNearestShalon,
  getCitiesForScope,
  resolveLocationForScope,
  sortDistrictsByDistance,
} from '../../data/shalonLocations'
import { getCoverageInfo, COVERAGE_MESSAGES, DELIVERY_FEES } from '../../data/rainauCoverage'
import { getCurrentPosition, reverseGeocode } from '../../utils/geolocation'
import AddressModal from '../../components/account/AddressModal'
import DeliveryZoneModal, { CoverageBanner, ZoneOverrideModal } from '../../components/account/DeliveryZoneModal'

const emptyForm = {
  city: '',
  district: '',
  shalon: '',
  isPrimary: false,
}

const ZONE_STORAGE_KEY = 'balenzishop-delivery-zone'

function shalonMapsUrl(shalonName, district, city) {
  // shalonName format: "Shalon Foo - Av. Tal 123"
  const parts = shalonName.split(' - ')
  const address = parts.length > 1 ? parts.slice(1).join(' - ') : shalonName
  const query = `${address}, ${district || ''}, ${city || ''}, Perú`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

export default function AddressesPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const flujo = searchParams.get('flujo')
  const { user, addAddress, updateAddress, deleteAddress } = useAuthStore()
  const authIntent = useUiStore((s) => s.authIntent)
  const clearAuthIntent = useUiStore((s) => s.clearAuthIntent)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [modalAddress, setModalAddress] = useState(null)
  const [modalMode, setModalMode] = useState('view')

  const [showZoneModal, setShowZoneModal] = useState(false)
  const [zoneLoading, setZoneLoading] = useState(false)
  const [zoneError, setZoneError] = useState('')
  const [deliveryScope, setDeliveryScope] = useState(null)
  const [coverageInfo, setCoverageInfo] = useState(null)
  const [userCoords, setUserCoords] = useState(null)
  const [geoLabel, setGeoLabel] = useState('')
  const [showOverrideModal, setShowOverrideModal] = useState(false)

  const addresses = user?.addresses || []
  const isSetupFlow = flujo === 'pedido' || flujo === 'onboarding'

  const availableCities = useMemo(
    () => (deliveryScope ? getCitiesForScope(deliveryScope) : cities),
    [deliveryScope],
  )

  const districts = useMemo(() => {
    if (!form.city) return []
    if (userCoords && deliveryScope) {
      return sortDistrictsByDistance(form.city, userCoords.lat, userCoords.lng)
    }
    return [...getDistrictsForCity(form.city)].sort((a, b) => a.localeCompare(b, 'es'))
  }, [form.city, userCoords, deliveryScope])

  const shalons = useMemo(() => getShalonsForDistrict(form.district), [form.district])

  useEffect(() => {
    if (flujo === 'pedido' && addresses.length > 0) {
      clearAuthIntent()
      navigate('/pedido', { replace: true })
    }
  }, [flujo, addresses.length, navigate, clearAuthIntent])

  useEffect(() => {
    if (isSetupFlow && addresses.length === 0) {
      setShowForm(true)
      // Siempre borrar caché para re-validar cobertura con las coords reales
      sessionStorage.removeItem(ZONE_STORAGE_KEY)
      setShowZoneModal(true)
    }
  }, [isSetupFlow, addresses.length])

  const applyLocation = useCallback(async (scope) => {
    setZoneLoading(true)
    setZoneError('')

    try {
      const coords = await getCurrentPosition()
      setUserCoords(coords)

      const geo = await reverseGeocode(coords.lat, coords.lng)
      setGeoLabel(geo.displayName)

      const resolved = resolveLocationForScope(scope, geo, coords.lat, coords.lng)
      setForm({
        city: resolved.city,
        district: resolved.district,
        shalon: resolved.shalon,
        isPrimary: true,
      })

      setDeliveryScope(scope)

      let coverage = null
      if (scope === 'lima') {
        coverage = getCoverageInfo(resolved.district, coords.lat, coords.lng)
        setCoverageInfo(coverage)
      } else {
        setCoverageInfo(null)
      }

      sessionStorage.setItem(
        ZONE_STORAGE_KEY,
        JSON.stringify({
          scope,
          coverage,
          coords,
          geoLabel: geo.displayName,
          form: {
            city: resolved.city,
            district: resolved.district,
            shalon: resolved.shalon,
          },
        }),
      )

      setShowZoneModal(false)
    } catch (err) {
      setZoneError(err.message || 'No se pudo obtener ubicación')
      setDeliveryScope(scope)
      setCoverageInfo(null)
      setShowZoneModal(false)
    } finally {
      setZoneLoading(false)
    }
  }, [])

  const handleZoneSelect = (scope) => {
    applyLocation(scope)
  }

  const handleOverrideZone = (zone) => {
    const msg = COVERAGE_MESSAGES[zone]
    if (msg) {
      const fee = DELIVERY_FEES[zone] ?? 0
      setCoverageInfo({ ...msg, zone, deliveryFee: fee })
    }
    setShowOverrideModal(false)
  }

  const handleCityChange = (e) => {
    setForm({ city: e.target.value, district: '', shalon: '', isPrimary: form.isPrimary })
  }

  const handleDistrictChange = (e) => {
    const district = e.target.value
    const shalonList = getShalonsForDistrict(district)
    const shalon = shalonList[0] || getNearestShalon(district, userCoords?.lat, userCoords?.lng)
    setForm((prev) => ({ ...prev, district, shalon }))

    if (deliveryScope === 'lima' && district) {
      setCoverageInfo(getCoverageInfo(district, userCoords?.lat, userCoords?.lng))
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!form.city || !form.district || !form.shalon) {
      setError('Completa ciudad, distrito y punto de recojo')
      return
    }

    const coverage = deliveryScope === 'lima'
      ? getCoverageInfo(form.district, userCoords?.lat, userCoords?.lng)
      : null

    addAddress({
      ...form,
      isPrimary: form.isPrimary || addresses.length === 0,
      deliveryScope,
      coverageZone: coverage?.zone || null,
      deliveryFee: coverage?.deliveryFee ?? 0,
      geoLat: userCoords?.lat ?? null,
      geoLng: userCoords?.lng ?? null,
    })
    sessionStorage.removeItem(ZONE_STORAGE_KEY)
    setForm(emptyForm)
    setShowForm(false)
    setError('')

    if (flujo === 'pedido' || authIntent === AUTH_INTENT.CHECKOUT) {
      clearAuthIntent()
      navigate('/pedido')
      return
    }
    if (flujo === 'onboarding' || authIntent === AUTH_INTENT.ONBOARDING) {
      clearAuthIntent()
      navigate('/mi-cuenta')
    }
  }

  const setPrimary = (id) => {
    updateAddress(id, { isPrimary: true })
  }

  const openModal = (addr, mode) => {
    setModalAddress(addr)
    setModalMode(mode)
  }

  const closeModal = () => {
    setModalAddress(null)
  }

  const selectClass = 'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none'

  return (
    <div>
      {showZoneModal && (
        <DeliveryZoneModal
          onSelect={handleZoneSelect}
          onClose={() => setShowZoneModal(false)}
          loading={zoneLoading}
          error={zoneError}
        />
      )}

      {showOverrideModal && (
        <ZoneOverrideModal
          onSelect={handleOverrideZone}
          onClose={() => setShowOverrideModal(false)}
        />
      )}

      <div className="flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Direcciones</h1>
          {flujo === 'pedido' && (
            <p className="mt-1 text-sm text-amber-700">Agrega tu dirección de recojo para continuar con tu pedido.</p>
          )}
          {flujo === 'onboarding' && (
            <p className="mt-1 text-sm text-gray-600">Agrega tu dirección de recojo para completar tu cuenta.</p>
          )}
        </div>
        {!isSetupFlow && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Agregar dirección
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900">
            {isSetupFlow ? 'Tu dirección de recojo' : 'Nueva dirección de recojo'}
          </h2>

          {deliveryScope && (
            <p className="mt-1 text-xs text-gray-500">
              Modalidad: {deliveryScope === 'lima' ? 'Envíos Lima' : 'Provincia'}
              {geoLabel && ` · ${geoLabel}`}
            </p>
          )}

          {deliveryScope === 'lima' && coverageInfo && (
            <CoverageBanner
              coverage={coverageInfo}
              onOverrideZone={() => setShowOverrideModal(true)}
            />
          )}

          {zoneError && !showZoneModal && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{zoneError}</p>
          )}

          {!deliveryScope && isSetupFlow && (
            <button
              type="button"
              onClick={() => setShowZoneModal(true)}
              className="mt-3 text-sm font-medium text-black hover:underline"
            >
              Elegir Lima o provincia según su ubicación
            </button>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-gray-600">Ciudad *</label>
              <select
                name="city"
                value={form.city}
                onChange={handleCityChange}
                required
                className={selectClass}
              >
                <option value="">Selecciona una ciudad</option>
                {(deliveryScope ? availableCities : cities).map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600">Distrito *</label>
              <select
                name="district"
                value={form.district}
                onChange={handleDistrictChange}
                required
                disabled={!form.city}
                className={selectClass}
              >
                <option value="">Selecciona un distrito</option>
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm text-gray-600">Recojo en Shalon *</label>
              <div className="flex items-center gap-2">
                <select
                  name="shalon"
                  value={form.shalon}
                  onChange={handleChange}
                  required
                  disabled={!form.district}
                  className={`${selectClass} flex-1`}
                >
                  <option value="">
                    {form.district ? 'Selecciona un Shalon cercano' : 'Primero elige ciudad y distrito'}
                  </option>
                  {shalons.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {form.shalon && (
                  <a
                    href={shalonMapsUrl(form.shalon, form.district, form.city)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Ver Shalon en Google Maps"
                    className="mt-1 flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:border-black hover:bg-gray-50 hover:text-black"
                  >
                    <Map className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Ver en mapa</span>
                  </a>
                )}
              </div>
              {form.district && shalons.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">No hay Shalons disponibles en este distrito.</p>
              )}
            </div>
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
            <button type="submit" className="rounded-full bg-black px-6 py-2 text-sm font-semibold text-white hover:bg-gray-800">
              {flujo === 'pedido' ? 'Guardar y continuar al pedido' : 'Guardar y continuar'}
            </button>
            {!isSetupFlow && (
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(emptyForm); setError('') }}
                className="rounded-full border px-6 py-2 text-sm text-gray-600"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      <div className="mt-8">
        {addresses.length === 0 ? (
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
                        {addr.district}, {addr.city}
                      </span>
                      {addr.isPrimary && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-black px-2 py-0.5 text-xs font-medium text-white">
                          <Star className="h-3 w-3" /> Principal
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">{addr.shalon || addr.street}</p>
                    {addr.shalon && (
                      <a
                        href={shalonMapsUrl(addr.shalon, addr.district, addr.city)}
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
                      onClick={() => openModal(addr, 'edit')}
                      className="flex items-center justify-center gap-1 rounded-full border border-black px-3 py-2 text-xs font-medium text-black hover:bg-gray-50 sm:py-1"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteAddress(addr.id)}
                    className="flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-black sm:rounded-full sm:p-1.5"
                    aria-label="Eliminar dirección"
                  >
                    <Trash2 className="h-4 w-4" />
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
        />
      )}
    </div>
  )
}
