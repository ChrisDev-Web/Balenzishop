import { useState, useMemo, useEffect } from 'react'
import { X, MapPin, Star, Pencil } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { cities, getDistrictsForCity, getShalonsForDistrict } from '../../data/shalonLocations'

const selectClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none'

export default function AddressModal({ address, initialMode = 'view', onClose }) {
  const { updateAddress } = useAuthStore()
  const [editing, setEditing] = useState(initialMode === 'edit')
  const [form, setForm] = useState({
    city: address.city || '',
    district: address.district || '',
    shalon: address.shalon || '',
    isPrimary: address.isPrimary || false,
  })
  const [error, setError] = useState('')

  const districts = useMemo(() => getDistrictsForCity(form.city), [form.city])
  const shalons = useMemo(() => getShalonsForDistrict(form.district), [form.district])

  useEffect(() => {
    setEditing(initialMode === 'edit')
    setForm({
      city: address.city || '',
      district: address.district || '',
      shalon: address.shalon || '',
      isPrimary: address.isPrimary || false,
    })
    setError('')
  }, [address, initialMode])

  const handleCityChange = (e) => {
    setForm({ city: e.target.value, district: '', shalon: '', isPrimary: form.isPrimary })
  }

  const handleDistrictChange = (e) => {
    setForm((prev) => ({ ...prev, district: e.target.value, shalon: '' }))
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSave = (e) => {
    e.preventDefault()
    setError('')

    if (!form.city || !form.district || !form.shalon) {
      setError('Completa ciudad, distrito y punto de recojo')
      return
    }

    updateAddress(address.id, form)
    onClose()
  }

  const handleCancelEdit = () => {
    setForm({
      city: address.city || '',
      district: address.district || '',
      shalon: address.shalon || '',
      isPrimary: address.isPrimary || false,
    })
    setError('')
    setEditing(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-labelledby="address-modal-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 id="address-modal-title" className="text-lg font-bold text-gray-900">
            {editing ? 'Editar dirección' : 'Detalle de dirección'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {!editing ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-4">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gray-700" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-900">
                      {address.district}, {address.city}
                    </p>
                    {address.isPrimary && (
                      <span className="flex items-center gap-1 rounded-full bg-black px-2 py-0.5 text-xs font-medium text-white">
                        <Star className="h-3 w-3" /> Principal
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="font-medium text-gray-500">Ciudad</dt>
                  <dd className="mt-0.5 text-gray-900">{address.city}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Distrito</dt>
                  <dd className="mt-0.5 text-gray-900">{address.district}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Punto de recojo Shalon</dt>
                  <dd className="mt-0.5 text-gray-900">{address.shalon || '—'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Tipo</dt>
                  <dd className="mt-0.5 text-gray-900">
                    {address.isPrimary ? 'Dirección principal' : 'Dirección secundaria'}
                  </dd>
                </div>
              </dl>
            </div>
          ) : (
            <form id="address-edit-form" onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600">Ciudad *</label>
                <select name="city" value={form.city} onChange={handleCityChange} required className={selectClass}>
                  <option value="">Selecciona una ciudad</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600">Distrito *</label>
                <select
                  name="district"
                  value={form.district}
                  onChange={handleDistrictChange}
                  required
                  disabled={!form.city}
                  className={selectClass}
                >
                  <option value="">Selecciona un distrito</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600">Recojo en Shalon *</label>
                <select
                  name="shalon"
                  value={form.shalon}
                  onChange={handleChange}
                  required
                  disabled={!form.district}
                  className={selectClass}
                >
                  <option value="">
                    {form.district ? 'Selecciona un Shalon cercano' : 'Primero elige ciudad y distrito'}
                  </option>
                  {shalons.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  name="isPrimary"
                  checked={form.isPrimary}
                  onChange={handleChange}
                  className="accent-gray-900"
                />
                Establecer como dirección principal
              </label>

              {error && <p className="text-sm text-red-600">{error}</p>}
            </form>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t px-5 py-4 sm:flex-row">
          {!editing ? (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-black py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
              >
                <Pencil className="h-4 w-4" />
                Editar
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cerrar
              </button>
            </>
          ) : (
            <>
              <button
                type="submit"
                form="address-edit-form"
                className="flex-1 rounded-full bg-black py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Guardar cambios
              </button>
              <button
                type="button"
                onClick={initialMode === 'edit' ? onClose : handleCancelEdit}
                className="flex-1 rounded-full border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
