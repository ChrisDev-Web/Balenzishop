import { useSyncExternalStore } from 'react'
import MaintenancePage from '../../pages/MaintenancePage.jsx'
import {
  hasMaintenanceBypass,
  isMaintenanceModeEnabled,
  processPreviewAccessFromUrl,
} from '../../utils/maintenanceAccess.js'

function subscribe(callback) {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

function getBypassSnapshot() {
  processPreviewAccessFromUrl()
  return hasMaintenanceBypass()
}

function getServerBypassSnapshot() {
  return !isMaintenanceModeEnabled()
}

export default function MaintenanceGate({ children }) {
  const allowed = useSyncExternalStore(
    subscribe,
    getBypassSnapshot,
    getServerBypassSnapshot,
  )

  if (isMaintenanceModeEnabled() && !allowed) {
    return <MaintenancePage />
  }

  return children
}
