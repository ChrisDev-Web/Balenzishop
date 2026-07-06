/** Rutas públicas de banners por sección (3 por género) */
const MUJER_IMAGES = [
  '/Images/Mujer/Yara Candy - Lattafa EDP 100 ml - Mujer.png',
  '/Images/Mujer/Yara de Lattafa EDP 100 ml - Mujer.png',
  '/Images/Mujer/Yara Moi - Lattafa EDP 100 ml - Mujer.png',
]

const MUJER_SERIES_IMAGES = [
  '/Images/Mujer/HAYAT.png',
  '/Images/Mujer/LAYALI BLEU.png',
  '/Images/Mujer/LAYAN.png',
  '/Images/Mujer/ROZANA.png',
]

const HOMBRE_IMAGES = [
  '/Images/Hombre/Asad Bourbon by Lattafa - Hombre.png',
  '/Images/Hombre/Asad by Lattafa - Hombre.png',
  '/Images/Hombre/Khamrah by Lattafa - Hombre.png',
]

const HOMBRE_SERIES_IMAGES = [
  '/Images/Hombre/AZRAQ INTENSE.png',
  '/Images/Hombre/FARIS VERDE.png',
  '/Images/Hombre/SAHIR NOIR.png',
  '/Images/Hombre/SULTAN ICE.png',
]

export function titleFromHeroImage(imagePath) {
  const filename = imagePath.split('/').pop() || ''
  return filename
    .replace(/\.(png|jpe?g|webp)$/i, '')
    .replace(/\s*-\s*(Mujer|Hombre)\s*$/i, '')
    .replace(/\s*EDP\s*\d+\s*ml/gi, '')
    .trim()
}

/** IDs reservados 1001–1006 en perfumes.js */
export const womenSectionHeroes = [
  { productId: 1001, backgroundImage: MUJER_IMAGES[0], title: titleFromHeroImage(MUJER_IMAGES[0]) },
  { productId: 1002, backgroundImage: MUJER_IMAGES[1], title: titleFromHeroImage(MUJER_IMAGES[1]) },
  { productId: 1003, backgroundImage: MUJER_IMAGES[2], title: titleFromHeroImage(MUJER_IMAGES[2]) },
]

export const womenTopSectionHeroes = womenSectionHeroes.slice(0, 2)

export const womenSeriesGrid = [
  { title: 'Hayat', image: MUJER_SERIES_IMAGES[0] },
  { title: 'Layali Bleu', image: MUJER_SERIES_IMAGES[1] },
  { title: 'Layan', image: MUJER_SERIES_IMAGES[2], imagePositionClass: 'object-[58%_50%] sm:object-[54%_42%]' },
  { title: 'Rozana', image: MUJER_SERIES_IMAGES[3] },
]

export const menSectionHeroes = [
  { productId: 1004, backgroundImage: HOMBRE_IMAGES[0], title: titleFromHeroImage(HOMBRE_IMAGES[0]) },
  { productId: 1005, backgroundImage: HOMBRE_IMAGES[1], title: titleFromHeroImage(HOMBRE_IMAGES[1]) },
  { productId: 1006, backgroundImage: HOMBRE_IMAGES[2], title: titleFromHeroImage(HOMBRE_IMAGES[2]) },
]

export const menTopSectionHeroes = menSectionHeroes.slice(0, 2)

export const menSeriesGrid = [
  { title: 'Azraq Intense', image: HOMBRE_SERIES_IMAGES[0] },
  { title: 'Faris Verde', image: HOMBRE_SERIES_IMAGES[1] },
  { title: 'Sahir Noir', image: HOMBRE_SERIES_IMAGES[2] },
  { title: 'Sultan Ice', image: HOMBRE_SERIES_IMAGES[3] },
]

const PROMO_IMAGES = Array.from({ length: 10 }, (_, i) => `/Images/Promociones/Promocion${i + 1}.png`)

