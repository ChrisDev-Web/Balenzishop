import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import ScrollToTop from './ScrollToTop'
import PendingOrderBanner from '../order/PendingOrderBanner'
import { useAuthStore } from '../../stores/authStore'
import { useCartStore } from '../../stores/cartStore'

export default function Layout() {
  const user = useAuthStore((s) => s.user)
  const bootstrapSession = useAuthStore((s) => s.bootstrapSession)
  const syncWithUserRole = useCartStore((s) => s.syncWithUserRole)

  useEffect(() => {
    bootstrapSession()
  }, [bootstrapSession])

  useEffect(() => {
    if (user?.role) {
      syncWithUserRole(user.role)
    }
  }, [user?.role, syncWithUserRole])

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <ScrollToTop />
      <Navbar />
      <PendingOrderBanner />
      <main className="relative z-0 flex flex-1 flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
