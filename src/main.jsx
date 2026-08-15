import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initPersistentCache, resetPersistentCache } from './core/cache/moduleCache'
import { clearUserSessionsCache } from './utils/clearUserSessions'
import { preconnectMediaOrigin } from './utils/mediaUrl'
import { syncCheckoutLegalViewFromUrl } from './utils/checkoutReservationGuard'

syncCheckoutLegalViewFromUrl()
preconnectMediaOrigin()

const SESSIONS_RESET_KEY = 'balenzi-sessions-reset'
const SESSIONS_RESET_VERSION = '2026-07-08-api'
const APP_CACHE_VERSION_KEY = 'balenzi-store-cache-version'
const APP_CACHE_VERSION = '2026-08-14-catalog-sort-ml-v2'

if (localStorage.getItem(SESSIONS_RESET_KEY) !== SESSIONS_RESET_VERSION) {
  clearUserSessionsCache()
  localStorage.setItem(SESSIONS_RESET_KEY, SESSIONS_RESET_VERSION)
}

async function bootstrapApp() {
  if (localStorage.getItem(APP_CACHE_VERSION_KEY) !== APP_CACHE_VERSION) {
    await resetPersistentCache()
    localStorage.setItem(APP_CACHE_VERSION_KEY, APP_CACHE_VERSION)
  }

  await initPersistentCache()

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <div className="flex min-h-dvh flex-1 flex-col">
        <App />
      </div>
    </StrictMode>,
  )
}

bootstrapApp()
