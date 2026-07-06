import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useUiStore } from '../../stores/uiStore'
import { getRouteAfterLogin, getRouteAfterProfile } from '../../utils/authFlow'
import { DOCUMENT_TYPES, validateDocument, formatDocumentInput } from '../../utils/documentValidation'
import PasswordInput from '../../components/ui/PasswordInput'

const fieldClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base md:text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900'

function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  )
}

export default function CompleteProfilePage() {
  const navigate = useNavigate()
  const { user, completeProfile } = useAuthStore()
  const authIntent = useUiStore((s) => s.authIntent)
  const [form, setForm] = useState({
    firstName: '',
    lastNamePaternal: '',
    lastNameMaternal: '',
    documentType: 'DNI',
    documentId: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')

  if (user?.profileComplete) {
    return <Navigate to={getRouteAfterLogin(user, authIntent)} replace />
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'documentId') {
      setForm((prev) => ({
        ...prev,
        documentId: formatDocumentInput(prev.documentType, value),
      }))
      return
    }
    if (name === 'documentType') {
      setForm((prev) => ({
        ...prev,
        documentType: value,
        documentId: formatDocumentInput(value, prev.documentId),
      }))
      return
    }
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!form.firstName.trim()) {
      setError('El nombre es obligatorio')
      return
    }

    const docError = validateDocument(form.documentType, form.documentId)
    if (docError) {
      setError(docError)
      return
    }

    if (form.password && form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    completeProfile({
      firstName: form.firstName,
      lastNamePaternal: form.lastNamePaternal,
      lastNameMaternal: form.lastNameMaternal,
      documentType: form.documentType,
      documentId: form.documentId,
      phone: form.phone,
      password: form.password || undefined,
      email: user.email,
    })
    navigate(getRouteAfterProfile(authIntent))
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Completa tu perfil</h1>
        <p className="mt-2 text-sm text-gray-600 md:text-base">
          Necesitamos algunos datos adicionales para personalizar tu experiencia
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-8 w-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:p-8"
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Fila 1 */}
          <Field label="Correo electrónico" className="sm:col-span-2">
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500"
            />
          </Field>

          {/* Fila 2 */}
          <Field label="Nombre *">
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              required
              autoComplete="given-name"
              className={fieldClass}
            />
          </Field>
          <Field label="Apellido paterno">
            <input
              name="lastNamePaternal"
              value={form.lastNamePaternal}
              onChange={handleChange}
              autoComplete="family-name"
              className={fieldClass}
            />
          </Field>

          {/* Fila 3 */}
          <Field label="Apellido materno">
            <input
              name="lastNameMaternal"
              value={form.lastNameMaternal}
              onChange={handleChange}
              autoComplete="additional-name"
              className={fieldClass}
            />
          </Field>
          <Field label="Teléfono">
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              autoComplete="tel"
              inputMode="tel"
              className={fieldClass}
            />
          </Field>

          {/* Fila 4 */}
          <Field label="Tipo de documento *">
            <select
              name="documentType"
              value={form.documentType}
              onChange={handleChange}
              required
              className={fieldClass}
            >
              {Object.entries(DOCUMENT_TYPES).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label={`Número de documento * (${DOCUMENT_TYPES[form.documentType].digits} dígitos)`}>
            <input
              name="documentId"
              value={form.documentId}
              onChange={handleChange}
              required
              inputMode="numeric"
              maxLength={DOCUMENT_TYPES[form.documentType].digits}
              placeholder={form.documentType === 'DNI' ? '12345678' : '123456789'}
              className={fieldClass}
            />
          </Field>

          {/* Fila 5 */}
          <Field label="Contraseña">
            <PasswordInput
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder={user?.authProvider === 'google' ? 'Crea una contraseña' : 'Nueva contraseña'}
              className={fieldClass}
            />
          </Field>
          <Field label="Confirmar contraseña">
            <PasswordInput
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              className={fieldClass}
            />
          </Field>
        </div>

        {error && <p className="mt-5 text-center text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          className="btn-fill mt-6 w-full rounded-full py-3 text-sm"
        >
          Guardar y continuar
        </button>
      </form>
    </div>
  )
}
