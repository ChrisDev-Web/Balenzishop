import ProductDetailPage from './ProductDetailPage'
import MayoristaAccessGate from '../components/wholesale/MayoristaAccessGate'
import { CART_MODES } from '../utils/shoppingMode'

export default function MayoristaProductDetailPage() {
  return (
    <MayoristaAccessGate>
      <ProductDetailPage catalogMode={CART_MODES.MAYORISTA} />
    </MayoristaAccessGate>
  )
}
