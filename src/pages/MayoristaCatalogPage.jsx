import CatalogPage from './CatalogPage'
import MayoristaAccessGate from '../components/wholesale/MayoristaAccessGate'
import { CART_MODES } from '../utils/shoppingMode'

export default function MayoristaCatalogPage() {
  return (
    <MayoristaAccessGate>
      <CatalogPage catalogMode={CART_MODES.MAYORISTA} />
    </MayoristaAccessGate>
  )
}
