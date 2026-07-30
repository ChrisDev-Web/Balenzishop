import { createStore, del, get, set } from 'idb-keyval'

const CACHE_DB_KEY = 'module-cache-v1'
const cacheStore = createStore('balenzishop-store-cache', 'entries')

export async function loadCacheBlob() {
  const blob = await get(CACHE_DB_KEY, cacheStore)
  return blob && typeof blob === 'object' ? blob : {}
}

export async function saveCacheBlob(blob) {
  await set(CACHE_DB_KEY, blob, cacheStore)
}

export async function clearCacheBlob() {
  await del(CACHE_DB_KEY, cacheStore)
}
