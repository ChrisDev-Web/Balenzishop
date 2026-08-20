const MAX_CANVAS_PIXELS = 16_777_216
const MAX_CANVAS_DIMENSION = 4096

let pdfjsModulePromise = null

async function configurePdfWorker(pdfjs) {
  pdfjs.GlobalWorkerOptions.workerSrc = `${import.meta.env.BASE_URL}pdfjs/pdf.worker.min.js`
}

export async function loadPdfJs() {
  if (!pdfjsModulePromise) {
    pdfjsModulePromise = (async () => {
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
      await configurePdfWorker(pdfjs)
      return pdfjs
    })()
  }

  return pdfjsModulePromise
}

export function computePageViewport(page, containerWidth, pixelRatio = 1) {
  const width = Math.max(containerWidth, 240)
  const baseViewport = page.getViewport({ scale: 1 })
  let displayScale = width / baseViewport.width
  const ratio = Math.max(pixelRatio, 1)

  displayScale = Math.min(
    displayScale,
    MAX_CANVAS_DIMENSION / ratio / baseViewport.width,
    MAX_CANVAS_DIMENSION / ratio / baseViewport.height,
  )

  const renderPixels = (
    baseViewport.width * displayScale * ratio
  ) * (
    baseViewport.height * displayScale * ratio
  )

  if (renderPixels > MAX_CANVAS_PIXELS) {
    const maxDisplayScale = Math.sqrt(
      MAX_CANVAS_PIXELS / (ratio * ratio * baseViewport.width * baseViewport.height),
    )
    displayScale = Math.min(displayScale, maxDisplayScale)
  }

  displayScale = Math.max(displayScale, 0.5)

  return {
    display: page.getViewport({ scale: displayScale }),
    render: page.getViewport({ scale: displayScale * ratio }),
  }
}

export async function openPdfFromBlob(getDocument, blob, blobUrl) {
  const data = await blob.arrayBuffer()
  const attempts = []

  if (blobUrl) {
    attempts.push(() => getDocument({
      url: blobUrl,
      disableRange: true,
      disableStream: true,
    }).promise)
  }

  attempts.push(() => getDocument({ data }).promise)

  let lastError = null

  for (const attempt of attempts) {
    try {
      return await attempt()
    } catch (error) {
      lastError = error
    }
  }

  throw lastError || new Error('No se pudo abrir el PDF.')
}

export async function renderPdfPages(pdf, hostNode, containerWidth) {
  let renderedPages = 0
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2.5)

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const { display, render } = computePageViewport(page, containerWidth, pixelRatio)
    const canvas = document.createElement('canvas')
    canvas.width = Math.floor(render.width)
    canvas.height = Math.floor(render.height)
    canvas.style.width = `${Math.floor(display.width)}px`
    canvas.style.height = `${Math.floor(display.height)}px`
    canvas.className = 'mx-auto block max-w-full rounded-lg bg-white'

    await page.render({ canvas, viewport: render }).promise

    if (pageNumber > 1) {
      const spacer = document.createElement('div')
      spacer.className = 'h-3'
      hostNode.appendChild(spacer)
    }

    hostNode.appendChild(canvas)
    renderedPages += 1
  }

  return renderedPages
}
