export default function ProductSpecs({ specs }) {
  return (
    <section className="mt-16 border-t border-gray-200 pt-10">
      <h2 className="text-center text-2xl font-bold text-gray-800">Sobre este producto</h2>

      <div className="mx-auto mt-8 max-w-3xl">
        <h3 className="text-lg font-bold text-gray-900">Especificaciones</h3>
        <div className="mt-1 h-1 w-48 bg-black" />

        <dl className="mt-6 divide-y divide-gray-200">
          {specs.map(({ label, value }) => (
            <div key={label} className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-2 sm:gap-4">
              <dt className="text-sm font-bold text-gray-800">{label}</dt>
              <dd className="text-sm text-gray-700">{value}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-8 text-sm text-gray-500">
          En caso algo no vaya como gustes, contáctanos y te ayudamos con cambios o devoluciones según nuestra política.
        </p>
      </div>
    </section>
  )
}
