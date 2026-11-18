import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { normalizeAppPathname } from '../../utils/checkoutReservationGuard'
import { syncAppBuildIfStale } from '../../utils/appBuildSync'
import Navbar from './Navbar'
import Footer from './Footer'
import ScrollToTop from './ScrollToTop'
import PendingOrderBanner from '../order/PendingOrderBanner'
import ShippingCutoffNotice from './ShippingCutoffNotice'
import CartFlyAnimation from '../cart/CartFlyAnimation'
import { useAuthStore } from '../../stores/authStore'
import { useCompanyStore } from '../../stores/companyStore'

const HIDE_FOOTER_PATHS = new Set(['/compra-rapida'])

export default function Layout() {
  const location = useLocation()
  const bootstrapSession = useAuthStore((s) => s.bootstrapSession)
  const bootstrapCompany = useCompanyStore((s) => s.bootstrapCompany)

  const hideFooter = HIDE_FOOTER_PATHS.has(normalizeAppPathname(location.pathname))

  useEffect(() => {
    bootstrapSession()
  }, [bootstrapSession])

  useEffect(() => {
    void syncAppBuildIfStale()
  }, [])

  useEffect(() => {
    bootstrapCompany()
  }, [bootstrapCompany])

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <ScrollToTop />
      <Navbar />
      <ShippingCutoffNotice />
      <PendingOrderBanner />
      <main className="relative z-0 flex min-w-0 flex-1 flex-col overflow-x-clip">
        <Outlet />
      </main>
      {hideFooter ? null : <Footer />}
      <CartFlyAnimation />
    </div>
  )
}
