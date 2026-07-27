import { create } from 'zustand'
import { fetchActiveCompanyPublic } from '../api/companies'
import { applyCompanyBranding } from '../utils/companyBranding'
import { normalizeMediaUrl } from '../utils/mediaUrl'

let bootstrapCompanyPromise = null

function mapCompany(company) {
  if (!company) return null

  return {
    ...company,
    logo: normalizeMediaUrl(company.logo),
    tab_photo: normalizeMediaUrl(company.tab_photo),
  }
}

export const useCompanyStore = create((set, get) => ({
  company: null,
  isLoading: false,
  error: null,

  bootstrapCompany: async () => {
    if (get().company) {
      return get().company
    }

    if (bootstrapCompanyPromise) {
      return bootstrapCompanyPromise
    }

    set({ isLoading: true, error: null })

    bootstrapCompanyPromise = fetchActiveCompanyPublic()
      .then((company) => {
        const mapped = mapCompany(company)
        set({ company: mapped, isLoading: false, error: null })

        if (mapped) {
          applyCompanyBranding(mapped)
        }

        return mapped
      })
      .catch((error) => {
        set({ isLoading: false, error: error.message || 'No se pudo cargar la empresa' })
        return null
      })
      .finally(() => {
        bootstrapCompanyPromise = null
      })

    return bootstrapCompanyPromise
  },
}))

export function getActiveCompany() {
  return useCompanyStore.getState().company
}

export function getActiveWhatsAppDigits() {
  const whatsapp = getActiveCompany()?.whatsapp
  const digits = whatsapp ? String(whatsapp).replace(/\D/g, '') : ''
  return digits || '51924341477'
}
