import { mapDirectionToAddress, sortAddresses } from './addressMapper'

export function mapMasterBeneficiaryToCheckoutUser(beneficiary) {
  if (!beneficiary) return null

  return {
    id: String(beneficiary.id_client),
    idClient: beneficiary.id_client,
    firstName: beneficiary.name || '',
    lastNamePaternal: beneficiary.last_name_paternal || '',
    lastNameMaternal: beneficiary.last_name_maternal || '',
    phone: beneficiary.phone || '',
    documentId: beneficiary.document_number || '',
    idDocumentType: beneficiary.id_document_type,
    documentTypeName: beneficiary.document_type_name || 'DNI',
    email: '',
  }
}

export function mapMasterBeneficiaryAddresses(apiAddresses = []) {
  return sortAddresses(apiAddresses.map(mapDirectionToAddress).filter(Boolean))
}

export function formatMasterBeneficiaryName(beneficiary) {
  if (!beneficiary) return '—'

  return [beneficiary.name, beneficiary.last_name_paternal, beneficiary.last_name_maternal]
    .filter(Boolean)
    .join(' ')
}
