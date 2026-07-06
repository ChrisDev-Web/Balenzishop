import { Sparkles, Truck, Headphones } from 'lucide-react'

const badges = [
  {
    icon: Sparkles,
    title: '100% Originales',
    lines: ['Solo fragancias auténticas.', 'Distribución oficial y comprobada.'],
  },
  {
    icon: Truck,
    title: 'Envíos a todo el Perú',
    lines: ['Sigue tu compra hasta que llegue a tus manos.'],
  },
  {
    icon: Headphones,
    title: 'Atención personalizada',
    lines: ['Te asesoramos para encontrar tu aroma ideal.'],
  },
]

export default function TrustBadges() {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white px-4 py-8 md:px-8">
      <div className="grid gap-8 md:grid-cols-3">
        {badges.map(({ icon: Icon, title, lines }) => (
          <div key={title} className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
              <Icon className="h-6 w-6 text-gray-800" strokeWidth={1.5} />
            </div>
            <h3 className="mt-3 text-sm font-bold uppercase tracking-wide text-gray-900">{title}</h3>
            {lines.map((line) => (
              <p key={line} className="mt-1 text-sm text-gray-600">{line}</p>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
