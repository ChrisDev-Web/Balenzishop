import { productLink } from './productUtils'
import { normalizeMediaUrl } from './mediaUrl'

export function mapHomeSpotlightItem(items = []) {
  const item = items
    .filter((entry) => entry.placement === 'home_spotlight' && entry.image)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]

  if (!item) {
    return null
  }

  return {
    title: item.title,
    image: normalizeMediaUrl(item.image),
    productId: item.id_product ?? undefined,
    imageLinkTo: item.id_product ? productLink(item.id_product) : '/catalogo',
    catalogLinkTo: '/catalogo',
  }
}

export function mapHomeHeroImage(items = []) {
  const item = items
    .filter((entry) => entry.placement === 'hero_top' && entry.image)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]

  return item?.image ? normalizeMediaUrl(item.image) : null
}

export function mapShopPageHeroBanners(items = [], catalogHref = '/catalogo') {
  return items
    .filter((item) => item.placement === 'hero_top' && item.image)
    .map((item) => ({
      id: item.id_shop_page_item,
      title: item.title,
      backgroundImage: normalizeMediaUrl(item.image),
      productId: item.id_product ?? undefined,
      linkTo: item.id_product ? undefined : catalogHref,
    }))
}

export function mapShopPageSeriesGridItems(items = [], catalogHref = '/catalogo') {
  return items
    .filter((item) => item.placement === 'series_grid' && item.image)
    .map((item) => ({
      id: item.id_shop_page_item,
      title: item.title,
      image: normalizeMediaUrl(item.image),
      linkTo: item.id_product ? productLink(item.id_product) : catalogHref,
    }))
}
