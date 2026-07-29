const loadedUrls = new Set()

export function isImageLoaded(url) {
  return Boolean(url && loadedUrls.has(url))
}

export function markImageLoaded(url) {
  if (url) {
    loadedUrls.add(url)
  }
}

export function unmarkImageLoaded(url) {
  if (url) {
    loadedUrls.delete(url)
  }
}
