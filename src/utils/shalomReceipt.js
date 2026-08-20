function sourceLooksLikePdf(value) {
  if (!value) return false
  const lower = String(value).toLowerCase()
  return lower.endsWith('.pdf') || lower.includes('.pdf?') || lower.includes('.pdf#')
}

export function isShalomReceiptPdf({ receiptIsPdf, receiptName, receiptUrl } = {}) {
  if (receiptIsPdf === true) return true

  return [receiptName, receiptUrl].some(sourceLooksLikePdf)
}

export function prefersNativePdfEmbed() {
  if (typeof window === 'undefined') return true

  const isMobileUa = /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry/i.test(navigator.userAgent)
  const isNarrowTouch = window.matchMedia('(max-width: 768px) and (pointer: coarse)').matches

  return !isMobileUa && !isNarrowTouch
}

export async function inspectShalomReceiptBlob(blob) {
  if (!(blob instanceof Blob) || blob.size === 0) {
    throw new Error('No se pudo cargar la boleta.')
  }

  const headerBytes = new Uint8Array(await blob.slice(0, 5).arrayBuffer())
  const header = String.fromCharCode(...headerBytes)

  if (header.startsWith('%PDF')) {
    return { kind: 'pdf', blob, mimeType: 'application/pdf' }
  }

  if (blob.type.startsWith('image/')) {
    return { kind: 'image', blob, mimeType: blob.type }
  }

  if (headerBytes[0] === 0xff && headerBytes[1] === 0xd8) {
    return { kind: 'image', blob, mimeType: 'image/jpeg' }
  }

  if (headerBytes[0] === 0x89 && headerBytes[1] === 0x50) {
    return { kind: 'image', blob, mimeType: 'image/png' }
  }

  if (blob.type.includes('json') || blob.size < 1024) {
    try {
      const text = await blob.text()
      const parsed = JSON.parse(text)
      throw new Error(parsed?.message || 'No se pudo cargar la boleta.')
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('No se pudo cargar la boleta PDF.')
      }
      throw error
    }
  }

  return { kind: 'pdf', blob, mimeType: blob.type || 'application/pdf' }
}
