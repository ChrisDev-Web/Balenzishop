import { Clock3, Wrench } from 'lucide-react'

export default function MaintenancePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#fafafa] text-neutral-900">
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div
          className="mb-10 flex h-28 w-28 items-center justify-center rounded-full bg-brand-light sm:h-32 sm:w-32"
          aria-hidden
        >
          <Wrench
            size={64}
            strokeWidth={1.5}
            className="text-brand sm:h-[72px] sm:w-[72px]"
          />
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
          Balenzi
        </p>

        <h1 className="mt-3 font-nav text-3xl font-semibold leading-tight text-neutral-900 sm:text-4xl">
          Estamos en mantenimiento
        </h1>

        <p className="mt-5 max-w-md text-[15px] leading-7 text-neutral-600">
          Muy pronto podrás disfrutar de nuestro catálogo web con fragancias seleccionadas
          y una experiencia pensada para ti. Estamos preparando algo especial para ti.
        </p>

        <div className="mt-10 inline-flex items-center gap-2.5 rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm text-neutral-600 shadow-sm">
          <Clock3 size={18} strokeWidth={1.75} className="shrink-0 text-brand" aria-hidden />
          <span>Volvemos en breve. Gracias por tu paciencia.</span>
        </div>
      </main>

      <footer className="border-t border-neutral-200 bg-white py-6 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} Balenzishop. Todos los derechos reservados.
      </footer>
    </div>
  )
}
