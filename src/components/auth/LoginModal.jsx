import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuthStore } from '../../stores/authStore'
import { useUiStore } from '../../stores/uiStore'
import { useCartStore } from '../../stores/cartStore'
import { getRouteAfterLogin, AUTH_INTENT } from '../../utils/authFlow'
import PasswordInput from '../ui/PasswordInput'

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base md:text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900'

function decodeGoogleJwt(token) {
  const payload = token.split('.')[1]
  const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
  return JSON.parse(decoded)
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
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { loginWithEmail, registerWithEmail, loginWithGoogle } = useAuthStore()
  const authIntent = useUiStore((s) => s.authIntent)
  const clearAuthIntent = useUiStore((s) => s.clearAuthIntent)
  const navigate = useNavigate()

  if (!isOpen) return null

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

  const handleEmailLogin = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = loginWithEmail(email, password)
    setLoading(false)
    if (result.success) {
      handleSuccess(result.needsProfile)
    } else {
      setError(result.error)
    }
  }

  const handleRegister = (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setLoading(true)
    const result = registerWithEmail({
      email,
      password,
      firstName: '',
      lastNamePaternal: '',
      lastNameMaternal: '',
      documentId: '',
      phone: '',
      profileComplete: false,
      addresses: [],
      orders: [],
      authProvider: 'email',
    })
    setLoading(false)
    if (result.success) {
      handleSuccess(true)
    } else {
      setError(result.error)
    }
  }

  const handleGoogleSuccess = (response) => {
    try {
      const decoded = decodeGoogleJwt(response.credential)
      const result = loginWithGoogle(decoded.email)
      if (result.success) {
        handleSuccess(result.needsProfile)
      }
    } catch {
      setError('Error al iniciar sesión con Google')
    }
  }

  const reset = () => {
    setView('options')
    setError('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => { onClose(); reset() }} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
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
              {error && <p className="text-sm text-gray-900">{error}</p>}
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
            <form onSubmit={handleRegister} className="mt-6 space-y-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirmar contraseña</label>
                <PasswordInput
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
              {error && <p className="text-sm text-gray-900">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="btn-fill w-full rounded-full py-3 text-sm disabled:opacity-50"
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
