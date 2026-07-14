import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import WomenPage from './pages/WomenPage'
import MenPage from './pages/MenPage'
import PromotionsPage from './pages/PromotionsPage'
import CatalogPage from './pages/CatalogPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CheckoutPage from './pages/CheckoutPage'
import AccountLayout from './pages/account/AccountLayout'
import CompleteProfilePage from './pages/account/CompleteProfilePage'
import ProfilePage from './pages/account/ProfilePage'
import AddressesPage from './pages/account/AddressesPage'
import OrdersPage from './pages/account/OrdersPage'
import RequireAuth from './components/auth/RequireAuth'

export default function App() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <BrowserRouter>
        <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="mujeres" element={<WomenPage />} />
          <Route path="hombres" element={<MenPage />} />
          <Route path="promociones" element={<PromotionsPage />} />
          <Route path="catalogo" element={<CatalogPage />} />
          <Route path="producto/:id" element={<ProductDetailPage />} />
          <Route path="pedido" element={<CheckoutPage />} />

          <Route path="mi-cuenta/completar-perfil" element={
            <RequireAuth>
              <div className="mx-auto flex max-w-7xl justify-center px-4 py-10 lg:px-6">
                <CompleteProfilePage />
              </div>
            </RequireAuth>
          } />

          <Route path="mi-cuenta" element={<AccountLayout />}>
            <Route index element={<ProfilePage />} />
            <Route path="direcciones" element={<AddressesPage />} />
            <Route path="pedidos" element={<OrdersPage />} />
          </Route>
        </Route>
        </Routes>
      </BrowserRouter>
    </div>
  )
}
