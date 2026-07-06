import { Link } from 'react-router-dom'

const HOME_HERO_IMAGE = '/Images/Inicio/index.png'

export default function HomeHero() {
  return (
    <section className="relative w-full max-md:bg-stone-100">
      <div className="hero-banner-enter relative w-full overflow-hidden max-md:aspect-[4/5] max-md:max-h-[88vh] md:aspect-auto">
        <img
          src={HOME_HERO_IMAGE}
          alt=""
          className="home-hero-img pointer-events-none absolute inset-0 h-full w-full object-cover md:relative md:block md:max-h-[85vh] md:w-full md:object-[58%_center]"
          loading="eager"
          decoding="async"
        />

        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-24 bg-gradient-to-b from-black/40 to-transparent md:hidden"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[38%] bg-gradient-to-t from-white/85 via-white/35 to-transparent md:hidden"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 hidden bg-gradient-to-t from-black/80 via-black/25 to-black/10 md:block md:from-black/75 md:via-black/20 md:to-transparent"
          aria-hidden="true"
        />

        <div className="hero-banner-content-enter pointer-events-auto absolute inset-x-0 bottom-0 z-10 px-6 pb-10 text-center md:hidden">
          <h1 className="font-nav mx-auto max-w-[16rem] text-xl font-semibold uppercase leading-snug tracking-[0.08em] text-gray-900 sm:max-w-xs sm:text-2xl">
            Tu fragancia perfecta te espera
          </h1>
          <Link
            to="/catalogo"
            className="btn-fill mt-5 inline-flex px-7 py-2.5 text-[10px] sm:text-xs"
          >
            Ir al catálogo
          </Link>
        </div>

        <div className="hero-banner-content-enter pointer-events-auto absolute inset-x-0 bottom-0 z-10 hidden px-6 pb-10 sm:px-10 sm:pb-14 md:block md:px-16 md:pb-20 lg:px-20 lg:pb-24">
          <div className="max-w-xl text-left">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/75 sm:text-xs">
              Balenzi Perfumes
            </p>
            <h1 className="font-nav mt-3 text-2xl font-semibold uppercase leading-tight tracking-[0.1em] text-white sm:text-3xl md:text-4xl lg:text-5xl">
              Tu fragancia perfecta te espera
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/85 sm:text-base">
              Perfumes originales seleccionados con cuidado. Envíos en Lima y atención personalizada
              para ayudarte a elegir tu aroma ideal.
            </p>
            <Link
              to="/catalogo"
              className="btn-fill-light mt-6 inline-flex px-8 py-3 text-[10px] sm:text-xs"
            >
              Ir al catálogo
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
