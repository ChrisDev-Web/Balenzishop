import { NavLink, useNavigate } from 'react-router-dom'
import { User, MapPin, Package, LogOut, ChevronRight } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

const menuItems = [
  { to: '/mi-cuenta', label: 'Perfil', icon: User, end: true },
  { to: '/mi-cuenta/direcciones', label: 'Direcciones', icon: MapPin },
  { to: '/mi-cuenta/pedidos', label: 'Pedidos', icon: Package },
]

export default function AccountSidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const displayName = user?.firstName || user?.email?.split('@')[0] || 'Usuario'

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <aside className="w-full shrink-0 lg:w-64">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
            <User className="h-9 w-9 text-gray-600" />
          </div>
          <p className="mt-3 text-lg font-semibold text-gray-900">¡Hola{displayName !== 'Usuario' ? `, ${displayName}` : ''}!</p>
        </div>

        <nav className="mt-6 space-y-1">
          {menuItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-gray-100 text-black'
                    : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <span className="flex items-center gap-3">
                <Icon className="h-5 w-5" />
                {label}
              </span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </NavLink>
          ))}

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <span className="flex items-center gap-3">
              <LogOut className="h-5 w-5" />
              Salir
            </span>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button>
        </nav>
      </div>
    </aside>
  )
}
