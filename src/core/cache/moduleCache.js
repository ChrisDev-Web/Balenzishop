const entries = new Map()
const listeners = new Set()
let version = 0

function buildStoreKey(namespace, key) {
  return `${namespace}::${key}`
}

export function getCacheEntry(namespace, key) {
  return entries.get(buildStoreKey(namespace, key)) ?? null
}

export function setCacheEntry(namespace, key, value) {
  entries.set(buildStoreKey(namespace, key), {
    ...value,
    fetchedAt: Date.now(),
  })
  version += 1
  listeners.forEach((listener) => listener())
}

export function deleteCacheEntry(namespace, key) {
  const storeKey = buildStoreKey(namespace, key)
  if (!entries.has(storeKey)) return
  entries.delete(storeKey)
  version += 1
  listeners.forEach((listener) => listener())
}

export function clearCacheNamespace(namespace, keyPrefix = '') {
  const prefix = `${namespace}::${keyPrefix}`
  let changed = false

  for (const storeKey of entries.keys()) {
    if (storeKey.startsWith(prefix)) {
      entries.delete(storeKey)
      changed = true
    }
  }

  if (changed) {
    version += 1
    listeners.forEach((listener) => listener())
  }
}

export function clearAllModuleCache() {
  if (entries.size === 0) return
  entries.clear()
  version += 1
  listeners.forEach((listener) => listener())
}

export function getModuleCacheVersion() {
  return version
}

export function subscribeModuleCache(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
