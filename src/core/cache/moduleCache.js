import { clearCacheBlob, loadCacheBlob, saveCacheBlob } from './idbStorage.js'

const entries = new Map()
const listeners = new Set()
let version = 0
let hydratePromise = null
let persistTimer = null

function buildStoreKey(namespace, key) {
  return `${namespace}::${key}`
}

function notifyListeners() {
  version += 1
  listeners.forEach((listener) => listener())
}

function schedulePersist() {
  if (typeof window === 'undefined') return

  window.clearTimeout(persistTimer)
  persistTimer = window.setTimeout(() => {
    persistTimer = null
    void flushToIndexedDB()
  }, 400)
}

async function flushToIndexedDB() {
  const blob = Object.fromEntries(entries)
  await saveCacheBlob(blob)
}

export function getCacheEntry(namespace, key) {
  return entries.get(buildStoreKey(namespace, key)) ?? null
}

export function setCacheEntry(namespace, key, value) {
  entries.set(buildStoreKey(namespace, key), {
    ...value,
    fetchedAt: Date.now(),
  })
  notifyListeners()
  schedulePersist()
}

export function deleteCacheEntry(namespace, key) {
  const storeKey = buildStoreKey(namespace, key)
  if (!entries.has(storeKey)) return
  entries.delete(storeKey)
  notifyListeners()
  schedulePersist()
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
    notifyListeners()
    schedulePersist()
  }
}

export function clearAllModuleCache() {
  entries.clear()
  notifyListeners()
  void clearCacheBlob()
}

export async function resetPersistentCache() {
  entries.clear()
  notifyListeners()
  await clearCacheBlob()
  hydratePromise = null
}

export function getModuleCacheVersion() {
  return version
}

export function subscribeModuleCache(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function seedEntry(namespace, key, value) {
  const storeKey = buildStoreKey(namespace, key)
  if (entries.has(storeKey)) return

  entries.set(storeKey, {
    ...value,
    fetchedAt: value.fetchedAt ?? Date.now(),
  })
}

const EXPECTED_BOOTSTRAP_VERSION = 2

function applyBootstrapPayload(payload) {
  if (!payload || !Array.isArray(payload.entries)) return
  if ((payload.version ?? 1) < EXPECTED_BOOTSTRAP_VERSION) return

  for (const entry of payload.entries) {
    if (!entry?.namespace || entry.key == null || !entry.value) continue
    seedEntry(entry.namespace, entry.key, entry.value)
  }
}

async function loadBootstrapPayload() {
  if (typeof window === 'undefined') return null

  if (window.__INITIAL_STATE__?.entries) {
    return window.__INITIAL_STATE__
  }

  try {
    const response = await fetch('/bootstrap/store-cache.json', {
      cache: 'no-cache',
    })

    if (!response.ok) return null

    return await response.json()
  } catch {
    return null
  }
}

export async function initPersistentCache({ bootstrap = true } = {}) {
  if (hydratePromise) return hydratePromise

  hydratePromise = (async () => {
    const stored = await loadCacheBlob()

    for (const [storeKey, value] of Object.entries(stored)) {
      if (value && typeof value === 'object') {
        entries.set(storeKey, value)
      }
    }

    if (bootstrap) {
      const payload = await loadBootstrapPayload()
      applyBootstrapPayload(payload)
    }

    notifyListeners()
  })()

  return hydratePromise
}

export function isPersistentCacheReady() {
  return hydratePromise !== null
}
