import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MapPin, X } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  buildGoogleMapsLink,
  geocodeDistrictCenter,
  getDefaultMapCenter,
  normalizeMapLocation,
  resolveMapLocation,
} from '../../utils/deliveryLocation'
import {
  getRainauCoverageLeafletStyle,
  getRainauCoverageQuoteLabel,
  getRainauScheduleConfirmMessage,
  isSelectableRainauCoverage,
  RAINAU_COVERAGE_KIND,
  RAINAU_COVERAGE_REQUIRED_MESSAGE,
  VISIBLE_RAINAU_COVERAGE_ZONES,
  resolveRainauCoverage,
} from '../../utils/rainauCoverage'
import useBodyScrollLock from '../../hooks/useBodyScrollLock'
import DeliveryMapCenterPin from './DeliveryMapCenterPin'

/** OpenStreetMap estándar. */
const MAP_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const DEFAULT_ZOOM = 16
const ADDRESS_PLACEHOLDER = 'Escriba su dirección completa aquí'

function readMapCenter(map) {
  const center = map.getCenter()
  return { lat: center.lat, lng: center.lng }
}

export default function DeliveryLocationPicker({
  value,
  googleMapsLink = '',
  fullAddress = '',
  districtName = '',
  mapOpenTrigger = 0,
  onChange,
  disabled = false,
  isSaving = false,
}) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const lastTriggerRef = useRef(0)
  const geocodeRequestRef = useRef(0)
  const mapSessionRef = useRef(0)
  const pendingPanRef = useRef(null)

  const [addressInput, setAddressInput] = useState(fullAddress)
  const [mapModalOpen, setMapModalOpen] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [error, setError] = useState('')
  const [liveCoverage, setLiveCoverage] = useState(null)
  const [scheduleConfirm, setScheduleConfirm] = useState(null)

  const currentLocation = normalizeMapLocation(value)
  const hasConfirmedLocation = Boolean(currentLocation)
  const confirmedCoverage = resolveRainauCoverage(currentLocation?.lat, currentLocation?.lng)

  useBodyScrollLock(mapModalOpen)

  useEffect(() => {
    setAddressInput(fullAddress)
  }, [fullAddress])

  const closeMapModal = useCallback(() => {
    geocodeRequestRef.current += 1
    mapSessionRef.current += 1
    pendingPanRef.current = null
    setScheduleConfirm(null)
    setMapModalOpen(false)
    setMapReady(false)
  }, [])

  useEffect(() => {
    if (isSaving) {
      closeMapModal()
    }
  }, [isSaving, closeMapModal])

  const panMapTo = useCallback((location, zoom = DEFAULT_ZOOM) => {
    const normalized = normalizeMapLocation(location)
    if (!normalized) return

    const map = mapRef.current
    if (!map) {
      pendingPanRef.current = { lat: normalized.lat, lng: normalized.lng, zoom }
      return
    }

    pendingPanRef.current = null
    map.setView([normalized.lat, normalized.lng], zoom, { animate: true })
  }, [])

  const openMapModal = useCallback(async () => {
    if (disabled) return

    setError('')
    setMapModalOpen(true)
    setMapReady(false)
    mapSessionRef.current += 1

    const existing = normalizeMapLocation(value)
    const requestId = geocodeRequestRef.current + 1
    geocodeRequestRef.current = requestId

    if (existing) return

    setIsGeocoding(true)
    try {
      const center = await geocodeDistrictCenter(districtName)
      if (requestId !== geocodeRequestRef.current) return
      panMapTo(center)
    } catch (geocodeError) {
      if (requestId !== geocodeRequestRef.current) return
      setError(geocodeError.message || 'No se pudo centrar el mapa en el distrito.')
      panMapTo(getDefaultMapCenter(), 13)
    } finally {
      if (requestId === geocodeRequestRef.current) {
        setIsGeocoding(false)
      }
    }
  }, [disabled, districtName, value, panMapTo])

  useEffect(() => {
    if (!mapOpenTrigger || mapOpenTrigger === lastTriggerRef.current) return
    lastTriggerRef.current = mapOpenTrigger
    openMapModal()
  }, [mapOpenTrigger, openMapModal])

  useEffect(() => {
    if (!mapModalOpen || !mapContainerRef.current) return undefined

    const container = mapContainerRef.current
    const sessionId = mapSessionRef.current
    const startCenter = resolveMapLocation(value)
    let map = null
    let disposed = false

    const initMap = () => {
      if (disposed || !container.isConnected || sessionId !== mapSessionRef.current) return

      if (container._leaflet_id) {
        container.replaceChildren()
        delete container._leaflet_id
      }

      map = L.map(container, {
        center: [startCenter.lat, startCenter.lng],
        zoom: DEFAULT_ZOOM,
        scrollWheelZoom: true,
        zoomControl: false,
      })

      L.control.zoom({ position: 'bottomright' }).addTo(map)

      L.tileLayer(MAP_TILE_URL, {
        subdomains: 'abc',
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      }).addTo(map)

      const overlayOrder = [
        RAINAU_COVERAGE_KIND.ZONE_10,
        RAINAU_COVERAGE_KIND.ZONE_15,
        RAINAU_COVERAGE_KIND.NO_COVERAGE,
      ]

      overlayOrder.forEach((kind) => {
        VISIBLE_RAINAU_COVERAGE_ZONES
          .filter((zone) => zone.kind === kind)
          .forEach((zone) => {
            zone.rings.forEach((ring) => {
              L.polygon(ring, {
                ...getRainauCoverageLeafletStyle(zone),
                interactive: false,
              }).addTo(map)
            })
          })
      })

      const updateLiveCoverage = () => {
        const center = readMapCenter(map)
        setLiveCoverage(resolveRainauCoverage(center.lat, center.lng))
      }

      map.on('move', updateLiveCoverage)
      map.on('moveend', updateLiveCoverage)
      updateLiveCoverage()

      mapRef.current = map

      const refreshMapSize = () => {
        if (!disposed && map) {
          map.invalidateSize(true)
        }
      }

      map.whenReady(() => {
        if (disposed || sessionId !== mapSessionRef.current) return
        refreshMapSize()

        if (pendingPanRef.current) {
          const { lat, lng, zoom } = pendingPanRef.current
          map.setView([lat, lng], zoom, { animate: false })
          pendingPanRef.current = null
        }

        setMapReady(true)
      })

      ;[50, 150, 350, 700].forEach((delay) => {
        window.setTimeout(refreshMapSize, delay)
      })
    }

    const timer = window.setTimeout(initMap, 0)

    return () => {
      disposed = true
      window.clearTimeout(timer)
      map?.remove()
      mapRef.current = null
      setMapReady(false)
    }
  }, [mapModalOpen, value])

  function buildInternalMapsLink(location) {
    const normalized = normalizeMapLocation(location)
    if (!normalized) return googleMapsLink || null
    return buildGoogleMapsLink(normalized.lat, normalized.lng)
  }

    function applyLocation(location) {
    const normalized = normalizeMapLocation(location)
    if (!normalized) {
      setError('Selecciona una ubicación dentro de Perú.')
      return false
    }

    const coverage = resolveRainauCoverage(normalized.lat, normalized.lng)
    if (!isSelectableRainauCoverage(coverage)) {
      setError(RAINAU_COVERAGE_REQUIRED_MESSAGE)
      return false
    }

    setError('')
    onChange?.({
      geoLat: normalized.lat,
      geoLng: normalized.lng,
      googleMapsLink: buildInternalMapsLink(normalized),
      deliveryFee: coverage.fee,
      coverageZone: coverage.zoneId,
    })

    return true
  }

  function handleConfirmMapLocation() {
    if (!mapRef.current) return
    const location = readMapCenter(mapRef.current)
    const normalized = normalizeMapLocation(location)
    if (!normalized) {
      setError('Selecciona una ubicación dentro de Perú.')
      return
    }

    const coverage = resolveRainauCoverage(normalized.lat, normalized.lng)
    if (!isSelectableRainauCoverage(coverage)) {
      setError(RAINAU_COVERAGE_REQUIRED_MESSAGE)
      return
    }

    const message = getRainauScheduleConfirmMessage(coverage)
    if (message) {
      setError('')
      setScheduleConfirm({ location: normalized, coverage, message })
      return
    }

    const applied = applyLocation(normalized)
    if (applied) {
      closeMapModal()
    }
  }

  function handleConfirmSchedule() {
    if (!scheduleConfirm?.location) return
    const applied = applyLocation(scheduleConfirm.location)
    if (applied) {
      setScheduleConfirm(null)
      closeMapModal()
    }
  }

  function handleAddressChange(event) {
    const nextAddress = event.target.value
    setAddressInput(nextAddress)
    onChange?.({
      geoLat: currentLocation?.lat ?? null,
      geoLng: currentLocation?.lng ?? null,
      googleMapsLink: buildInternalMapsLink(currentLocation),
      fullAddress: nextAddress,
    })
  }

  const mapModal = mapModalOpen ? createPortal(
    <div className="fixed inset-0 z-[270] flex h-[100dvh] flex-col bg-white">
      <div className="relative z-10 flex shrink-0 items-start justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-gray-900">Ubica tu dirección</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            {districtName
              ? `Centro de ${districtName}. Mueve el mapa hasta que el pin quede en tu calle.`
              : 'Mueve el mapa hasta que el pin quede en tu calle.'}
          </p>
        </div>
        <button
          type="button"
          onClick={closeMapModal}
          className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Cerrar mapa"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative min-h-0 flex-1 bg-[#e8e6e1]">
        <div
          ref={mapContainerRef}
          className="leaflet-map-root leaflet-map-root--fullscreen absolute inset-0 z-0"
        />

        <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center">
          <div className="-translate-y-7">
            <DeliveryMapCenterPin />
          </div>
        </div>

        {(!mapReady || isGeocoding) && (
          <div className="absolute left-1/2 top-4 z-[600] -translate-x-1/2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-md">
            {!mapReady ? 'Cargando mapa…' : 'Ubicando distrito…'}
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[600] space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-emerald-800 shadow">
              Verde claro · S/ 10.00
            </span>
            <span className="rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-emerald-950 shadow">
              Verde oscuro · S/ 15.00
            </span>
            <span className="rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-indigo-900 shadow">
              Azul · S/ 15.00
            </span>
            <span className="rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-red-800 shadow">
              Rojo · con cargo (WhatsApp)
            </span>
          </div>
          {liveCoverage && (
            <div className="rounded-xl bg-white/95 px-3 py-2 text-sm font-semibold text-gray-900 shadow-md">
              {getRainauCoverageQuoteLabel(liveCoverage)}
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 shrink-0 border-t border-gray-200 bg-white px-4 py-4">
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
        <p className="text-xs text-gray-500">
          {isSelectableRainauCoverage(liveCoverage)
            ? liveCoverage.fee > 0
              ? 'Confirma el punto para guardar esa tarifa de delivery.'
              : 'Zona roja: el delivery queda con cargo y se coordina por WhatsApp.'
            : RAINAU_COVERAGE_REQUIRED_MESSAGE}
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={handleConfirmMapLocation}
            disabled={disabled || !mapReady || isGeocoding || !isSelectableRainauCoverage(liveCoverage)}
            className="flex-1 rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
          >
            Confirmar ubicación
          </button>
          <button
            type="button"
            onClick={closeMapModal}
            className="rounded-full border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </div>
      {scheduleConfirm && (
        <div className="absolute inset-0 z-[700] flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
            <p className="text-sm font-semibold text-gray-900">
              {scheduleConfirm.message}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleConfirmSchedule}
                className="flex-1 rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Confirmar
              </button>
              <button
                type="button"
                onClick={() => setScheduleConfirm(null)}
                className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  ) : null

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
        <p className="text-xs text-gray-600">
          {hasConfirmedLocation
            ? getRainauCoverageQuoteLabel(confirmedCoverage)
              || 'Ubicación marcada en el mapa. Puedes ajustarla si hace falta.'
            : districtName
              ? `Al elegir ${districtName}, abre el mapa para marcar tu calle exacta.`
              : 'Elige un distrito para marcar tu ubicación en el mapa.'}
        </p>
        <button
          type="button"
          onClick={openMapModal}
          disabled={disabled || !districtName}
          className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-60"
        >
          <MapPin className="h-3.5 w-3.5" />
          {hasConfirmedLocation ? 'Ajustar en mapa' : 'Marcar en mapa'}
        </button>
      </div>

      <div>
        <label className="block text-sm text-gray-600">Dirección completa *</label>
        <textarea
          value={addressInput}
          onChange={handleAddressChange}
          rows={3}
          required
          disabled={disabled}
          placeholder={ADDRESS_PLACEHOLDER}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none disabled:bg-gray-100"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {mapModal}
    </div>
  )
}
