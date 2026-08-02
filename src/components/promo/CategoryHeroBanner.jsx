import { Link } from 'react-router-dom'
import { productLink } from '../../utils/productUtils'
import Skeleton from '../ui/skeleton/Skeleton'
import { useCachedImageReady } from '../../hooks/useCachedImageReady'

const DESKTOP_IMAGE =
  'xl:relative xl:inset-auto xl:block xl:h-auto xl:w-full xl:max-h-[96vh] xl:object-cover xl:object-center'

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
  const {
    ready: imageReady,
    cachedHint,
    markReady: markImageReady,
    markError: markImageError,
    handleRef: handleImageRef,
  } = useCachedImageReady(backgroundImage)

  const titleClass = 'font-nav font-semibold uppercase tracking-[0.12em] text-white'
  const contentEnterClass = enterAnimation ? 'hero-banner-content-enter' : 'content-fade-in'
  const mobileVerticalImage = compactImage || festiveMobileLayout
  const showSkeleton = Boolean(backgroundImage) && !imageReady && !cachedHint
  const showContent = Boolean(backgroundImage) && imageReady

  const imageClassName = compactImage
    ? `absolute inset-0 h-full w-full object-cover max-xl:object-[50%_38%] ${DESKTOP_IMAGE}`
    : festiveMobileLayout
      ? `absolute inset-0 h-full w-full object-cover ${
          mobileImagePositionClass || 'max-xl:object-[62%_36%]'
        } ${DESKTOP_IMAGE}`
      : `max-xl:absolute max-xl:inset-0 max-xl:h-full max-xl:w-full max-xl:object-cover max-xl:object-center xl:relative xl:inset-auto xl:block xl:h-auto xl:w-full`

  const frameMinHeight = compactImage
    ? 'max-xl:min-h-[68vh] xl:min-h-[72vh]'
    : festiveMobileLayout
      ? 'max-xl:min-h-[74vh] xl:min-h-[72vh]'
      : 'max-xl:min-h-[50vh] xl:min-h-[70vh]'

  return (
    <section
      className={`relative w-full ${mobileVerticalImage && !imageReady ? 'bg-stone-200' : ''} ${
        compactImage ? (imageReady ? 'xl:bg-black' : 'xl:bg-stone-200') : ''
      }`}
    >
      <div className={`relative w-full overflow-hidden ${frameMinHeight}`}>
        {showSkeleton && (
          <Skeleton
            className={`absolute inset-0 z-[1] rounded-none max-xl:min-h-[68vh] ${
              compactImage ? 'xl:relative xl:block xl:min-h-[72vh] xl:max-h-[96vh] xl:h-[85vh]' : frameMinHeight
            }`}
          />
        )}

        {backgroundImage && (
          <img
            key={backgroundImage}
            ref={handleImageRef}
            src={backgroundImage}
            alt=""
            className={`pointer-events-none transition-opacity duration-300 ease-out ${imageClassName} ${
              imageReady ? `opacity-100 ${enterAnimation ? 'hero-banner-image-enter' : ''}` : 'opacity-0'
            }`}
            loading={priority || cachedHint ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority || cachedHint ? 'high' : 'auto'}
            onLoad={markImageReady}
            onError={markImageError}
          />
        )}

        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-24 bg-gradient-to-b from-black/40 to-transparent xl:hidden"
          aria-hidden="true"
        />

        <div
          className={`pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t xl:from-black/75 xl:via-black/20 ${
            mobileVerticalImage
              ? 'from-black/90 via-black/15 to-transparent max-xl:from-black/85 max-xl:via-black/10'
              : 'from-black/80 via-black/15 to-transparent'
          } ${showContent ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          aria-hidden="true"
        />

        {compactImage ? (
          <div
            className={`absolute inset-x-0 bottom-12 z-10 flex flex-col items-center gap-3.5 px-4 text-center sm:bottom-14 xl:hidden ${
              showContent ? `pointer-events-auto ${contentEnterClass}` : 'pointer-events-none opacity-0'
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
            className={`absolute inset-x-0 bottom-5 z-10 flex flex-col items-center gap-3 px-4 text-center xl:hidden ${
              showContent ? `pointer-events-auto ${contentEnterClass}` : 'pointer-events-none opacity-0'
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
            className={`absolute inset-x-0 bottom-[10%] z-10 flex flex-col items-center px-4 text-center xl:hidden ${
              showContent ? `pointer-events-auto ${contentEnterClass}` : 'pointer-events-none opacity-0'
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
          className={`absolute inset-x-0 z-10 hidden w-full px-10 lg:px-16 xl:block ${contentEnterClass} ${
            raisedContent
              ? 'bottom-[22%] xl:bottom-[24%] 2xl:bottom-[26%]'
              : 'bottom-0 pb-16 lg:pb-20'
          } ${showContent ? 'pointer-events-auto' : 'pointer-events-none opacity-0'}`}
        >
          <h2 className={`${titleClass} max-w-3xl text-3xl xl:text-4xl 2xl:text-5xl`}>{title}</h2>
          <Link
            to={href}
            className={`btn-fill-light inline-flex px-8 py-3 text-sm ${raisedContent ? 'mt-4' : 'mt-6'}`}
          >
            Comprar
          </Link>
        </div>

        {showSkeleton && (
          <div className="pointer-events-none absolute inset-x-0 bottom-12 z-[2] flex flex-col items-center gap-3.5 px-4 sm:bottom-14 xl:bottom-0 xl:items-start xl:px-10 xl:pb-16 lg:px-16 lg:pb-20">
            <Skeleton className="h-5 w-40 xl:h-10 xl:w-72 2xl:w-96" />
            <Skeleton className="h-9 w-28 xl:h-11 xl:w-36" />
          </div>
        )}
      </div>
    </section>
  )
}
