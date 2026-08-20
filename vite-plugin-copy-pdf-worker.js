import { copyFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

export function copyPdfWorker() {
  const src = resolve('node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs')
  const destDir = resolve('public/pdfjs')
  const dest = resolve(destDir, 'pdf.worker.min.js')

  function syncWorker() {
    mkdirSync(destDir, { recursive: true })
    copyFileSync(src, dest)
  }

  return {
    name: 'copy-pdf-worker',
    buildStart: syncWorker,
    configureServer() {
      syncWorker()
    },
  }
}
