const REGISTER_API_FIELD_MAP = {
  name: 'firstName',
  last_name_paternal: 'lastNamePaternal',
  last_name_maternal: 'lastNameMaternal',
  phone: 'phone',
  id_document_type: 'idDocumentType',
  document_number: 'documentId',
  email: 'email',
  password: 'password',
  password_confirm: 'passwordConfirm',
}

export function mapRegisterApiFieldErrors(apiErrors = {}) {
  const mapped = {}

  Object.entries(apiErrors).forEach(([apiKey, message]) => {
    const formKey = REGISTER_API_FIELD_MAP[apiKey] || apiKey
    mapped[formKey] = localizeRegisterValidationMessage(message, apiKey)
  })

  return mapped
}

function localizeRegisterValidationMessage(message, apiKey) {
  if (!message) return message

  const text = String(message)

  if (/has already been taken/i.test(text)) {
    if (apiKey === 'document_number') {
      return 'Este número de documento ya está registrado.'
    }
    if (apiKey === 'email') {
      return 'Este correo electrónico ya está registrado.'
    }
    return text.replace(/^The (.+) has already been taken\.?$/i, 'Este $1 ya está registrado.')
  }

  if (/field is required/i.test(text)) {
    return text.replace(/^The (.+) field is required\.?$/i, 'El $1 es obligatorio.')
  }

  if (/must be at least/i.test(text) && apiKey === 'password') {
    return 'La contraseña no cumple los requisitos mínimos.'
  }

  if (/confirmation does not match/i.test(text) || /must match/i.test(text)) {
    return 'Las contraseñas no coinciden.'
  }

  return text
}
