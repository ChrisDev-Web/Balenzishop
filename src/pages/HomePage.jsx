import { Link } from 'react-router-dom'
import { Sparkles, Truck, ShieldCheck, Award } from 'lucide-react'
import HomeHero from '../components/home/HomeHero'
import { FEATURED_LATTafa_PRODUCTS } from '../data/sectionHeroes'
import { productLink } from '../utils/productUtils'

const FEATURES = [
  {
    icon: Sparkles,
    title: '100% Originales',
    desc: 'Fragancias auténticas de marcas reconocidas en todo el mundo.',
  },
  {
    icon: Truck,
    title: 'Envíos en Lima',
    desc: 'Delivery y recojo con cobertura en las principales zonas de la ciudad.',
  },
  {
    icon: ShieldCheck,
    title: 'Compra segura',
    desc: 'Pedidos por WhatsApp con confirmación clara y atención directa.',
  },
  {
    icon: Award,
    title: 'Asesoría experta',
    desc: 'Te orientamos para encontrar el perfume ideal para ti o para regalar.',
  },
]

const spotlightProduct = FEATURED_LATTafa_PRODUCTS.find((p) => p.id === 1002)

export default function HomePage() {
  return (
    <div className="-mt-[var(--navbar-height)]">
      <HomeHero />

      <section className="border-t border-gray-200 bg-stone-50 py-16 md:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
          <div className="text-left">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-500 sm:text-xs">
              Nuestra esencia
            </p>
            <h2 className="font-nav mt-4 text-2xl font-semibold uppercase leading-tight tracking-[0.12em] text-gray-900 md:text-3xl lg:text-4xl">
              Sobre Balenzi Perfumes
            </h2>
            <div className="mt-6 h-px w-14 bg-gray-900" aria-hidden="true" />
            <div className="mt-8 space-y-5 text-sm leading-relaxed text-gray-600 sm:text-[15px] sm:leading-7">
              <p>
                Somos una tienda especializada en perfumería de alta calidad. Seleccionamos fragancias
                originales para mujer y hombre, con foco en marcas de tendencia como Lattafa y otras
                referencias premium del mercado.
              </p>
              <p>
                En Balenzi Perfumes creemos que una buena esencia complementa tu estilo y cuenta tu
                historia sin palabras. Curamos cada producto de nuestro catálogo y te acompañamos con
                asesoría personalizada en cada compra.
              </p>
              <p>
                Desde aromas suaves para el día hasta fragancias intensas para ocasiones especiales,
                aquí encontrarás opciones para ti o para regalar. Estamos en Lima, Perú, con envíos
                a todo el país.
              </p>
            </div>
            <Link
              to="/catalogo"
              className="btn-fill mt-10 inline-flex px-8 py-3 text-[10px] sm:text-xs"
            >
              Explorar catálogo
            </Link>
          </div>

          {spotlightProduct && (
            <Link
              to={productLink(spotlightProduct.id)}
              className="group relative block overflow-hidden border border-gray-200 bg-white shadow-sm transition duration-500 hover:border-gray-900 hover:shadow-md"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-b from-stone-100 to-stone-50 sm:aspect-[5/6]">
                <img
                  src={spotlightProduct.image}
                  alt={spotlightProduct.name}
                  className="h-full w-full object-cover object-center transition duration-700 group-hover:scale-[1.03]"
                  loading="lazy"
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-80"
                  aria-hidden="true"
                />
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-gray-200 px-6 py-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                    Destacado
                  </p>
                  <p className="font-nav mt-1 text-sm uppercase tracking-[0.1em] text-gray-900 sm:text-base">
                    {spotlightProduct.name}
                  </p>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-900 transition group-hover:underline sm:text-xs">
                  Ver producto
                </span>
              </div>
            </Link>
          )}
        </div>
      </section>

      <section className="border-t border-gray-200 bg-white py-14 md:py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8 lg:px-8">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <article
              key={title}
              className="flex flex-col items-center border border-gray-200 bg-white px-5 py-8 text-center"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-900">
                <Icon className="h-5 w-5 text-gray-900" strokeWidth={1.5} />
              </div>
              <h3 className="font-nav mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-gray-900">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">{desc}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
