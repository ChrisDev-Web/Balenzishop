import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

export function inlineStoreBootstrap() {
  return {
    name: 'inline-store-bootstrap',
    transformIndexHtml(html) {
      const bootstrapPath = join(process.cwd(), 'public', 'bootstrap', 'store-cache.json')

      if (!existsSync(bootstrapPath)) {
        return html
      }

      try {
        const raw = readFileSync(bootstrapPath, 'utf8')
        const payload = JSON.parse(raw)

        if (!Array.isArray(payload.entries) || payload.entries.length === 0) {
          return html
        }

        const serialized = JSON.stringify(payload).replace(/</g, '\\u003c')
        const script = `<script>window.__INITIAL_STATE__=${serialized}</script>`

        return html.replace('</head>', `${script}\n</head>`)
      } catch {
        return html
      }
    },
  }
}
