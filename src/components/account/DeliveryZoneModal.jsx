import { X, MapPin, Loader2 } from 'lucide-react'
import { RAINAU_MAP_URL } from '../../data/rainauCoverage'

export default function DeliveryZoneModal({ onSelect, onClose, loading, error }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={loading ? undefined : onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delivery-zone-title"
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        {!loading && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-light text-brand">
            <MapPin className="h-5 w-5" />
          </span>
          <div>
            <h2 id="delivery-zone-title" className="text-lg font-bold text-gray-900">
              ¿Desea envíos a Lima o provincia?
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Usaremos su ubicación para sugerir el Shalon más cercano
            </p>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 flex flex-col items-center gap-3 py-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
            <p className="text-sm text-gray-600">Obteniendo su ubicación…</p>
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => onSelect('lima')}
                className="rounded-xl border-2 border-gray-200 px-4 py-4 text-left transition hover:border-brand hover:bg-brand-light/40"
              >
                <p className="font-semibold text-gray-900">Lima</p>
                <p className="mt-1 text-xs text-gray-500">
                  Delivery Rainau + recojo en Shalon
                </p>
              </button>
              <button
                type="button"
                onClick={() => onSelect('provincia')}
                className="rounded-xl border-2 border-gray-200 px-4 py-4 text-left transition hover:border-brand hover:bg-brand-light/40"
              >
                <p className="font-semibold text-gray-900">Provincia</p>
                <p className="mt-1 text-xs text-gray-500">
                  Shalon más cercano en su departamento
                </p>
              </button>
            </div>

            {error && (
              <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{error}</p>
            )}

            <p className="mt-4 text-center text-xs text-gray-400">
              Al continuar se solicitará permiso de ubicación en su dispositivo
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export function CoverageBanner({ coverage, showMapLink = true, onOverrideZone }) {
  if (!coverage) return null

  return (
    <div className={`mt-4 rounded-lg border px-4 py-3 ${coverage.className}`}>
      <div className="flex items-start gap-3">
        <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${coverage.dotClass}`} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{coverage.title}</p>
          <p className="mt-1 text-sm leading-relaxed">{coverage.message}</p>
          {coverage.district && (
            <p className="mt-1 text-xs opacity-80">Distrito detectado: {coverage.district}</p>
          )}
          <p className="mt-1.5 text-xs opacity-70">
            ⚠️ Esta zona es aproximada. Verifica tu calle exacta en el mapa Rainau.
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            {showMapLink && (
              <a
                href={RAINAU_MAP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold underline hover:no-underline"
              >
                Ver mapa de cobertura Rainau →
              </a>
            )}
            {onOverrideZone && (
              <button
                type="button"
                onClick={onOverrideZone}
                className="text-xs font-semibold underline hover:no-underline"
              >
                Corregir mi zona manualmente
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ZoneOverrideModal({ onSelect, onClose }) {
  const zones = [
    {
      key: 'green',
      label: 'Verde claro',
      desc: 'Lunes a sábado · S/ 10',
      dot: 'bg-green-400',
    },
    {
      key: 'green_dark',
      label: 'Verde oscuro',
      desc: 'Lunes a sábado · S/ 15',
      dot: 'bg-green-700',
    },
    {
      key: 'blue',
      label: 'Azul',
      desc: 'Martes, jueves y sábados · S/ 15',
      dot: 'bg-blue-500',
    },
    {
      key: 'red',
      label: 'Rojo (sin delivery)',
      desc: 'Sin cobertura · Recojo Shalon (con cargo)',
      dot: 'bg-red-500',
    },
  ]

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-base font-bold text-gray-900">
          ¿En qué zona está tu dirección?
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          Consulta el{' '}
          <a href={RAINAU_MAP_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand underline">
            mapa Rainau
          </a>{' '}
          y haz clic en tu calle para ver el color exacto.
        </p>
        <div className="mt-4 space-y-2">
          {zones.map((z) => (
            <button
              key={z.key}
              type="button"
              onClick={() => onSelect(z.key)}
              className="flex w-full items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-left hover:bg-gray-50"
            >
              <span className={`h-3 w-3 shrink-0 rounded-full ${z.dot}`} />
              <div>
                <p className="text-sm font-semibold text-gray-900">{z.label}</p>
                <p className="text-xs text-gray-500">{z.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
