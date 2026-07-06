import { useEffect } from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import AccountSidebar from '../../components/account/AccountSidebar'
import { useAuthStore } from '../../stores/authStore'
import { useUiStore } from '../../stores/uiStore'
import { AUTH_INTENT } from '../../utils/authFlow'

function LoginPrompt({ title, subtitle }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 text-center lg:px-6">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <p className="mt-2 text-gray-600">{subtitle}</p>
    </div>
  )
}

export default function AccountLayout() {
  const { isAuthenticated, user } = useAuthStore()
  const openLoginModal = useUiStore((s) => s.openLoginModal)
  const location = useLocation()
  const isPedidos = location.pathname.endsWith('/pedidos')

  useEffect(() => {
    if (!isAuthenticated) {
      openLoginModal(isPedidos ? AUTH_INTENT.ORDERS : AUTH_INTENT.ONBOARDING)
    }
  }, [isAuthenticated, isPedidos, openLoginModal])

  if (!isAuthenticated) {
    return (
      <LoginPrompt
        title={isPedidos ? 'Inicia sesión para ver tus pedidos' : 'Inicia sesión para ver tu cuenta'}
        subtitle="Usa el menú &quot;Mi cuenta&quot; en la barra superior para iniciar sesión."
      />
    )
  }

  if (!isPedidos && user && !user.profileComplete) {
    return <Navigate to="/mi-cuenta/completar-perfil" replace />
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
      <div className="flex flex-col gap-8 lg:flex-row">
        {isAuthenticated && <AccountSidebar />}
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
