import { useEffect, useLayoutEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { fetchCheckoutDraft } from '../../api/clientOrders'
import { useAuthStore } from '../../stores/authStore'
import { useCheckoutDraftStore } from '../../stores/checkoutDraftStore'
import {
  clearPendingCheckoutDraft,
  markPendingCheckoutDraftInterrupted,
  readPendingCheckoutDraft,
  savePendingCheckoutDraft,
} from '../../utils/checkoutReservationStorage'
import {
  isCheckoutReservationGuardSuspended,
  normalizeAppPathname,
  shouldRedirectActiveCheckoutDraft,
  syncCheckoutLegalViewFromUrl,
} from '../../utils/checkoutReservationGuard'
import CancelCheckoutConfirmModal, {
  cancelActiveCheckoutDraft,
} from './CancelCheckoutConfirmModal'

export default function CheckoutReservationGuard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { accessToken, user, isAuthenticated } = useAuthStore()
  const draftOrderId = useCheckoutDraftStore((state) => state.draftOrderId)
  const promptCancelOnOpen = useCheckoutDraftStore((state) => state.promptCancelOnOpen)
  const resumeChecked = useCheckoutDraftStore((state) => state.resumeChecked)
  const setActiveDraft = useCheckoutDraftStore((state) => state.setActiveDraft)
  const clearActiveDraft = useCheckoutDraftStore((state) => state.clearActiveDraft)
  const dismissPromptCancel = useCheckoutDraftStore((state) => state.dismissPromptCancel)
  const setResumeChecked = useCheckoutDraftStore((state) => state.setResumeChecked)

  const [cancelError, setCancelError] = useState('')
  const [cancelling, setCancelling] = useState(false)

  const currentPath = normalizeAppPathname(location.pathname)
  const guardSuspended = isCheckoutReservationGuardSuspended(currentPath)

  useLayoutEffect(() => {
    syncCheckoutLegalViewFromUrl()

    if (isCheckoutReservationGuardSuspended(normalizeAppPathname(location.pathname))) {
      dismissPromptCancel()
    }
  }, [location.pathname, dismissPromptCancel])

  useEffect(() => {
    if (!draftOrderId) return undefined

    const handleBeforeUnload = (event) => {
      const pathNow = normalizeAppPathname(window.location.pathname)
      if (isCheckoutReservationGuardSuspended(pathNow)) return

      markPendingCheckoutDraftInterrupted()
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [draftOrderId])

  useEffect(() => {
    if (!isAuthenticated || !accessToken || !user?.id || resumeChecked) {
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        const response = await fetchCheckoutDraft(accessToken)
        if (cancelled) return

        const draft = response?.data
        if (!draft?.id_client_order) {
          clearPendingCheckoutDraft()
          clearActiveDraft()
          setResumeChecked(true)
          return
        }

        syncCheckoutLegalViewFromUrl()

        const pathAtResume = normalizeAppPathname(window.location.pathname)
        const onLegalPage = isCheckoutReservationGuardSuspended(pathAtResume)
        const stored = readPendingCheckoutDraft(user.id)
        const shouldPromptCancel = !onLegalPage && Boolean(stored?.interrupted)

        savePendingCheckoutDraft({
          orderId: draft.id_client_order,
          clientId: user.id,
        })

        setActiveDraft(draft.id_client_order, { promptCancelOnOpen: shouldPromptCancel })

        if (!onLegalPage && shouldRedirectActiveCheckoutDraft(pathAtResume)) {
          navigate('/pedido', { replace: true })
        }
      } catch {
        if (!cancelled) {
          clearPendingCheckoutDraft()
          clearActiveDraft()
        }
      } finally {
        if (!cancelled) {
          setResumeChecked(true)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    accessToken,
    clearActiveDraft,
    isAuthenticated,
    navigate,
    resumeChecked,
    setActiveDraft,
    setResumeChecked,
    user?.id,
  ])

  useEffect(() => {
    if (!draftOrderId || !resumeChecked) return

    const pathNow = normalizeAppPathname(window.location.pathname)

    if (pathNow === '/pedido') return
    if (isCheckoutReservationGuardSuspended(pathNow)) return

    setActiveDraft(draftOrderId, { promptCancelOnOpen: true })
    navigate('/pedido', { replace: true })
  }, [draftOrderId, location.pathname, navigate, resumeChecked, setActiveDraft])

  const resumeConfirmOpen = Boolean(
    draftOrderId
    && promptCancelOnOpen
    && currentPath === '/pedido'
    && !guardSuspended,
  )

  const handleContinueResume = () => {
    setCancelError('')
    if (draftOrderId && user?.id) {
      savePendingCheckoutDraft({
        orderId: draftOrderId,
        clientId: user.id,
      })
    }
    dismissPromptCancel()
  }

  const handleConfirmResumeCancel = async () => {
    if (!draftOrderId || !accessToken) {
      dismissPromptCancel()
      clearActiveDraft()
      clearPendingCheckoutDraft()
      return
    }

    setCancelling(true)
    setCancelError('')

    try {
      await cancelActiveCheckoutDraft(draftOrderId, accessToken)
      clearPendingCheckoutDraft()
      clearActiveDraft()
      dismissPromptCancel()
    } catch (error) {
      setCancelError(error.message || 'No se pudo cancelar la reserva')
    } finally {
      setCancelling(false)
    }
  }

  if (guardSuspended) {
    return null
  }

  return (
    <CancelCheckoutConfirmModal
      open={resumeConfirmOpen}
      isProcessing={cancelling}
      error={cancelError}
      onContinue={handleContinueResume}
      onConfirmCancel={handleConfirmResumeCancel}
    />
  )
}
