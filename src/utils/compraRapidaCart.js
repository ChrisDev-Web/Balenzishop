import { CART_MODES } from './shoppingMode'

export function buildCompraRapidaBottleCartProduct(product) {
  return {
    id: product.id,
    idBrand: product.idBrand ?? product.id_brand ?? null,
    name: product.name,
    brand: product.brand ?? '',
    image: product.image ?? '',
    price: Number(product.price ?? product.displayPrice ?? 0),
    basePrice: Number(product.price ?? product.displayPrice ?? 0),
    stock: product.stock ?? null,
  }
}

export function buildCompraRapidaDecantCartProduct(product, decant) {
  return {
    id: product.id,
    idBrand: product.idBrand ?? product.id_brand ?? null,
    idProductDecant: decant.idProductDecant,
    isDecant: true,
    name: product.name,
    brand: product.brand ?? '',
    image: decant.image || product.image || '',
    price: Number(decant.price ?? 0),
    basePrice: Number(decant.price ?? 0),
    decantSizeMl: decant.sizeMl,
    sizeMl: decant.sizeMl,
    stock: decant.stock ?? null,
  }
}

export const COMPRA_RAPIDA_CART_MODE = CART_MODES.MINORISTA