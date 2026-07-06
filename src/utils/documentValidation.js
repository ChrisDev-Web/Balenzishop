export const DOCUMENT_TYPES = {
  DNI: { label: 'DNI', digits: 8 },
  CE: { label: 'Carné de Extranjería', digits: 9 },
}

export function validateDocument(documentType, documentId) {
  if (!documentType) return 'Selecciona un tipo de documento'
  if (!documentId?.trim()) return 'Ingresa el número de documento'

  const digits = documentId.replace(/\D/g, '')
  const config = DOCUMENT_TYPES[documentType]
  if (!config) return 'Tipo de documento inválido'

  if (digits.length !== config.digits) {
    return `El ${config.label} debe tener ${config.digits} dígitos`
  }

  return null
}

export function formatDocumentInput(documentType, value) {
  const digits = value.replace(/\D/g, '')
  const max = DOCUMENT_TYPES[documentType]?.digits ?? 9
  return digits.slice(0, max)
}
