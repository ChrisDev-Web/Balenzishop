import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useUiStore } from '../../stores/uiStore'
import { useDocumentTypes } from '../../hooks/useDocumentTypes'
import { getRouteAfterLogin, getRouteAfterProfile, isAuthSetupRoute } from '../../utils/authFlow'
import {
  formatDocumentInputById,
  getDocumentDigits,
  validateDocumentById,
} from '../../utils/documentValidation'

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
  const authReturnTo = useUiStore((s) => s.authReturnTo)
  const finishAuthFlow = useUiStore((s) => s.finishAuthFlow)
  const { documentTypes, loading: documentTypesLoading } = useDocumentTypes()
  const [form, setForm] = useState({
    firstName: '',
    lastNamePaternal: '',
    lastNameMaternal: '',
    idDocumentType: '',
    documentId: '',
    phone: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return

    setForm({
      firstName: user.firstName || '',
      lastNamePaternal: user.lastNamePaternal || '',
      lastNameMaternal: user.lastNameMaternal || '',
      idDocumentType: user.idDocumentType ? String(user.idDocumentType) : '',
      documentId: user.documentId || '',
      phone: user.phone || '',
    })
  }, [user])

  useEffect(() => {
    if (!form.idDocumentType && documentTypes.length > 0) {
      setForm((prev) => ({
        ...prev,
        idDocumentType: String(documentTypes[0].id),
      }))
    }
  }, [documentTypes, form.idDocumentType])

  useEffect(() => {
    if (!user?.profileComplete) return
    const next = getRouteAfterLogin(user, authIntent, authReturnTo)
    if (!isAuthSetupRoute(next)) {
      finishAuthFlow()
    }
  }, [user, authIntent, authReturnTo, finishAuthFlow])

  if (user?.profileComplete) {
    return <Navigate to={getRouteAfterLogin(user, authIntent, authReturnTo)} replace />
  }

  const selectedDocumentType = documentTypes.find(
    (type) => type.id === Number(form.idDocumentType),
  )

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === 'documentId') {
      setForm((prev) => ({
        ...prev,
        documentId: formatDocumentInputById(documentTypes, prev.idDocumentType, value),
      }))
      return
    }

    if (name === 'idDocumentType') {
      setForm((prev) => ({
        ...prev,
        idDocumentType: value,
        documentId: formatDocumentInputById(documentTypes, value, prev.documentId),
      }))
      return
    }

    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.firstName.trim()) {
      setError('El nombre es obligatorio')
      return
    }

    const docError = validateDocumentById(documentTypes, form.idDocumentType, form.documentId)
    if (docError) {
      setError(docError)
      return
    }

    setLoading(true)
    const result = await completeProfile({
      firstName: form.firstName,
      lastNamePaternal: form.lastNamePaternal,
      lastNameMaternal: form.lastNameMaternal,
      idDocumentType: Number(form.idDocumentType),
      documentId: form.documentId,
      phone: form.phone,
      email: user.email,
    })
    setLoading(false)

    if (result.success) {
      const updatedUser = useAuthStore.getState().user
      const next = getRouteAfterProfile(updatedUser, authIntent, authReturnTo)
      if (!isAuthSetupRoute(next)) {
        finishAuthFlow()
      }
      navigate(next)
    } else {
      setError(result.error)
    }
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
          <Field label="Correo electrónico" className="sm:col-span-2">
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500"
            />
          </Field>

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

          <Field label="Tipo de documento *">
            <select
              name="idDocumentType"
              value={form.idDocumentType}
              onChange={handleChange}
              required
              disabled={documentTypesLoading || documentTypes.length === 0}
              className={fieldClass}
            >
              {documentTypes.length === 0 ? (
                <option value="">Cargando...</option>
              ) : (
                documentTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))
              )}
            </select>
          </Field>
          <Field
            label={`Número de documento *${
              selectedDocumentType
                ? ` (${getDocumentDigits(selectedDocumentType.name)} dígitos)`
                : ''
            }`}
          >
            <input
              name="documentId"
              value={form.documentId}
              onChange={handleChange}
              required
              inputMode="numeric"
              className={fieldClass}
            />
          </Field>
        </div>

        {error && <p className="mt-5 text-center text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading || documentTypesLoading}
          className="btn-fill mt-6 w-full rounded-full py-3 text-sm disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar y continuar'}
        </button>
      </form>
    </div>
  )
}
