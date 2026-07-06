import { perfumes } from '../data/perfumes'

export function orderItemsToCartItems(orderItems = []) {
  return orderItems.map((item) => {
    const perfume = perfumes.find((p) => p.id === item.id)
    return {
      id: item.id,
      name: item.name,
      brand: item.brand,
      price: item.price,
      quantity: item.quantity,
      image: perfume?.image || item.image || '',
      aroma: perfume?.aroma,
    }
  })
}
