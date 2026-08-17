const STORAGE_KEY = 'balenzishop_master_checkout_beneficiary'

export function saveMasterCheckoutBeneficiaryId(beneficiaryId) {
  if (!beneficiaryId) return

  try {
    sessionStorage.setItem(STORAGE_KEY, String(beneficiaryId))
  } catch {
    // ignore storage failures
  }
}

export function readMasterCheckoutBeneficiaryId() {
  try {
    return sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function clearMasterCheckoutBeneficiaryId() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore storage failures
  }
}
