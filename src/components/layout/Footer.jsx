import { MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCompanyStore } from '../../stores/companyStore'
import {
  DEFAULT_COMPANY_NAME,
  DEFAULT_NAVBAR_LOGO,
  buildWhatsAppUrl,
  extractSocialHandle,
  formatWhatsAppDisplay,
} from '../../utils/companyBranding'
import { markCheckoutLegalView } from '../../utils/checkoutReservationStorage'
import { isCheckoutReservationExemptPath } from '../../utils/checkoutReservationGuard'

const LEGAL_LINKS = [
  { label: 'Términos y condiciones', to: '/terminos-y-condiciones' },
  { label: 'Política de privacidad', to: '/politica-de-privacidad' },
]

const STORE_LINKS = [
  { label: 'Inicio', to: '/' },
  { label: 'Mujeres', to: '/mujeres' },
  { label: 'Hombres', to: '/hombres' },
  { label: 'Promociones', to: '/promociones' },
  { label: 'Catálogo', to: '/catalogo' },
]

const ACCOUNT_LINKS = [
  { label: 'Mi cuenta', to: '/mi-cuenta' },
  { label: 'Mis pedidos', to: '/mi-cuenta/pedidos' },
  { label: 'Mis direcciones', to: '/mi-cuenta/direcciones' },
  { label: 'Finalizar compra', to: '/pedido' },
]

const FALLBACK_SOCIAL = {
  instagram: 'https://www.instagram.com/balenzi_perfumes?igsh=MWd2b3pub3RhZmdheA%3D%3D&utm_source=qr',
  tiktok: 'https://www.tiktok.com/@balenzishop?_r=1&_t=ZS-97VorcZVhVh',
  communityWhatsapp: 'https://chat.whatsapp.com/Egl2f1pw2arBH9FY6DztwD?mode=gi_t',
  whatsappDisplay: '924 341 477',
}

function InstagramIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

function TikTokIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
    </svg>
  )
}

function markLegalNavigation(path) {
  if (isCheckoutReservationExemptPath(path)) {
    markCheckoutLegalView()
  }
}

function FooterLink({ link }) {
  const className =
    'text-sm text-white/65 transition-colors duration-200 hover:text-white'

  if (link.href) {
    const external = link.href.startsWith('http')
    return (
      <a
        href={link.href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className={className}
      >
        {link.label}
      </a>
    )
  }

  return (
    <Link
      to={link.to}
      className={className}
      onMouseDown={() => markLegalNavigation(link.to)}
      onClick={() => markLegalNavigation(link.to)}
    >
      {link.label}
    </Link>
  )
}

function SocialButton({ href, label, children }) {
  if (!href) return null

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/80 transition hover:border-white hover:bg-white hover:text-black"
    >
      {children}
    </a>
  )
}

function buildContactLinks(company) {
  const whatsappDisplay = formatWhatsAppDisplay(company?.whatsapp) ?? FALLBACK_SOCIAL.whatsappDisplay
  const whatsappUrl = buildWhatsAppUrl(company?.whatsapp)
  const instagramUrl = company?.instagram || FALLBACK_SOCIAL.instagram
  const tiktokUrl = company?.tiktok || FALLBACK_SOCIAL.tiktok
  const communityUrl = company?.community_whatsapp || FALLBACK_SOCIAL.communityWhatsapp

  const links = [
    { label: `WhatsApp · ${whatsappDisplay}`, href: whatsappUrl },
  ]

  if (communityUrl) {
    links.push({ label: 'Comunidad Balenzishop', href: communityUrl })
  }

  if (instagramUrl) {
    links.push({
      label: `Instagram · ${extractSocialHandle(instagramUrl, '@balenzi_perfumes')}`,
      href: instagramUrl,
    })
  }

  if (tiktokUrl) {
    links.push({
      label: `TikTok · ${extractSocialHandle(tiktokUrl, '@balenzishop')}`,
      href: tiktokUrl,
    })
  }

  return links
}

