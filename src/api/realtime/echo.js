import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

let echoInstance = null

export function getStoreEcho() {
  if (echoInstance) return echoInstance

  const key = import.meta.env.VITE_REVERB_APP_KEY
  if (!key) return null

  window.Pusher = Pusher

  const scheme = import.meta.env.VITE_REVERB_SCHEME || 'http'
  const port = Number(import.meta.env.VITE_REVERB_PORT || (scheme === 'https' ? 443 : 8080))

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key,
    wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
    wsPort: port,
    wssPort: port,
    forceTLS: scheme === 'https',
    enabledTransports: ['ws', 'wss'],
  })

  return echoInstance
}

export function disconnectStoreEcho() {
  if (!echoInstance) return

  echoInstance.disconnect()
  echoInstance = null
}

export const RAINAU_DELIVERY_AVAILABILITY_CHANNEL = 'rainau-delivery-availability'
export const RAINAU_DELIVERY_AVAILABILITY_EVENT = '.availability.updated'
