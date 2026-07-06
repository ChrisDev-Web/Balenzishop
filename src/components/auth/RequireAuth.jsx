import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

export default function RequireAuth({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (!isAuthenticated) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Inicia sesión para continuar</h1>
        <p className="mt-2 text-gray-600">Usa el menú &quot;Mi cuenta&quot; en la barra superior.</p>
      </div>
    )
  }

  return children
}

export function RequireProfileComplete({ children }) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Inicia sesión para ver tu cuenta</h1>
      </div>
    )
  }

  if (!user?.profileComplete) {
    return <Navigate to="/mi-cuenta/completar-perfil" replace />
  }

  return children
}