/** Banners festivos — título por temática de cada imagen */
export const promotionsSectionHeroes = [
  { productId: 1001, backgroundImage: PROMO_IMAGES[0], title: 'Colección Verano' },
  { productId: 1005, backgroundImage: PROMO_IMAGES[1], title: 'Día del Padre' },
  { productId: 1002, backgroundImage: PROMO_IMAGES[2], title: 'Día de la Madre' },
  { productId: 1006, backgroundImage: PROMO_IMAGES[3], title: 'Navidad' },
  { productId: 1002, backgroundImage: PROMO_IMAGES[4], title: 'Fiestas Patrias' },
  { productId: 1001, backgroundImage: PROMO_IMAGES[5], title: 'San Valentín' },
  { productId: 1005, backgroundImage: PROMO_IMAGES[6], title: 'Black Friday' },
  { productId: 1004, backgroundImage: PROMO_IMAGES[7], title: 'Fin de Año' },
  { productId: 1003, backgroundImage: PROMO_IMAGES[8], title: 'Año Nuevo' },
  { productId: 1006, backgroundImage: PROMO_IMAGES[9], title: 'Grandes Ofertas' },
]

export const FEATURED_LATTafa_PRODUCTS = [
  {
    id: 1001,
    name: 'Lattafa Yara Candy',
    brand: 'Lattafa',
    category: 'mujeres',
    productType: 'perfume',
    price: 89.9,
    image: MUJER_IMAGES[0],
    aroma: 'dulce',
    description: 'Yara Candy de Lattafa: fragancia femenina dulce y vibrante con notas gourmand. Ideal para día y noche.',
    recommended: true,
    onSale: false,
    originalPrice: null,
  },
  {
    id: 1002,
    name: 'Lattafa Yara',
    brand: 'Lattafa',
    category: 'mujeres',
    productType: 'perfume',
    price: 79.9,
    image: MUJER_IMAGES[1],
    aroma: 'floral',
    description: 'Yara de Lattafa: esencia floral elegante y seductora. Un clásico moderno para la mujer contemporánea.',
    recommended: true,
    onSale: true,
    originalPrice: 99.9,
  },
  {
    id: 1003,
    name: 'Lattafa Yara Moi',
    brand: 'Lattafa',
    category: 'mujeres',
    productType: 'perfume',
    price: 94.9,
    image: MUJER_IMAGES[2],
    aroma: 'oriental',
    description: 'Yara Moi de Lattafa: perfume oriental femenino con carácter sofisticado y gran permanencia.',
    recommended: true,
    onSale: false,
    originalPrice: null,
  },
  {
    id: 1004,
    name: 'Lattafa Asad Bourbon',
    brand: 'Lattafa',
    category: 'hombres',
    productType: 'perfume',
    price: 109.9,
    image: HOMBRE_IMAGES[0],
    aroma: 'especiado',
    description: 'Asad Bourbon de Lattafa: fragancia masculina intensa con notas especiadas y amaderadas.',
    recommended: true,
    onSale: false,
    originalPrice: null,
  },
  {
    id: 1005,
    name: 'Lattafa Asad',
    brand: 'Lattafa',
    category: 'hombres',
    productType: 'perfume',
    price: 84.9,
    image: HOMBRE_IMAGES[1],
    aroma: 'amaderado',
    description: 'Asad de Lattafa: perfume masculino amaderado y audaz. Presencia marcada y elegante.',
    recommended: true,
    onSale: true,
    originalPrice: 104.9,
  },
  {
    id: 1006,
    name: 'Lattafa Khamrah',
    brand: 'Lattafa',
    category: 'hombres',
    productType: 'perfume',
    price: 119.9,
    image: HOMBRE_IMAGES[2],
    aroma: 'oriental',
    description: 'Khamrah de Lattafa: fragancia oriental unisex de tendencia con notas dulces y especiadas.',
    recommended: true,
    onSale: false,
    originalPrice: null,
  },
]
