const STORAGE_KEY = 'balenzishop_proof_policy_accepted_clients'

function readAcceptedClientIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

export function hasAcceptedProofPolicy(clientId) {
  if (!clientId) return false

  return readAcceptedClientIds().includes(String(clientId))
}

export function markProofPolicyAccepted(clientId) {
  if (!clientId) return

  try {
    const ids = readAcceptedClientIds()
    const id = String(clientId)

    if (ids.includes(id)) return

    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids, id]))
  } catch {
    // ignore storage failures
  }
}
