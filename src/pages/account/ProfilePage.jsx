import { useState, useEffect } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useDocumentTypes } from '../../hooks/useDocumentTypes'
import {
  formatDocumentInputById,
  getDocumentDigits,
  validateDocumentById,
} from '../../utils/documentValidation'

export default function ProfilePage() {
  const { user, updateProfile } = useAuthStore()
  const { documentTypes } = useDocumentTypes()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    firstName: '',
    lastNamePaternal: '',
    lastNameMaternal: '',
    email: '',
    idDocumentType: '',
    documentId: '',
    phone: '',
  })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastNamePaternal: user.lastNamePaternal || '',
        lastNameMaternal: user.lastNameMaternal || '',
        email: user.email || '',
        idDocumentType: user.idDocumentType ? String(user.idDocumentType) : '',
        documentId: user.documentId || '',
        phone: user.phone || '',
      })
    }
  }, [user])

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

  const handleCancel = () => {
    setEditing(false)
    setMessage('')
    setForm({
      firstName: user?.firstName || '',
      lastNamePaternal: user?.lastNamePaternal || '',
      lastNameMaternal: user?.lastNameMaternal || '',
      email: user?.email || '',
      idDocumentType: user?.idDocumentType ? String(user.idDocumentType) : '',
      documentId: user?.documentId || '',
      phone: user?.phone || '',
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')

    if (!form.firstName.trim()) {
      setMessage('El nombre es obligatorio')
      return
    }

    const docError = validateDocumentById(documentTypes, form.idDocumentType, form.documentId)
    if (docError) {
      setMessage(docError)
      return
    }

    setLoading(true)
    const result = await updateProfile({
      firstName: form.firstName,
      lastNamePaternal: form.lastNamePaternal,
      lastNameMaternal: form.lastNameMaternal,
      idDocumentType: Number(form.idDocumentType),
      documentId: form.documentId,
      phone: form.phone,
    })
    setLoading(false)

    if (result.success) {
      setMessage('Datos actualizados correctamente')
      setEditing(false)
    } else {
      setMessage(result.error)
    }
  }

  const isMayoristaClient = user?.idClientType === 2

  const readOnlyFields = [
    { name: 'firstName', label: 'Nombre' },
    { name: 'lastNamePaternal', label: 'Apellido paterno' },
    { name: 'lastNameMaternal', label: 'Apellido materno' },
    { name: 'email', label: 'Email' },
    {
      name: 'documentDisplay',
      label: 'Documento de identidad',
      value: user?.documentId
        ? `${user.documentTypeName || 'Documento'}: ${user.documentId}`
        : '',
    },
    { name: 'phone', label: 'Teléfono' },
    ...(isMayoristaClient
      ? [{
          name: 'clientType',
          label: 'Tipo de Cliente',
          value: user?.clientTypeName || 'Mayorista',
        }]
      : []),
  ]

  const inputClass = editing
    ? 'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base md:text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900'
    : 'mt-1 w-full border-0 bg-transparent px-0 py-2 text-sm text-gray-900 focus:outline-none'

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Perfil</h1>
      <p className="mt-1 text-sm text-gray-600">
        Actualiza tus datos personales de cliente
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
                    name="idDocumentType"
                    value={form.idDocumentType}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    {documentTypes.map((type) => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Número de documento
                    {selectedDocumentType
                      ? ` (${getDocumentDigits(selectedDocumentType.name)} dígitos)`
                      : ''}
                  </label>
                  <input
                    name="documentId"
                    value={form.documentId}
                    onChange={handleChange}
                    inputMode="numeric"
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

                {isMayoristaClient && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Cliente</label>
                    <input
                      value={user?.clientTypeName || 'Mayorista'}
                      disabled
                      className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold uppercase text-gray-700"
                    />
                  </div>
                )}
              </>
            )}
          </div>

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
                  disabled={loading}
                  className="rounded-full bg-black px-8 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar cambios'}
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
