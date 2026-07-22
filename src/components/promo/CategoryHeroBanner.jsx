import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { productLink } from '../../utils/productUtils'
import Skeleton from '../ui/skeleton/Skeleton'

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
  priority = false,
}) {
  const href = linkTo ?? productLink(productId)
  const [imageReady, setImageReady] = useState(false)

  const markImageReady = useCallback(() => {
    setImageReady(true)
  }, [])

  const handleImageRef = useCallback(
    (node) => {
      if (node?.complete && node.naturalWidth > 0) {
        markImageReady()
      }
    },
    [markImageReady],
  )

  const titleClass = 'font-nav font-semibold uppercase tracking-[0.12em] text-white'

  const contentEnterClass = enterAnimation ? 'hero-banner-content-enter' : 'content-fade-in'
  const mobileVerticalImage = compactImage || festiveMobileLayout

  const imageClassName = compactImage
    ? 'max-md:h-[68vh] max-md:object-cover max-md:object-[50%_38%] md:max-h-[96vh] md:object-cover md:object-center'
    : festiveMobileLayout
      ? `max-md:h-[74vh] max-md:object-cover md:h-auto ${
          mobileImagePositionClass || 'max-md:object-[62%_36%]'
        }`
      : 'h-auto'

  const frameMinHeight = compactImage
    ? 'max-md:min-h-[68vh] md:min-h-[72vh]'
    : festiveMobileLayout
      ? 'max-md:min-h-[74vh] md:min-h-[72vh]'
      : 'min-h-[50vh] md:min-h-[70vh]'

  return (
    <section
      className={`relative w-full ${mobileVerticalImage ? 'max-md:bg-stone-200' : ''} ${
        compactImage ? (imageReady ? 'md:bg-black' : 'md:bg-stone-200') : ''
      }`}
    >
      <div className={`relative w-full overflow-hidden ${frameMinHeight}`}>
        {!imageReady && (
          <Skeleton className={`absolute inset-0 z-[1] rounded-none ${frameMinHeight}`} />
        )}

        <img
          ref={handleImageRef}
          src={backgroundImage}
          alt=""
          className={`pointer-events-none block w-full transition-opacity duration-300 ease-out ${imageClassName} ${
            imageReady ? `opacity-100 ${enterAnimation ? 'hero-banner-image-enter' : ''}` : 'opacity-0'
          }`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={markImageReady}
          onError={markImageReady}
        />

        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-t md:from-black/75 md:via-black/20 ${
            mobileVerticalImage
              ? 'from-black/85 via-black/10 to-transparent max-md:from-black/90 max-md:via-black/5'
              : 'from-black/80 via-black/15 to-transparent'
          } ${imageReady ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          aria-hidden="true"
        />

        {compactImage ? (
          <div
            className={`absolute inset-x-0 bottom-12 z-10 flex flex-col items-center gap-3.5 px-4 text-center sm:bottom-14 md:hidden ${
              imageReady ? `pointer-events-auto ${contentEnterClass}` : 'pointer-events-none opacity-0'
            }`}
          >
            <h2 className={`${titleClass} max-w-[92%] text-lg leading-snug sm:text-xl`}>{title}</h2>
            <Link
              to={href}
              className="btn-fill-light inline-flex px-5 py-2 text-[10px] tracking-[0.14em] sm:px-6 sm:py-2.5 sm:text-xs"
            >
              Comprar
            </Link>
          </div>
        ) : festiveMobileLayout ? (
          <div
            className={`absolute inset-x-0 bottom-5 z-10 flex flex-col items-center gap-3 px-4 text-center md:hidden ${
              imageReady ? `pointer-events-auto ${contentEnterClass}` : 'pointer-events-none opacity-0'
            }`}
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
          <div
            className={`absolute inset-x-0 bottom-[10%] z-10 flex flex-col items-center px-4 text-center md:hidden ${
              imageReady ? `pointer-events-auto ${contentEnterClass}` : 'pointer-events-none opacity-0'
            }`}
          >
            <h2 className={`${titleClass} max-w-[90%] text-sm leading-snug sm:text-base`}>{title}</h2>
            <Link
              to={href}
              className="btn-fill-light mt-3 inline-flex px-5 py-2 text-[10px] tracking-[0.14em] sm:mt-3.5 sm:px-6 sm:py-2.5 sm:text-xs"
            >
              Comprar
            </Link>
          </div>
        )}

        <div
          className={`absolute inset-x-0 z-10 hidden w-full px-10 lg:px-16 md:block ${contentEnterClass} ${
            raisedContent
              ? 'bottom-[22%] md:bottom-[24%] lg:bottom-[26%]'
              : 'bottom-0 pb-16 lg:pb-20'
          } ${imageReady ? 'pointer-events-auto' : 'pointer-events-none opacity-0'}`}
        >
          <h2 className={`${titleClass} max-w-3xl text-3xl md:text-4xl lg:text-5xl`}>{title}</h2>
          <Link
            to={href}
            className={`btn-fill-light inline-flex px-8 py-3 text-sm ${raisedContent ? 'mt-4' : 'mt-6'}`}
          >
            Comprar
          </Link>
        </div>

        {!imageReady && (
          <div className="pointer-events-none absolute inset-x-0 bottom-12 z-[2] flex flex-col items-center gap-3.5 px-4 sm:bottom-14 md:bottom-0 md:items-start md:px-10 md:pb-16 lg:px-16 lg:pb-20">
            <Skeleton className="h-5 w-40 md:h-10 md:w-72 lg:w-96" />
            <Skeleton className="h-9 w-28 md:h-11 md:w-36" />
          </div>
        )}
      </div>
    </section>
  )
}
