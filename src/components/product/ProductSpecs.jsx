import { useState } from 'react'

const TABS = {
  specs: 'specs',
  description: 'description',
}

export default function ProductSpecs({ specs, description = '' }) {
  const [activeTab, setActiveTab] = useState(TABS.specs)
  const hasDescription = Boolean(description?.trim())

  return (
    <section className="mt-16 border-t border-gray-200 pt-10">
      <h2 className="text-center text-2xl font-bold text-gray-800">Sobre este producto</h2>

      <div className="mx-auto mt-8 max-w-3xl">
        <div className="flex items-center justify-center gap-8 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab(TABS.specs)}
            className={`pb-3 text-lg font-bold transition ${
              activeTab === TABS.specs
                ? 'border-b-2 border-black text-gray-900'
                : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            Especificaciones
          </button>
          <button
            type="button"
            onClick={() => setActiveTab(TABS.description)}
            className={`pb-3 text-lg font-bold transition ${
              activeTab === TABS.description
                ? 'border-b-2 border-black text-gray-900'
                : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            Descripción
          </button>
        </div>

        <div className="mt-8 text-center">
          {activeTab === TABS.specs ? (
            <dl className="mx-auto max-w-xl divide-y divide-gray-200 text-left">
              {specs.map(({ label, value }) => (
                <div key={label} className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-2 sm:gap-4">
                  <dt className="text-sm font-bold text-gray-800">{label}</dt>
                  <dd className="text-sm text-gray-700">{value}</dd>
                </div>
              ))}
            </dl>
          ) : hasDescription ? (
            <p className="mx-auto max-w-2xl whitespace-pre-line text-sm leading-relaxed text-gray-700">
              {description}
            </p>
          ) : (
            <p className="text-sm text-gray-500">Sin descripción disponible.</p>
          )}
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          En caso algo no vaya como gustes, contáctanos y te ayudamos con cambios o devoluciones según nuestra política.
        </p>
      </div>
    </section>
  )
}
