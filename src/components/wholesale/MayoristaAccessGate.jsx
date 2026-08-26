import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useUiStore } from '../../stores/uiStore'
import { isMayorista } from '../../utils/pricing'

export default function MayoristaAccessGate({ children }) {
  const user = useAuthStore((state) => state.user)
  const openWholesaleModal = useUiStore((state) => state.openWholesaleModal)
  const isMayoristaUser = isMayorista(user?.role)

  useEffect(() => {
    if (!isMayoristaUser) {
      openWholesaleModal()
    }
  }, [isMayoristaUser, openWholesaleModal])

  if (!isMayoristaUser) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Catálogo mayorista</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          Necesitas activar tu acceso mayorista para ver precios y productos al por mayor.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={openWholesaleModal}
            className="rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Ingresar clave de acceso
          </button>
          <Link
            to="/catalogo"
            className="rounded-full border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            Volver al catálogo
          </Link>
        </div>
      </div>
    )
  }

  return children
}
