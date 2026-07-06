const IMAGES = {
  women: [
    'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1587017539504-67cfbddcf2b4?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1592945403247-bfd282a2f785?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1619994403079-3d8ee0f0860e?w=400&h=500&fit=crop',
  ],
  men: [
    'https://images.unsplash.com/photo-1592945414851-8f9f700dc946?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1585386959984-a41552231693?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1615529328331-f8917597711f?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1595425970387-c970029bf85a?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1618886614638-80e3ec1031a1?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1587017539504-67cfbddcf2b4?w=400&h=500&fit=crop',
  ],
  unisex: [
    'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1595425970387-c970029bf85a?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1588405748880-714e2b11ae3b?w=400&h=500&fit=crop',
  ],
  sets: [
    'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1618886614638-80e3ec1031a1?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400&h=500&fit=crop',
  ],
}

import { FEATURED_LATTafa_PRODUCTS } from './sectionHeroes'

const BRANDS = [
  'Chanel', 'Dior', 'Versace', 'Gucci', 'Calvin Klein', 'Armani', 'Hugo Boss',
  'Lancôme', 'YSL', 'Tom Ford', 'Burberry', 'Prada', 'Bvlgari', 'Givenchy', 'Montblanc',
  'Dolce & Gabbana', 'Jean Paul Gaultier', 'Paco Rabanne', 'Davidoff', 'Azzaro',
]

const AROMAS = ['aroma suave', 'aroma fuerte', 'floral', 'amaderado', 'cítrico', 'oriental', 'fresco', 'dulce', 'especiado']

const WOMEN_NAMES = [
  'Élégance Nocturne', 'Rosa Encantada', 'Velvet Bloom', 'Luna Dorada', 'Petals Dream',
  'Silk Essence', 'Crystal Rose', 'Aurora Femme', 'Mystic Garden', 'Pearl Mist',
]

const MEN_NAMES = [
  'Iron Legend', 'Urban Force', 'Dark Horizon', 'Steel Intense', 'Noble Spirit',
  'Black Edge', 'Titan Wave', 'Royal Code', 'Midnight Drive', 'Power Rush',
  'Wild Instinct', 'Blue Ocean', 'Classic Man', 'Sport Elite', 'Executive Style',
  'Alpha Intense', 'Urban Night', 'Fresh Impact', 'Legacy Gold', 'Storm Force',
]

const UNISEX_NAMES = ['Pure Balance', 'Neutral Aura', 'Essence One', 'Harmony Blend', 'Universal Soul']

const SET_NAMES = {
  'sets-mujeres': ['Duo Glamour', 'Kit Esencial', 'Pack Elegance', 'Set Rosa & Perla', 'Combo Premium'],
  'sets-hombres': ['Duo Masculino', 'Kit Ejecutivo', 'Pack Power', 'Set Urban Force', 'Combo Intense'],
  'sets-unisex': ['Duo Universal', 'Kit Esencial', 'Pack Harmony', 'Set Balance', 'Combo Duo'],
}

