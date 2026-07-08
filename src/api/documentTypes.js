import { apiGet } from './client'

export async function fetchActiveDocumentTypes() {
  const response = await apiGet('document_types/list_active_public')
  return response.data.map((type) => ({
    id: type.id_document_type,
    name: type.name,
    description: type.description,
    ...type,
  }))
}
