import { Link } from 'react-router-dom'
import { productLink } from '../../utils/productUtils'

export default function CategoryHeroBanner({
  title,
  backgroundImage,
  productId,
  linkTo,
  raisedContent = false,
  compactImage = false,
  festiveMobileLayout = false,
  enterAnimation = false,
  mobileImagePositionClass = '',
}) {
  const href = linkTo ?? productLink(productId)

  const titleClass =
    'font-nav font-semibold uppercase tracking-[0.12em] text-white'

  const contentEnterClass = enterAnimation ? 'hero-banner-content-enter' : ''
  const mobileVerticalImage = compactImage || festiveMobileLayout

  const imageClassName = compactImage
    ? 'max-md:h-[68vh] max-md:object-cover max-md:object-[50%_38%] md:max-h-[96vh] md:object-cover md:object-center'
    : festiveMobileLayout
      ? `max-md:h-[74vh] max-md:object-cover md:h-auto ${
          mobileImagePositionClass || 'max-md:object-[62%_36%]'
        }`
      : 'h-auto'

  return (
    <section
      className={`relative w-full ${mobileVerticalImage ? 'max-md:bg-black' : ''} ${compactImage ? 'md:bg-black' : ''}`}
    >
      <div className={`relative w-full overflow-hidden ${enterAnimation ? 'hero-banner-enter' : ''}`}>
        <img
          src={backgroundImage}
          alt=""
          className={`pointer-events-none block w-full ${imageClassName}`}
          loading="lazy"
          decoding="async"
        />
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-t md:from-black/75 md:via-black/20 ${
            mobileVerticalImage
              ? 'from-black/85 via-black/10 to-transparent max-md:from-black/90 max-md:via-black/5'
              : 'from-black/80 via-black/15 to-transparent'
          }`}
          aria-hidden="true"
        />

        {/* Móvil — mujeres/hombres: solo botón con nombre */}
        {compactImage ? (
          <div className={`pointer-events-auto absolute inset-x-0 bottom-5 z-10 flex justify-center px-4 md:hidden ${contentEnterClass}`}>
            <Link
              to={href}
              className="btn-fill-light inline-flex max-w-[92%] px-4 py-2 text-center text-[9px] leading-snug tracking-[0.12em] sm:px-5 sm:py-2.5 sm:text-[10px]"
            >
              {title}
            </Link>
          </div>
        ) : festiveMobileLayout ? (
          <div
            className={`pointer-events-auto absolute inset-x-0 bottom-5 z-10 flex flex-col items-center gap-3 px-4 text-center md:hidden ${contentEnterClass}`}
          >
            <h2 className={`${titleClass} max-w-[92%] text-sm leading-snug sm:text-base`}>{title}</h2>
            <Link
              to={href}
              className="btn-fill-light inline-flex px-5 py-2 text-[10px] tracking-[0.14em] sm:px-6 sm:py-2.5 sm:text-xs"
            >
              Comprar
            </Link>
          </div>
        ) : (
          <div className={`pointer-events-auto absolute inset-x-0 bottom-[10%] z-10 flex flex-col items-center px-4 text-center md:hidden ${contentEnterClass}`}>
            <h2 className={`${titleClass} max-w-[90%] text-sm leading-snug sm:text-base`}>{title}</h2>
            <Link
              to={href}
              className="btn-fill-light mt-3 inline-flex px-5 py-2 text-[10px] tracking-[0.14em] sm:mt-3.5 sm:px-6 sm:py-2.5 sm:text-xs"
            >
              Comprar
            </Link>
          </div>
        )}

        {/* Escritorio: alineado a la izquierda */}
        <div
          className={`pointer-events-auto absolute inset-x-0 z-10 hidden w-full px-10 lg:px-16 md:block ${contentEnterClass} ${
            raisedContent
              ? 'bottom-[22%] md:bottom-[24%] lg:bottom-[26%]'
              : 'bottom-0 pb-16 lg:pb-20'
          }`}
        >
          <h2 className={`${titleClass} max-w-3xl text-3xl md:text-4xl lg:text-5xl`}>{title}</h2>
          <Link
            to={href}
            className={`btn-fill-light inline-flex px-8 py-3 text-sm ${raisedContent ? 'mt-4' : 'mt-6'}`}
          >
            Comprar
          </Link>
        </div>
      </div>
    </section>
  )
}
