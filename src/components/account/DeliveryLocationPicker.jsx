import { useEffect, useRef, useState } from 'react'
import { Crosshair, Eye, EyeOff } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  buildGoogleMapsLink,
  getCurrentPosition,
  getDefaultMapCenter,
  reverseGeocode,
} from '../../utils/deliveryLocation'

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

function normalizeLocation(value) {
  const lat = Number(value?.lat)
  const lng = Number(value?.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

export default function DeliveryLocationPicker({
  value,
  googleMapsLink = '',
  fullAddress = '',
  onChange,
  disabled = false,
  isSaving = false,
}) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)

  const [addressInput, setAddressInput] = useState(fullAddress)
  const [showPreview, setShowPreview] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [isResolving, setIsResolving] = useState(false)
  const [error, setError] = useState('')

  const currentLocation = normalizeLocation(value)

  useEffect(() => {
    setAddressInput(fullAddress)
  }, [fullAddress])

  useEffect(() => {
    if (isSaving) {
      setShowPreview(false)
    }
  }, [isSaving])

  useEffect(() => {
    if (!showPreview || !mapContainerRef.current || mapRef.current) return undefined

    const initial = currentLocation ?? getDefaultMapCenter()
    const map = L.map(mapContainerRef.current, {
      center: [initial.lat, initial.lng],
      zoom: currentLocation ? 16 : 12,
      scrollWheelZoom: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)

    const marker = L.marker([initial.lat, initial.lng], {
      draggable: !disabled,
      icon: markerIcon,
    }).addTo(map)

    marker.on('dragend', async () => {
      const { lat, lng } = marker.getLatLng()
      await applyLocation({ lat, lng })
    })

    mapRef.current = map
    markerRef.current = marker

    requestAnimationFrame(() => map.invalidateSize())

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [showPreview])

  useEffect(() => {
    if (!showPreview || !mapRef.current || !markerRef.current || !currentLocation) return
    markerRef.current.setLatLng([currentLocation.lat, currentLocation.lng])
    mapRef.current.setView([currentLocation.lat, currentLocation.lng], 16, { animate: true })
  }, [currentLocation, showPreview])

  function buildInternalMapsLink(location) {
    const normalized = normalizeLocation(location)
    if (!normalized) return googleMapsLink || null
    return buildGoogleMapsLink(normalized.lat, normalized.lng)
  }

  async function applyLocation(location) {
    const normalized = normalizeLocation(location)
    if (!normalized) return

    setError('')
    let nextAddress = addressInput

    setIsResolving(true)
    try {
      nextAddress = await reverseGeocode(normalized.lat, normalized.lng)
      setAddressInput(nextAddress)
    } catch (resolveError) {
      setError(resolveError.message || 'No se pudo obtener la dirección escrita.')
    } finally {
      setIsResolving(false)
    }

    onChange?.({
      geoLat: normalized.lat,
      geoLng: normalized.lng,
      googleMapsLink: buildInternalMapsLink(normalized),
      fullAddress: nextAddress,
    })
  }

  async function handleUseCurrentLocation() {
    setError('')
    setIsLocating(true)
    try {
      const location = await getCurrentPosition()
      setShowPreview(true)
      await applyLocation(location)
    } catch (locateError) {
      setError(locateError.message || 'No se pudo usar tu ubicación actual.')
    } finally {
      setIsLocating(false)
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

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={disabled || isLocating}
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          <Crosshair className="h-3.5 w-3.5" />
          {isLocating ? 'Obteniendo ubicación…' : 'Usar mi ubicación actual'}
        </button>
        <button
          type="button"
          onClick={() => setShowPreview((prev) => !prev)}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {showPreview ? 'Ocultar vista previa' : 'Ver vista previa en mapa'}
        </button>
      </div>

      {showPreview && (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div ref={mapContainerRef} className="h-56 w-full" />
          <p className="border-t bg-gray-50 px-3 py-2 text-xs text-gray-500">
            Arrastra el pin si la ubicación no es correcta y guarda la dirección.
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm text-gray-600">Dirección completa *</label>
        <textarea
          value={addressInput}
          onChange={handleAddressChange}
          rows={3}
          disabled={disabled || isResolving}
          placeholder="Se completará automáticamente al fijar la ubicación. Puedes editarla si hace falta."
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none disabled:bg-gray-100"
        />
        {isResolving && (
          <p className="mt-1 text-xs text-gray-500">Obteniendo dirección escrita…</p>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
