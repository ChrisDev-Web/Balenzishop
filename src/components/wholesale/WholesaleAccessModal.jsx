import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { MessageCircle, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useUiStore } from '../../stores/uiStore'
import { activateWholesaleAccess } from '../../api/clients'
import { AUTH_INTENT } from '../../utils/authFlow'
import { buildWhatsappAccessUrl } from '../../utils/shoppingMode'
import { isMayorista } from '../../utils/pricing'
import useBodyScrollLock from '../../hooks/useBodyScrollLock'

export default function WholesaleAccessModal() {
  const navigate = useNavigate()
  const isOpen = useUiStore((state) => state.wholesaleModalOpen)
  const closeWholesaleModal = useUiStore((state) => state.closeWholesaleModal)
  const openLoginModal = useUiStore((state) => state.openLoginModal)
  const { isAuthenticated, user, accessToken, bootstrapSession } = useAuthStore()
  const [accessCode, setAccessCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useBodyScrollLock(isOpen)

  useEffect(() => {
    if (!isOpen) {
      setAccessCode('')
      setError('')
      setLoading(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const isMayoristaUser = isMayorista(user?.role)

  async function handleActivate(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await activateWholesaleAccess(accessCode, accessToken)

      if (!response.success) {
        throw new Error(response.message || 'No se pudo activar el acceso mayorista')
      }

      await bootstrapSession()
      closeWholesaleModal()
      navigate('/mayorista')
    } catch (activateError) {
      setError(activateError.message || 'No se pudo activar el acceso mayorista')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    closeWholesaleModal()
  }

  return createPortal(
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/50 p-4">
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wholesale-access-title"
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 id="wholesale-access-title" className="pr-8 text-2xl font-bold text-gray-900">
          Al por mayor
        </h2>

        {!isAuthenticated ? (
          <>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Para solicitar tu clave de acceso mayorista primero debes iniciar sesión.
              Si aún no tienes cuenta, regístrate y vuelve a esta sección.
            </p>

            <button
              type="button"
              onClick={() => {
                closeWholesaleModal()
                openLoginModal(AUTH_INTENT.WHOLESALE)
              }}
              className="btn-fill mt-6 w-full rounded-full py-3.5 text-sm font-semibold"
            >
              Iniciar sesión
            </button>

            <p className="mt-5 text-center text-sm text-gray-600">
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => {
                  closeWholesaleModal()
                  openLoginModal(AUTH_INTENT.WHOLESALE)
                }}
                className="font-semibold text-gray-900 underline hover:no-underline"
              >
                Regístrate
              </button>
            </p>
          </>
        ) : isMayoristaUser ? (
          <>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Tu cuenta ya tiene acceso mayorista. Puedes ingresar al catálogo mayorista.
            </p>
            <button
              type="button"
              onClick={() => {
                closeWholesaleModal()
                navigate('/mayorista')
              }}
              className="btn-fill mt-6 w-full rounded-full py-3.5 text-sm font-semibold"
            >
              Ir a Mayorista
            </button>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Ingresa tu clave de acceso mayorista. Si aún no la tienes, solicítala por WhatsApp.
            </p>

            <form onSubmit={handleActivate} className="mt-5 space-y-4">
              <div>
                <label htmlFor="wholesale-access-code" className="text-sm font-medium text-gray-700">
                  Clave de acceso mayorista
                </label>
                <input
                  id="wholesale-access-code"
                  type="text"
                  value={accessCode}
                  onChange={(event) => setAccessCode(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder="Ingresa tu clave"
                  autoComplete="off"
                  disabled={loading}
                />
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <button
                type="submit"
                disabled={loading || !accessCode.trim()}
                className="btn-fill w-full rounded-full py-3.5 text-sm font-semibold disabled:opacity-60"
              >
                {loading ? 'Validando…' : 'Activar acceso mayorista'}
              </button>
            </form>

            <a
              href={buildWhatsappAccessUrl(user)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-green-600 px-4 py-3 text-sm font-semibold text-green-700 hover:bg-green-50"
            >
              <MessageCircle className="h-4 w-4" />
              Solicitar clave por WhatsApp
            </a>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