export default function Footer() {
  const company = useCompanyStore((s) => s.company)
  const logoUrl = company?.logo || DEFAULT_NAVBAR_LOGO
  const companyName = company?.name || DEFAULT_COMPANY_NAME
  const whatsappUrl = buildWhatsAppUrl(company?.whatsapp)
  const contactLinks = buildContactLinks(company)

  const footerSections = [
    { title: 'Tienda', links: STORE_LINKS },
    { title: 'Mi cuenta', links: ACCOUNT_LINKS },
    { title: 'Contacto', links: contactLinks },
    { title: 'Legal', links: LEGAL_LINKS },
  ]

  return (
    <footer className="mt-auto bg-[#0a0a0a] text-white">
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-10 md:py-14 lg:px-8">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
            <div className="flex flex-col items-center text-center lg:max-w-xs lg:items-start lg:text-left">
              <Link to="/" className="-my-1 inline-block">
                <img
                  src={logoUrl}
                  alt={companyName}
                  className="navbar-logo h-[4.75rem] w-auto object-contain md:h-[5.5rem]"
                />
              </Link>
              <p className="mt-2 text-sm leading-snug text-white/55">
                Tu destino premium para fragancias exclusivas. Perfumes originales de las mejores
                casas del mundo, con envío en Lima y todo el Perú.
              </p>
              <div className="mt-3.5 flex items-center gap-3">
                <SocialButton
                  href={company?.instagram || FALLBACK_SOCIAL.instagram}
                  label="Instagram de Balenzi"
                >
                  <InstagramIcon className="h-4 w-4" />
                </SocialButton>
                <SocialButton
                  href={company?.tiktok || FALLBACK_SOCIAL.tiktok}
                  label="TikTok de Balenzi"
                >
                  <TikTokIcon className="h-3.5 w-3.5" />
                </SocialButton>
                <SocialButton href={whatsappUrl} label="WhatsApp de Balenzi">
                  <MessageCircle className="h-4 w-4" />
                </SocialButton>
              </div>
            </div>

            <div className="grid w-full gap-10 sm:grid-cols-2 lg:w-auto lg:grid-cols-4 lg:gap-14">
              {footerSections.map((section) => (
                <div key={section.title} className="text-center sm:text-left">
                  <h3 className="font-nav text-xs font-semibold uppercase tracking-[0.22em] text-white">
                    {section.title}
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {section.links.map((link) => (
                      <li key={link.label}>
                        <FooterLink link={link} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-white/10 bg-white/[0.03]">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 py-7 text-center sm:flex-row sm:justify-between sm:text-left lg:px-8">
          <p className="text-xs uppercase tracking-[0.18em] text-white/50">
            ¿Dudas sobre tu pedido o envío?
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-fill-light inline-flex px-7 py-2.5 text-[10px] sm:text-xs"
          >
            Escríbenos por WhatsApp
          </a>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-6 py-6 text-center text-[11px] text-white/35 sm:flex-row sm:justify-between lg:px-8">
        <p>© {new Date().getFullYear()} {companyName}. Todos los derechos reservados.</p>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:justify-end">
          <Link
            to="/terminos-y-condiciones"
            className="transition-colors hover:text-white/70"
            onMouseDown={() => markLegalNavigation('/terminos-y-condiciones')}
            onClick={() => markLegalNavigation('/terminos-y-condiciones')}
          >
            Términos y condiciones
          </Link>
          <Link
            to="/politica-de-privacidad"
            className="transition-colors hover:text-white/70"
            onMouseDown={() => markLegalNavigation('/politica-de-privacidad')}
            onClick={() => markLegalNavigation('/politica-de-privacidad')}
          >
            Política de privacidad
          </Link>
          <span className="hidden text-white/20 sm:inline" aria-hidden="true">
            ·
          </span>
          <p className="tracking-wide">Lima, Perú · Envíos a todo el país</p>
        </div>
      </div>
    </footer>
  )
}
