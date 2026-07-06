import { IMAGES } from './promoImages'

export { IMAGES }

export const womenCarousel = [
  {
    id: 1,
    eyebrow: 'Clon comprobado',
    title: '¡El dupe definitivo!',
    subtitle: 'El encuentro de dos íconos',
    image: IMAGES.women[0],
    price: 'S/ 129',
    originalPrice: 'S/ 169',
    badge: 'Verificado',
    cta: 'Comprar ahora',
    filter: { categories: ['mujeres'] },
  },
  {
    id: 2,
    eyebrow: 'Nueva colección',
    title: 'Rosa & Perla',
    subtitle: 'Elegancia pura',
    image: IMAGES.women[2],
    price: 'S/ 139',
    badge: 'Lo más pedido',
    filter: { categories: ['mujeres'], aroma: 'floral' },
  },
  {
    id: 3,
    eyebrow: 'Perfume + desodorante',
    title: 'Pack Dúo Premium',
    subtitle: 'Solo por tiempo limitado',
    image: IMAGES.sets[0],
    price: 'S/ 189',
    originalPrice: 'S/ 249',
    cta: 'Ver set',
    filter: { categories: ['sets-mujeres'] },
  },
]

export const menCarousel = [
  {
    id: 1,
    eyebrow: 'Stock nuevo',
    title: '¡Hay stock nuevo!',
    subtitle: 'Pero limitado',
    image: IMAGES.men[0],
    price: 'S/ 119',
    originalPrice: 'S/ 149',
    badge: '¡Pocas unidades!',
    cta: 'Compra ahora',
    filter: { categories: ['hombres'] },
  },
  {
    id: 2,
    eyebrow: 'Edición urbana',
    title: 'Urban Force',
    subtitle: 'Potencia masculina',
    image: IMAGES.men[2],
    price: 'S/ 98',
    filter: { categories: ['hombres'], aroma: 'fresco' },
  },
  {
    id: 3,
    eyebrow: 'Regalo perfecto',
    title: 'Set Ejecutivo',
    subtitle: 'Perfume + desodorante',
    image: IMAGES.men[4],
    price: 'S/ 175',
    originalPrice: 'S/ 220',
    cta: 'Ver set',
    filter: { categories: ['sets-hombres'] },
  },
]

export const promotionsCarousel = [
  {
    id: 1,
    eyebrow: 'Minis de lujo',
    title: 'Perfumes originales',
    subtitle: 'De diseñador',
    image: IMAGES.women[1],
    price: 'S/ 74',
    originalPrice: 'S/ 89.90',
    badge: 'Stock limitado',
    filter: { categories: ['mujeres', 'hombres'] },
  },
  {
    id: 2,
    eyebrow: 'Hasta 30% OFF',
    title: 'Fragancias femeninas',
    subtitle: 'Semana especial',
    image: IMAGES.women[3],
    price: 'Desde S/ 45',
    cta: 'Ver ofertas',
    filter: { categories: ['mujeres'] },
  },
  {
    id: 3,
    eyebrow: 'Hasta 25% OFF',
    title: 'Potencia masculina',
    subtitle: 'En oferta',
    image: IMAGES.men[1],
    price: 'Desde S/ 40',
    cta: 'Ver ofertas',
    filter: { categories: ['hombres', 'sets-hombres'] },
  },
]

export const womenHighlights = [
  {
    title: 'Floral',
    tagline: 'Rosa & jazmín',
    image: IMAGES.women[1],
    filter: { categories: ['mujeres'], aroma: 'floral' },
  },
  {
    title: 'Sets',
    tagline: 'Perfume + desodorante',
    image: IMAGES.sets[0],
    filter: { categories: ['sets-mujeres'] },
  },
  {
    title: 'Clásicos',
    tagline: 'Chanel · Dior · YSL',
    image: IMAGES.women[4],
    filter: { categories: ['mujeres'] },
  },
]

export const menHighlights = [
  {
    title: 'Amaderado',
    tagline: 'Intenso & audaz',
    image: IMAGES.men[3],
    filter: { categories: ['hombres'], aroma: 'amaderado' },
  },
  {
    title: 'Fresco',
    tagline: 'Uso diario',
    image: IMAGES.men[5],
    filter: { categories: ['hombres'], aroma: 'fresco' },
  },
  {
    title: 'Sets',
    tagline: 'Ejecutivo & regalo',
    image: IMAGES.sets[1],
    filter: { categories: ['sets-hombres'] },
  },
]

export const womenHero = {
  title: 'Mujer',
  subtitle: 'La esencia de tu sensualidad',
  image: IMAGES.women[0],
  cta: 'Ver perfumes',
}

export const menHero = {
  title: 'Hombre',
  subtitle: 'El secreto de tu atracción',
  image: IMAGES.men[0],
  cta: 'Ver perfumes',
}

export const promotionsHero = {
  title: 'Promociones',
  subtitle: 'Las mejores ofertas del momento',
  image: IMAGES.women[1],
  cta: 'Ver ofertas',
}

export const categoryBanners = [
  {
    title: 'Mujer',
    tagline: 'Hasta 30% OFF',
    image: IMAGES.women[2],
    link: '/mujeres',
  },
  {
    title: 'Hombre',
    tagline: 'Hasta 25% OFF',
    image: IMAGES.men[3],
    link: '/hombres',
  },
]
