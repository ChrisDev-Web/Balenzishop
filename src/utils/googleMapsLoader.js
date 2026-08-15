/** Estilo oscuro minimalista (similar a apps de delivery). */
export const GOOGLE_MAP_DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1a' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#4b5563' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1f2937' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2d3748' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1f2937' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#374151' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#4b5563' }] },
  { featureType: 'road.highway.controlled_access', elementType: 'geometry', stylers: [{ color: '#52525b' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#d1d5db' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
]

let loadPromise = null

export function getGoogleMapsApiKey() {
  return (import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '').trim()
}

export function hasGoogleMapsApiKey() {
  return Boolean(getGoogleMapsApiKey())
}

export function loadGoogleMapsApi() {
  const apiKey = getGoogleMapsApiKey()
  if (!apiKey) {
    return Promise.reject(new Error('Google Maps API key not configured'))
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google.maps)
  }

  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`
      script.async = true
      script.defer = true
      script.onload = () => {
        if (window.google?.maps) {
          resolve(window.google.maps)
          return
        }
        reject(new Error('Google Maps no se pudo cargar.'))
      }
      script.onerror = () => reject(new Error('No se pudo cargar el script de Google Maps.'))
      document.head.appendChild(script)
    })
  }

  return loadPromise
}
