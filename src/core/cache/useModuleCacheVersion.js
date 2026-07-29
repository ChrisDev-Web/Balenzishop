import { useSyncExternalStore } from 'react'
import { getModuleCacheVersion, subscribeModuleCache } from './moduleCache'

export function useModuleCacheVersion() {
  return useSyncExternalStore(subscribeModuleCache, getModuleCacheVersion, getModuleCacheVersion)
}
