import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useUiStore } from '../../stores/uiStore'
import { useCartStore } from '../../stores/cartStore'
import { useDocumentTypes } from '../../hooks/useDocumentTypes'
import { getRouteAfterLogin, AUTH_INTENT, isAuthSetupRoute } from '../../utils/authFlow'
import {
  formatDocumentInputById,
  getDocumentDigits,
  validateDocumentById,
} from '../../utils/documentValidation'
import PasswordInput from '../ui/PasswordInput'
import { mapRegisterApiFieldErrors } from '../../utils/registerValidation'

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base md:text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900'

function fieldInputClass(hasError) {
  return `${inputClass}${hasError ? ' border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`
}

function FieldError({ message }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-red-600">{message}</p>
}

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

export default function LoginModal({ isOpen, onClose }) {
  const [view, setView] = useState('options')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [registerForm, setRegisterForm] = useState(emptyRegisterForm)
  const [registerErrors, setRegisterErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { loginWithEmail, registerWithEmail } = useAuthStore()
  const { documentTypes, loading: documentTypesLoading } = useDocumentTypes({ enabled: isOpen })
  const authIntent = useUiStore((s) => s.authIntent)
  const authReturnTo = useUiStore((s) => s.authReturnTo)
  const finishAuthFlow = useUiStore((s) => s.finishAuthFlow)
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

    const nextRoute = getRouteAfterLogin(currentUser, authIntent, authReturnTo)

    if (!isAuthSetupRoute(nextRoute)) {
      finishAuthFlow()
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

    setRegisterErrors((prev) => {
      if (!prev[name]) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })

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
    setRegisterErrors({})

    const clientErrors = {}

    if (!registerForm.firstName.trim()) {
      clientErrors.firstName = 'El nombre es obligatorio'
    }

    if (!registerForm.lastNamePaternal.trim()) {
      clientErrors.lastNamePaternal = 'El apellido paterno es obligatorio'
    }

    const docError = validateDocumentById(
      documentTypes,
      registerForm.idDocumentType,
      registerForm.documentId,
    )
    if (docError) {
      clientErrors.documentId = docError
    }

    if (!registerForm.email.trim()) {
      clientErrors.email = 'El correo electrónico es obligatorio'
    }

    if (registerForm.password.length < 6) {
      clientErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    }

    if (registerForm.password !== registerForm.passwordConfirm) {
      clientErrors.passwordConfirm = 'Las contraseñas no coinciden'
    }

    if (Object.keys(clientErrors).length > 0) {
      setRegisterErrors(clientErrors)
      return
    }

    setLoading(true)
    const result = await registerWithEmail(registerForm)
    setLoading(false)

    if (result.success) {
      handleSuccess(result.needsProfile)
    } else if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
      setRegisterErrors(mapRegisterApiFieldErrors(result.fieldErrors))
    } else {
      setError(result.error)
    }
  }

  const reset = () => {
    setView('options')
    setError('')
    setRegisterErrors({})
    setEmail('')
    setPassword('')
    setRegisterForm(emptyRegisterForm)
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => { onClose(); reset() }} />
      <div
        className={`relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-8 shadow-2xl sm:max-h-[90vh] sm:rounded-2xl ${
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
                  : 'Inicia sesión con tu correo y contraseña'}
            </p>

            <div className="mt-8">
              <button
                type="button"
                onClick={() => setView('login')}
                className="btn-fill w-full rounded-full py-3.5 text-sm"
              >
                Ingresar con correo y contraseña
              </button>
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
                  className={fieldInputClass(registerErrors.firstName)}
                  aria-invalid={Boolean(registerErrors.firstName)}
                />
                <FieldError message={registerErrors.firstName} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Apellido paterno *</label>
                <input
                  name="lastNamePaternal"
                  required
                  value={registerForm.lastNamePaternal}
                  onChange={handleRegisterChange}
                  className={fieldInputClass(registerErrors.lastNamePaternal)}
                  aria-invalid={Boolean(registerErrors.lastNamePaternal)}
                />
                <FieldError message={registerErrors.lastNamePaternal} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Apellido materno</label>
                <input
                  name="lastNameMaternal"
                  value={registerForm.lastNameMaternal}
                  onChange={handleRegisterChange}
                  className={fieldInputClass(registerErrors.lastNameMaternal)}
                  aria-invalid={Boolean(registerErrors.lastNameMaternal)}
                />
                <FieldError message={registerErrors.lastNameMaternal} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                <input
                  name="phone"
                  type="tel"
                  value={registerForm.phone}
                  onChange={handleRegisterChange}
                  className={fieldInputClass(registerErrors.phone)}
                  aria-invalid={Boolean(registerErrors.phone)}
                />
                <FieldError message={registerErrors.phone} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo de documento *</label>
                <select
                  name="idDocumentType"
                  required
                  value={registerForm.idDocumentType}
                  onChange={handleRegisterChange}
                  disabled={documentTypesLoading || documentTypes.length === 0}
                  className={fieldInputClass(registerErrors.idDocumentType)}
                  aria-invalid={Boolean(registerErrors.idDocumentType)}
                >
                  {documentTypes.length === 0 ? (
                    <option value="">Cargando...</option>
                  ) : (
                    documentTypes.map((type) => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))
                  )}
                </select>
                <FieldError message={registerErrors.idDocumentType} />
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
                  className={fieldInputClass(registerErrors.documentId)}
                  aria-invalid={Boolean(registerErrors.documentId)}
                />
                <FieldError message={registerErrors.documentId} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Correo electrónico *</label>
                <input
                  name="email"
                  type="email"
                  required
                  value={registerForm.email}
                  onChange={handleRegisterChange}
                  className={fieldInputClass(registerErrors.email)}
                  aria-invalid={Boolean(registerErrors.email)}
                />
                <FieldError message={registerErrors.email} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contraseña *</label>
                <PasswordInput
                  name="password"
                  required
                  value={registerForm.password}
                  onChange={handleRegisterChange}
                  className={fieldInputClass(registerErrors.password)}
                  aria-invalid={Boolean(registerErrors.password)}
                />
                <FieldError message={registerErrors.password} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirmar contraseña *</label>
                <PasswordInput
                  name="passwordConfirm"
                  required
                  value={registerForm.passwordConfirm}
                  onChange={handleRegisterChange}
                  className={fieldInputClass(registerErrors.passwordConfirm)}
                  aria-invalid={Boolean(registerErrors.passwordConfirm)}
                />
                <FieldError message={registerErrors.passwordConfirm} />
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
    </div>,
    document.body,
  )
}
