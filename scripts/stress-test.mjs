/**
 * Simula 50 usuarios concurrentes contra el preview de producción.
 * Escenario: abrir inicio → catálogo → assets (JS/CSS) como un navegador real.
 */

const BASE = process.env.STRESS_URL || 'http://localhost:4173'
const USERS = 50
const ROUNDS = 3 // cada usuario repite el flujo N veces

const ROUTES = [
  '/',
  '/catalogo',
  '/mujeres',
  '/promociones',
  '/assets/index-DWq5oLM3.js',
  '/assets/index-CFa27J2M.css',
]

async function userSession(userId) {
  const results = { ok: 0, fail: 0, latencies: [], errors: [] }

  for (let round = 0; round < ROUNDS; round++) {
    for (const route of ROUTES) {
      const url = `${BASE}${route}`
      const start = performance.now()
      try {
        const res = await fetch(url, { headers: { 'Accept-Encoding': 'gzip' } })
        const elapsed = performance.now() - start
        results.latencies.push(elapsed)
        if (res.ok) results.ok++
        else {
          results.fail++
          results.errors.push(`${route} → HTTP ${res.status}`)
        }
        // Descargar cuerpo para medir transferencia real (como navegador)
        await res.arrayBuffer()
      } catch (err) {
        results.fail++
        results.latencies.push(performance.now() - start)
        results.errors.push(`${route} → ${err.message}`)
      }
    }
  }

  return results
}

function percentile(arr, p) {
  if (!arr.length) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, idx)]
}

function avg(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
}

console.log(`\n🔥 Stress test BalenziShop`)
console.log(`   URL: ${BASE}`)
console.log(`   Usuarios concurrentes: ${USERS}`)
console.log(`   Flujo por usuario: ${ROUTES.length} rutas × ${ROUNDS} rondas\n`)

const wallStart = performance.now()

const sessions = await Promise.all(
  Array.from({ length: USERS }, (_, i) => userSession(i + 1)),
)

const wallMs = performance.now() - wallStart

const allLatencies = sessions.flatMap((s) => s.latencies)
const totalOk = sessions.reduce((a, s) => a + s.ok, 0)
const totalFail = sessions.reduce((a, s) => a + s.fail, 0)
const totalReqs = totalOk + totalFail
const allErrors = sessions.flatMap((s) => s.errors)

const report = {
  users: USERS,
  totalRequests: totalReqs,
  successful: totalOk,
  failed: totalFail,
  successRate: ((totalOk / totalReqs) * 100).toFixed(2) + '%',
  wallTimeSec: (wallMs / 1000).toFixed(2),
  throughputRps: (totalReqs / (wallMs / 1000)).toFixed(1),
  latencyMs: {
    avg: avg(allLatencies).toFixed(1),
    p50: percentile(allLatencies, 50).toFixed(1),
    p95: percentile(allLatencies, 95).toFixed(1),
    p99: percentile(allLatencies, 99).toFixed(1),
    max: Math.max(...allLatencies).toFixed(1),
  },
  sampleErrors: [...new Set(allErrors)].slice(0, 5),
}

console.log(JSON.stringify(report, null, 2))
