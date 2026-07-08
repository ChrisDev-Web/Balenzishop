export const DOCUMENT_TYPES = {
  DNI: { label: 'DNI', digits: 8 },
  CE: { label: 'Carné de Extranjería', digits: 9 },
}

export function getDocumentDigits(documentTypeName = '') {
  const normalized = documentTypeName.toLowerCase()
  if (normalized.includes('dni')) return 8
  if (normalized.includes('extranjer')) return 9
  return 9
}

export function validateDocument(documentType, documentId) {
  if (!documentType) return 'Selecciona un tipo de documento'
  if (!documentId?.trim()) return 'Ingresa el número de documento'

  const digits = documentId.replace(/\D/g, '')
  const config = DOCUMENT_TYPES[documentType]

  if (config) {
    if (digits.length !== config.digits) {
      return `El ${config.label} debe tener ${config.digits} dígitos`
    }
    return null
  }

  const expected = getDocumentDigits(documentType)
  if (digits.length !== expected) {
    return `El documento debe tener ${expected} dígitos`
  }

  return null
}

export function validateDocumentById(documentTypes, idDocumentType, documentId) {
  const selected = documentTypes.find((type) => type.id === Number(idDocumentType))
  if (!selected) return 'Selecciona un tipo de documento'
  return validateDocument(selected.name, documentId)
}

export function formatDocumentInput(documentTypeOrName, value) {
  const digits = value.replace(/\D/g, '')
  const max = DOCUMENT_TYPES[documentTypeOrName]?.digits
    ?? getDocumentDigits(documentTypeOrName)
  return digits.slice(0, max)
}

export function formatDocumentInputById(documentTypes, idDocumentType, value) {
  const selected = documentTypes.find((type) => type.id === Number(idDocumentType))
  const label = selected?.name || ''
  return formatDocumentInput(label, value)
}
