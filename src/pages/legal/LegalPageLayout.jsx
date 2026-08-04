import { Link } from 'react-router-dom'
import { useCompanyStore } from '../../stores/companyStore'
import { DEFAULT_COMPANY_NAME } from '../../utils/companyBranding'

export default function LegalPageLayout({ title, lastUpdated, children }) {
  const company = useCompanyStore((s) => s.company)
  const companyName = company?.name || DEFAULT_COMPANY_NAME

  return (
    <div className="bg-[#fafafa] py-10 md:py-14">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <nav className="mb-8 text-sm text-neutral-500">
          <Link to="/" className="transition-colors hover:text-neutral-900">
            Inicio
          </Link>
          <span className="mx-2 text-neutral-300">/</span>
          <span className="text-neutral-700">{title}</span>
        </nav>

        <header className="mb-10 border-b border-neutral-200 pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
            {companyName}
          </p>
          <h1 className="mt-3 font-nav text-3xl font-semibold text-neutral-900 md:text-4xl">
            {title}
          </h1>
          {lastUpdated && (
            <p className="mt-3 text-sm text-neutral-500">
              Última actualización: {lastUpdated}
            </p>
          )}
        </header>

        <article className="legal-prose space-y-8 text-[15px] leading-7 text-neutral-700">
          {children}
        </article>

        <footer className="mt-12 flex flex-wrap gap-4 border-t border-neutral-200 pt-8 text-sm">
          <Link to="/terminos-y-condiciones" className="text-neutral-600 hover:text-neutral-900">
            Términos y condiciones
          </Link>
          <Link to="/politica-de-privacidad" className="text-neutral-600 hover:text-neutral-900">
            Política de privacidad
          </Link>
        </footer>
      </div>
    </div>
  )
}

export function LegalSection({ title, children }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-neutral-900">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}
