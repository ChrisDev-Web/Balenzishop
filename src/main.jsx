import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { clearUserSessionsCache } from './utils/clearUserSessions'
import { preconnectMediaOrigin } from './utils/mediaUrl'

preconnectMediaOrigin()

const SESSIONS_RESET_KEY = 'balenzi-sessions-reset'
const SESSIONS_RESET_VERSION = '2026-07-08-api'

if (localStorage.getItem(SESSIONS_RESET_KEY) !== SESSIONS_RESET_VERSION) {
  clearUserSessionsCache()
  localStorage.setItem(SESSIONS_RESET_KEY, SESSIONS_RESET_VERSION)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <div className="flex min-h-dvh flex-1 flex-col">
      <App />
    </div>
  </StrictMode>,
)
