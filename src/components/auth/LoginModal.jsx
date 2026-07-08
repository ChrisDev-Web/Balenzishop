import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuthStore } from '../../stores/authStore'
import { useUiStore } from '../../stores/uiStore'
import { useCartStore } from '../../stores/cartStore'
import { useDocumentTypes } from '../../hooks/useDocumentTypes'
import { getRouteAfterLogin, AUTH_INTENT } from '../../utils/authFlow'
import {
  formatDocumentInputById,
  getDocumentDigits,
  validateDocumentById,
} from '../../utils/documentValidation'
import PasswordInput from '../ui/PasswordInput'

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base md:text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900'

const emptyRegisterForm = {
  firstName: '',
  lastNamePaternal: '',
  lastNameMaternal: '',
  phone: '',
  idDocumentType: '',
  documentId: '',
  email: '',
  password: '',
  passwordConfirm: '',
}

function GoogleLoginButton({ onSuccess, onError }) {
  const containerRef = useRef(null)
  const [width, setWidth] = useState(320)

  useEffect(() => {
    const node = containerRef.current
    if (!node) return undefined

    const updateWidth = () => {
      setWidth(Math.max(200, Math.floor(node.getBoundingClientRect().width)))
    }

    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="w-full [&>div]:!w-full [&>div>div]:!w-full [& iframe]:!w-full">
      <GoogleLogin
        onSuccess={onSuccess}
        onError={onError}
        theme="outline"
        size="large"
        text="signin_with"
        shape="pill"
        width={width}
      />
    </div>
  )
}

export default function LoginModal({ isOpen, onClose }) {
  const [view, setView] = useState('options')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [registerForm, setRegisterForm] = useState(emptyRegisterForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { loginWithEmail, registerWithEmail, loginWithGoogle } = useAuthStore()
  const { documentTypes, loading: documentTypesLoading } = useDocumentTypes()
  const authIntent = useUiStore((s) => s.authIntent)
  const clearAuthIntent = useUiStore((s) => s.clearAuthIntent)
  const navigate = useNavigate()

  useEffect(() => {
    if (!registerForm.idDocumentType && documentTypes.length > 0) {
      setRegisterForm((prev) => ({
        ...prev,
        idDocumentType: String(documentTypes[0].id),
      }))
    }
  }, [documentTypes, registerForm.idDocumentType])

  if (!isOpen) return null

  const selectedDocumentType = documentTypes.find(
    (type) => type.id === Number(registerForm.idDocumentType),
  )

  const handleSuccess = (needsProfile) => {
    onClose()
    setView('options')
    setError('')

    if (needsProfile) {
      navigate('/mi-cuenta/completar-perfil')
      return
    }

    const currentUser = useAuthStore.getState().user
    useCartStore.getState().syncWithUserRole(currentUser?.role)

    const nextRoute = getRouteAfterLogin(currentUser, authIntent)

    if (nextRoute === '/pedido' || nextRoute === '/mi-cuenta' || nextRoute === '/mi-cuenta/pedidos') {
      clearAuthIntent()
    }

    navigate(nextRoute)
  }

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await loginWithEmail(email, password)
    setLoading(false)
    if (result.success) {
      handleSuccess(result.needsProfile)
    } else {
      setError(result.error)
    }
  }

  const handleRegisterChange = (e) => {
    const { name, value } = e.target

    if (name === 'documentId') {
      setRegisterForm((prev) => ({
        ...prev,
        documentId: formatDocumentInputById(documentTypes, prev.idDocumentType, value),
      }))
      return
    }

    if (name === 'idDocumentType') {
      setRegisterForm((prev) => ({
        ...prev,
        idDocumentType: value,
        documentId: formatDocumentInputById(documentTypes, value, prev.documentId),
      }))
      return
    }

    setRegisterForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')

    if (!registerForm.firstName.trim()) {
      setError('El nombre es obligatorio')
      return
    }

    const docError = validateDocumentById(
      documentTypes,
      registerForm.idDocumentType,
      registerForm.documentId,
    )
    if (docError) {
      setError(docError)
      return
    }

    if (registerForm.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (registerForm.password !== registerForm.passwordConfirm) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    const result = await registerWithEmail(registerForm)
    setLoading(false)

    if (result.success) {
      handleSuccess(result.needsProfile)
    } else {
      setError(result.error)
    }
  }

  const handleGoogleSuccess = async () => {
    const result = await loginWithGoogle()
    if (result.success) {
      handleSuccess(result.needsProfile)
    } else {
      setError(result.error)
    }
  }

  const reset = () => {
    setView('options')
    setError('')
    setEmail('')
    setPassword('')
    setRegisterForm(emptyRegisterForm)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => { onClose(); reset() }} />
      <div
        className={`relative max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl ${
          view === 'register' ? 'max-w-3xl' : 'max-w-md'
        }`}
      >
        <button
          type="button"
          onClick={() => { onClose(); reset() }}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        {view === 'options' && (
          <>
            <h2 className="text-center text-2xl font-bold text-gray-900">Inicia sesión</h2>
            <p className="mt-2 text-center text-sm text-gray-500">
              {authIntent === AUTH_INTENT.CHECKOUT
                ? 'Inicia sesión para continuar con tu pedido'
                : authIntent === AUTH_INTENT.ORDERS
                  ? 'Inicia sesión para ver el historial de tus pedidos'
                  : 'Elige una de las opciones para iniciar sesión'}
            </p>

            <div className="mt-8 space-y-3">
              <button
                type="button"
                onClick={() => setView('login')}
                className="btn-fill w-full rounded-full py-3.5 text-sm"
              >
                Ingresar con correo y contraseña
              </button>

              <GoogleLoginButton
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Error al conectar con Google')}
              />
            </div>

            {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

            <p className="mt-6 text-center text-sm text-gray-600">
              ¿Eres nuevo en BalenziShop?{' '}
              <button
                type="button"
                onClick={() => setView('register')}
                className="font-semibold text-gray-900 underline hover:no-underline"
              >
                Regístrate
              </button>
            </p>
          </>
        )}

        {view === 'login' && (
          <>
            <h2 className="text-center text-2xl font-bold text-gray-900">Ingresar</h2>
            <form onSubmit={handleEmailLogin} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Correo electrónico</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                <PasswordInput
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="btn-fill w-full rounded-full py-3 text-sm disabled:opacity-50"
              >
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>
            <button type="button" onClick={reset} className="mt-4 w-full text-sm text-gray-500 hover:text-gray-900">
              ← Volver
            </button>
          </>
        )}

        {view === 'register' && (
          <>
            <h2 className="text-center text-2xl font-bold text-gray-900">Crear cuenta</h2>
            <form onSubmit={handleRegister} className="mt-6 grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre *</label>
                <input
                  name="firstName"
                  required
                  value={registerForm.firstName}
                  onChange={handleRegisterChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                <input
                  name="phone"
                  type="tel"
                  value={registerForm.phone}
                  onChange={handleRegisterChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Apellido paterno</label>
                <input
                  name="lastNamePaternal"
                  value={registerForm.lastNamePaternal}
                  onChange={handleRegisterChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Apellido materno</label>
                <input
                  name="lastNameMaternal"
                  value={registerForm.lastNameMaternal}
                  onChange={handleRegisterChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo de documento *</label>
                <select
                  name="idDocumentType"
                  required
                  value={registerForm.idDocumentType}
                  onChange={handleRegisterChange}
                  disabled={documentTypesLoading || documentTypes.length === 0}
                  className={inputClass}
                >
                  {documentTypes.length === 0 ? (
                    <option value="">Cargando...</option>
                  ) : (
                    documentTypes.map((type) => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Número de documento *
                  {selectedDocumentType
                    ? ` (${getDocumentDigits(selectedDocumentType.name)} dígitos)`
                    : ''}
                </label>
                <input
                  name="documentId"
                  required
                  value={registerForm.documentId}
                  onChange={handleRegisterChange}
                  inputMode="numeric"
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Correo electrónico *</label>
                <input
                  name="email"
                  type="email"
                  required
                  value={registerForm.email}
                  onChange={handleRegisterChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contraseña *</label>
                <PasswordInput
                  name="password"
                  required
                  value={registerForm.password}
                  onChange={handleRegisterChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirmar contraseña *</label>
                <PasswordInput
                  name="passwordConfirm"
                  required
                  value={registerForm.passwordConfirm}
                  onChange={handleRegisterChange}
                  className={inputClass}
                />
              </div>
              {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
              <button
                type="submit"
                disabled={loading || documentTypesLoading}
                className="btn-fill w-full rounded-full py-3 text-sm disabled:opacity-50 sm:col-span-2"
              >
                {loading ? 'Registrando...' : 'Registrarse'}
              </button>
            </form>
            <button type="button" onClick={reset} className="mt-4 w-full text-sm text-gray-500 hover:text-gray-900">
              ← Volver
            </button>
          </>
        )}
      </div>
    </div>
  )
}
