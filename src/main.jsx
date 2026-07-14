import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'
import { clearUserSessionsCache } from './utils/clearUserSessions'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const SESSIONS_RESET_KEY = 'balenzi-sessions-reset'
const SESSIONS_RESET_VERSION = '2026-07-08-api'

if (localStorage.getItem(SESSIONS_RESET_KEY) !== SESSIONS_RESET_VERSION) {
  clearUserSessionsCache()
  localStorage.setItem(SESSIONS_RESET_KEY, SESSIONS_RESET_VERSION)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <div className="flex min-h-dvh flex-1 flex-col">
      <GoogleOAuthProvider clientId={googleClientId}>
        <App />
      </GoogleOAuthProvider>
    </div>
  </StrictMode>,
)
