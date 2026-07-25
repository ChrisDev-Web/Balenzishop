import { useEffect, useState } from 'react'
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

  useEffect(() => {
    if (!draftOrderId) return undefined

    const handleBeforeUnload = (event) => {
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

        const stored = readPendingCheckoutDraft(user.id)
        const shouldPromptCancel = Boolean(stored?.interrupted)

        savePendingCheckoutDraft({
          orderId: draft.id_client_order,
          clientId: user.id,
        })

        setActiveDraft(draft.id_client_order, { promptCancelOnOpen: shouldPromptCancel })

        if (location.pathname !== '/pedido') {
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
    location.pathname,
    navigate,
    resumeChecked,
    setActiveDraft,
    setResumeChecked,
    user?.id,
  ])

  useEffect(() => {
    if (!draftOrderId || !resumeChecked) return
    if (location.pathname === '/pedido') return

    setActiveDraft(draftOrderId, { promptCancelOnOpen: true })
    navigate('/pedido', { replace: true })
  }, [draftOrderId, location.pathname, navigate, resumeChecked, setActiveDraft])

  const resumeConfirmOpen = Boolean(
    draftOrderId
    && promptCancelOnOpen
    && location.pathname === '/pedido',
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
