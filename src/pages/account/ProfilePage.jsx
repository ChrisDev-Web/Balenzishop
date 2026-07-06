import { useState, useEffect } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { getRoleLabel, isMayorista } from '../../utils/pricing'
import { DOCUMENT_TYPES, validateDocument, formatDocumentInput } from '../../utils/documentValidation'
import PasswordInput from '../../components/ui/PasswordInput'

export default function ProfilePage() {
  const { user, updateProfile } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    firstName: '',
    lastNamePaternal: '',
    lastNameMaternal: '',
    email: '',
    documentType: 'DNI',
    documentId: '',
    phone: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastNamePaternal: user.lastNamePaternal || '',
        lastNameMaternal: user.lastNameMaternal || '',
        email: user.email || '',
        documentType: user.documentType || 'DNI',
        documentId: user.documentId || '',
        phone: user.phone || '',
        newPassword: '',
        confirmPassword: '',
      })
    }
  }, [user])

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

  const handleCancel = () => {
    setEditing(false)
    setMessage('')
    setForm({
      firstName: user?.firstName || '',
      lastNamePaternal: user?.lastNamePaternal || '',
      lastNameMaternal: user?.lastNameMaternal || '',
      email: user?.email || '',
      documentType: user?.documentType || 'DNI',
      documentId: user?.documentId || '',
      phone: user?.phone || '',
      newPassword: '',
      confirmPassword: '',
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setMessage('')

    if (!form.firstName.trim()) {
      setMessage('El nombre es obligatorio')
      return
    }

    const docError = validateDocument(form.documentType, form.documentId)
    if (docError) {
      setMessage(docError)
      return
    }

    if (form.newPassword && form.newPassword.length < 6) {
      setMessage('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setMessage('Las contraseñas no coinciden')
      return
    }

    updateProfile({
      firstName: form.firstName,
      lastNamePaternal: form.lastNamePaternal,
      lastNameMaternal: form.lastNameMaternal,
      documentType: form.documentType,
      documentId: form.documentId,
      phone: form.phone,
      ...(form.newPassword ? { password: form.newPassword } : {}),
    })

    setMessage('Datos actualizados correctamente')
    setEditing(false)
    setForm((prev) => ({ ...prev, newPassword: '', confirmPassword: '' }))
  }

  const showRole = isMayorista(user?.role)

  const readOnlyFields = [
    { name: 'firstName', label: 'Nombre' },
    { name: 'lastNamePaternal', label: 'Apellido paterno' },
    { name: 'lastNameMaternal', label: 'Apellido materno' },
    { name: 'email', label: 'Email' },
    {
      name: 'documentDisplay',
      label: 'Documento de identidad',
      value: user?.documentId
        ? `${DOCUMENT_TYPES[user.documentType]?.label || user.documentType}: ${user.documentId}`
        : '',
    },
    { name: 'phone', label: 'Teléfono' },
    ...(showRole
      ? [{ name: 'role', label: 'Rol del usuario', value: getRoleLabel(user?.role) }]
      : []),
  ]

  const inputClass = editing
    ? 'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base md:text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900'
    : 'mt-1 w-full border-0 bg-transparent px-0 py-2 text-sm text-gray-900 focus:outline-none'

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Perfil</h1>
      <p className="mt-1 text-sm text-gray-600">
        Actualiza tus datos de sesión, correo electrónico y contraseña
      </p>

      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Datos personales</h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            {!editing ? (
              readOnlyFields.map(({ name, label, value }) => (
                <div key={name}>
                  <label className="block border-b border-dashed border-gray-300 pb-1 text-sm font-medium text-gray-700">
                    {label}
                  </label>
                  <p className="mt-1 py-2 text-sm text-gray-900">
                    {value ?? form[name] ?? '—'}
                  </p>
                </div>
              ))
            ) : (
              <>
                {[
                  { name: 'firstName', label: 'Nombre *' },
                  { name: 'lastNamePaternal', label: 'Apellido paterno' },
                  { name: 'lastNameMaternal', label: 'Apellido materno' },
                ].map(({ name, label }) => (
                  <div key={name}>
                    <label className="block text-sm font-medium text-gray-700">{label}</label>
                    <input
                      name={name}
                      value={form[name]}
                      onChange={handleChange}
                      required={name === 'firstName'}
                      className={inputClass}
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    value={form.email}
                    disabled
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo de documento</label>
                  <select
                    name="documentType"
                    value={form.documentType}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    {Object.entries(DOCUMENT_TYPES).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Número de documento ({DOCUMENT_TYPES[form.documentType].digits} dígitos)
                  </label>
                  <input
                    name="documentId"
                    value={form.documentId}
                    onChange={handleChange}
                    inputMode="numeric"
                    maxLength={DOCUMENT_TYPES[form.documentType].digits}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                {showRole && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rol del usuario</label>
                    <input
                      value={getRoleLabel(user?.role)}
                      disabled
                      className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold uppercase text-gray-700"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {editing && (
            <div className="border-t border-gray-100 pt-5">
              <h3 className="text-sm font-bold text-gray-900">Cambiar contraseña (opcional)</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm text-gray-600">Nueva contraseña</label>
                  <PasswordInput
                    name="newPassword"
                    value={form.newPassword}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base md:text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Confirmar contraseña</label>
                  <PasswordInput
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base md:text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>
              </div>
            </div>
          )}

          {message && (
            <p className={`text-sm ${message.includes('correctamente') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}

          <div className="pt-2">
            {editing ? (
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="rounded-full bg-black px-8 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  Guardar cambios
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-full border border-gray-300 px-6 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-full bg-black px-8 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Editar datos
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
