import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import ScrollToTop from './ScrollToTop'
import PendingOrderBanner from '../order/PendingOrderBanner'
import { useAuthStore } from '../../stores/authStore'
import { useCartStore } from '../../stores/cartStore'

export default function Layout() {
  const user = useAuthStore((s) => s.user)
  const syncWithUserRole = useCartStore((s) => s.syncWithUserRole)

  useEffect(() => {
    if (user?.role) {
      syncWithUserRole(user.role)
    }
  }, [user?.role, syncWithUserRole])

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar />
      <PendingOrderBanner />
      <main className="relative z-0 flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