function buildPerfumes() {
  const items = []
  let id = 1

  const addBatch = (category, names, imageSet, priceRange, productType = 'perfume', brandLimit = BRANDS.length) => {
    const brands = BRANDS.slice(0, brandLimit)
    names.forEach((baseName, i) => {
      brands.forEach((brand, j) => {
        const aroma = AROMAS[(i + j) % AROMAS.length]
        const price = priceRange[0] + ((i * 17 + j * 23) % (priceRange[1] - priceRange[0]))
        const isSet = productType === 'set'
        const audience =
          category === 'mujeres' || category === 'sets-mujeres' ? 'mujeres'
          : category === 'hombres' || category === 'sets-hombres' ? 'hombres'
          : 'unisex'

        items.push({
          id: id++,
          name: isSet ? `Set ${brand} ${baseName}` : `${brand} ${baseName}`,
          brand,
          category,
          productType,
          price: Math.round(price * 100) / 100,
          image: imageSet[(i + j) % imageSet.length],
          aroma,
          description: isSet
            ? `Set ${brand} con perfume + desodorante ${baseName}. Combo ideal para ${audience === 'mujeres' ? 'ella' : audience === 'hombres' ? 'él' : 'cualquier ocasión'}. Aroma ${aroma} de larga duración.`
            : `Fragancia ${aroma} de ${brand}. Ideal para quienes buscan un perfume ${audience === 'mujeres' ? 'femenino y elegante' : audience === 'hombres' ? 'masculino y audaz' : 'versátil'}. Notas que perduran todo el día.`,
          recommended: (i + j) % 3 === 0,
          onSale: (i + j) % 5 === 0,
          originalPrice: (i + j) % 5 === 0 ? Math.round((price * 1.25) * 100) / 100 : null,
        })
      })
    })
  }

  addBatch('mujeres', WOMEN_NAMES, IMAGES.women, [45, 280])
  addBatch('hombres', MEN_NAMES, IMAGES.men, [40, 260], 'perfume', 18)
  addBatch('unisex', UNISEX_NAMES, IMAGES.unisex, [55, 320], 'perfume', 10)
  addBatch('sets-mujeres', SET_NAMES['sets-mujeres'], IMAGES.sets, [85, 320], 'set', 12)
  addBatch('sets-hombres', SET_NAMES['sets-hombres'], IMAGES.sets, [75, 290], 'set', 14)
  addBatch('sets-unisex', SET_NAMES['sets-unisex'], IMAGES.sets, [90, 350], 'set', 8)

  return items
}

export const perfumes = [...buildPerfumes(), ...FEATURED_LATTafa_PRODUCTS]

export const brands = [...new Set(perfumes.map((p) => p.brand))].sort()

export const categories = [
  { value: 'mujeres', label: 'Mujeres' },
  { value: 'hombres', label: 'Hombres' },
  { value: 'unisex', label: 'Unisex' },
  { value: 'sets-mujeres', label: 'Sets Mujeres' },
  { value: 'sets-hombres', label: 'Sets Hombres' },
  { value: 'sets-unisex', label: 'Sets Unisex' },
]

export const aromaOptions = AROMAS

export const womenPromotions = [
  {
    id: 1,
    title: 'Semana de la Elegancia Femenina',
    subtitle: 'Hasta 30% en fragancias exclusivas',
    description: 'Descubre las mejores esencias diseñadas para la mujer moderna. Notas florales, orientales y dulces que realzan tu personalidad.',
    image: IMAGES.women[0],
    filter: { categories: ['mujeres'] },
  },
  {
    id: 2,
    title: 'Colección Rosa & Perla',
    subtitle: 'Nuevos lanzamientos',
    description: 'Fragancias suaves con toques de rosa y jazmín. Perfectas para el día a día o ocasiones especiales.',
    image: IMAGES.women[2],
    filter: { categories: ['mujeres'], aroma: 'floral' },
  },
  {
    id: 3,
    title: 'Pack Dúo Premium',
    subtitle: '2x1 en seleccionados',
    description: 'Lleva dos perfumes de mujer por el precio de uno en marcas como Dior, Lancôme y Chanel.',
    image: IMAGES.women[4],
    filter: { categories: ['sets-mujeres'] },
  },
]

export const menPromotions = [
  {
    id: 1,
    title: 'Potencia Masculina',
    subtitle: 'Hasta 25% de descuento',
    description: 'Fragancias intensas y amaderadas para el hombre que deja huella. Desde notas frescas hasta aromas profundos y especiados.',
    image: IMAGES.men[0],
    filter: { categories: ['hombres'] },
  },
  {
    id: 2,
    title: 'Colección Urban Force',
    subtitle: 'Edición limitada',
    description: 'Perfumes con carácter urbano y moderno. Ideales para el hombre activo que busca frescura y duración.',
    image: IMAGES.men[2],
    filter: { categories: ['hombres'], aroma: 'fresco' },
  },
  {
    id: 3,
    title: 'Set Ejecutivo',
    subtitle: 'Regalo perfecto',
    description: 'Combo perfume + desodorante en estuche exclusivo. La opción ideal para regalo o uso diario.',
    image: IMAGES.men[4],
    filter: { categories: ['sets-hombres'] },
  },
]

export const generalPromotions = [
  ...womenPromotions.map((p) => ({ ...p, type: 'mujeres' })),
  ...menPromotions.map((p) => ({ ...p, type: 'hombres' })),
]
