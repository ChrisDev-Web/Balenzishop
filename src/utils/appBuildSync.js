const BUILD_MARKER_KEY = 'balenzi-store-build-marker'

function extractIndexScriptPath(html) {
  const match = html.match(/src="([^"]+\/assets\/index-[^"]+\.js)"/)
  return match?.[1] ?? null
}

function normalizeAssetPath(path) {
  if (!path) return ''

  try {
    return new URL(path, window.location.origin).pathname
  } catch {
    return path
  }
}

export async function syncAppBuildIfStale() {
  if (import.meta.env.DEV || typeof window === 'undefined') {
    return
  }

  try {
    const response = await fetch(`${import.meta.env.BASE_URL || '/'}index.html`, {
      cache: 'no-store',
    })

    if (!response.ok) return

    const latestPath = normalizeAssetPath(extractIndexScriptPath(await response.text()))
    const currentScript = document.querySelector('script[type="module"][src*="/assets/index-"]')
    const currentPath = normalizeAssetPath(currentScript?.getAttribute('src') ?? '')

    if (!latestPath || !currentPath) return

    if (latestPath !== currentPath) {
      sessionStorage.setItem(BUILD_MARKER_KEY, latestPath)
      window.location.reload()
    } else {
      sessionStorage.setItem(BUILD_MARKER_KEY, currentPath)
    }
  } catch {
    // ignore network errors
  }
}
