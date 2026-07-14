import { USER_ROLES } from './pricing'
import { mapDirectionToAddress } from './addressMapper'

export function mapClientTypeToRole(clientTypeName) {
  return clientTypeName?.toLowerCase() === 'mayorista'
    ? USER_ROLES.MAYORISTA
    : USER_ROLES.MINORISTA
}

export function isProfileComplete(client) {
  return Boolean(
    client?.name?.trim() &&
    client?.document_number?.trim() &&
    client?.id_document_type,
  )
}

export function mapClientToUser(client, existingUser = null) {
  return {
    id: String(client.id_client),
    idClient: client.id_client,
    firstName: client.name || '',
    lastNamePaternal: client.last_name_paternal || '',
    lastNameMaternal: client.last_name_maternal || '',
    email: client.email,
    phone: client.phone || '',
    documentId: client.document_number || '',
    idDocumentType: client.id_document_type,
    documentTypeName: client.document_type_name || '',
    clientTypeName: client.client_type_name || '',
    idClientType: client.id_client_type,
    role: mapClientTypeToRole(client.client_type_name),
    profileComplete: isProfileComplete(client),
    addresses: existingUser?.addresses || client.directions?.map?.(mapDirectionToAddress).filter(Boolean) || [],
    orders: existingUser?.orders || [],
    authProvider: existingUser?.authProvider || 'email',
  }
}

export function mapUserToProfilePayload(user) {
  return {
    name: user.firstName?.trim(),
    last_name_paternal: user.lastNamePaternal?.trim() || '',
    last_name_maternal: user.lastNameMaternal?.trim() || '',
    phone: user.phone?.trim() || '',
    id_document_type: user.idDocumentType,
    document_number: user.documentId?.trim(),
  }
}

export function mapRegisterFormToPayload(form) {
  return {
    name: form.firstName?.trim(),
    last_name_paternal: form.lastNamePaternal?.trim() || '',
    last_name_maternal: form.lastNameMaternal?.trim() || '',
    phone: form.phone?.trim() || '',
    id_document_type: Number(form.idDocumentType),
    document_number: form.documentId?.trim(),
    email: form.email?.trim(),
    password: form.password,
    password_confirm: form.passwordConfirm,
  }
}
