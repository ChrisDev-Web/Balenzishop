import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { syncAppBuildIfStale } from '../../utils/appBuildSync'
import Navbar from './Navbar'
import Footer from './Footer'
import ScrollToTop from './ScrollToTop'
import PendingOrderBanner from '../order/PendingOrderBanner'
import ShippingCutoffNotice from './ShippingCutoffNotice'
import CartFlyAnimation from '../cart/CartFlyAnimation'
import { useAuthStore } from '../../stores/authStore'
import { useCompanyStore } from '../../stores/companyStore'

export default function Layout() {
  const bootstrapSession = useAuthStore((s) => s.bootstrapSession)
  const bootstrapCompany = useCompanyStore((s) => s.bootstrapCompany)

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
      <Footer />
      <CartFlyAnimation />
    </div>
  )
}
