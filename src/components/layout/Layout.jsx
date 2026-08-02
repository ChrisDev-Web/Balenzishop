import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import ScrollToTop from './ScrollToTop'
import PendingOrderBanner from '../order/PendingOrderBanner'
import ShippingCutoffNotice from './ShippingCutoffNotice'
import CartFlyAnimation from '../cart/CartFlyAnimation'
import { useAuthStore } from '../../stores/authStore'
import { useCartStore } from '../../stores/cartStore'
import { useCompanyStore } from '../../stores/companyStore'

export default function Layout() {
  const user = useAuthStore((s) => s.user)
  const bootstrapSession = useAuthStore((s) => s.bootstrapSession)
  const syncWithUserRole = useCartStore((s) => s.syncWithUserRole)
  const bootstrapCompany = useCompanyStore((s) => s.bootstrapCompany)

  useEffect(() => {
    bootstrapSession()
  }, [bootstrapSession])

  useEffect(() => {
    bootstrapCompany()
  }, [bootstrapCompany])

  useEffect(() => {
    if (user?.role) {
      syncWithUserRole(user.role)
    }
  }, [user?.role, syncWithUserRole])

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <ScrollToTop />
      <Navbar />
      <ShippingCutoffNotice />
      <PendingOrderBanner />
      <main className="relative z-0 flex flex-1 flex-col">
        <Outlet />
      </main>
      <Footer />
      <CartFlyAnimation />
    </div>
  )
}
