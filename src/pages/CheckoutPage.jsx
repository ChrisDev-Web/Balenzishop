import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Tag, MapPin, User, Plus, Minus, Trash2, ChevronDown } from 'lucide-react'
import { useCartStore } from '../stores/cartStore'
import { useAuthStore } from '../stores/authStore'
import { useCheckoutDraftStore } from '../stores/checkoutDraftStore'
import { useUiStore } from '../stores/uiStore'
import { AUTH_INTENT, captureAuthReturnTo, isMasterAccountUser } from '../utils/authFlow'
import { fetchActivePaymentMethods } from '../api/paymentMethods'
import {
  validateDiscountCoupon,
  mapValidationToAppliedCoupon,
  buildEligibleDiscountMap,
} from '../api/discountCoupons'
import { fetchLiveMinoristaPricingStatus } from '../api/catalogSettings'
import { getDeliveryFeeForAddress, computeOrderTotal } from '../utils/deliveryFee'
import ShippingChargeDisplay from '../components/checkout/ShippingChargeDisplay'
import { getDecantCartOptions, getMaxCartQuantity } from '../utils/pricing'
import { getLineDisplayTotal, getLinePromoDiscount, useCartTotals } from '../hooks/useCartTotals'
import { useUserPricing } from '../hooks/useUserPricing'
import { buildWhatsAppMessage, openWhatsAppOrder } from '../utils/orderMessage'
import { mapApiClientOrder } from '../utils/clientOrderMapper'
import { reserveCheckoutOrder } from '../api/clientOrders'
import {
  clearPendingCheckoutDraft,
  savePendingCheckoutDraft,
} from '../utils/checkoutReservationStorage'
import ReserveOrderModal from '../components/checkout/ReserveOrderModal'
import CheckoutAddressConfirmModal, {
  formatCheckoutAddressLine,
  getScopeLabel,
} from '../components/checkout/CheckoutAddressConfirmModal'
import MasterCheckoutClientPickerModal from '../components/checkout/MasterCheckoutClientPickerModal'
import MasterCheckoutCreateClientModal from '../components/checkout/MasterCheckoutCreateClientModal'
import MasterCheckoutDeleteClientModal from '../components/checkout/MasterCheckoutDeleteClientModal'
import {
  createMasterBeneficiary,
  deleteMasterBeneficiary,
  getMasterBeneficiaryDetail,
  listMasterBeneficiaries,
  listMasterBeneficiaryDirections,
  updateMasterBeneficiary,
  updateMasterBeneficiaryDirection,
} from '../api/masterBeneficiaries'
import {
  mapMasterBeneficiaryAddresses,
  mapMasterBeneficiaryToCheckoutUser,
} from '../utils/masterBeneficiaryMapper'
import {
  clearMasterCheckoutBeneficiaryId,
  readMasterCheckoutBeneficiaryId,
  saveMasterCheckoutBeneficiaryId,
} from '../utils/masterCheckoutStorage'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { items, clearCart, clearEditingOrder, editingOrderId, editingDiscountCode, removeItem, updateQuantity } = useCartStore()
  const { subtotal, grossSubtotal, decantPromoDiscount, promoResult } = useCartTotals()
  const { role } = useUserPricing()
  const { user, isAuthenticated, accessToken, updateAddress, syncAddresses } = useAuthStore()
  const openLoginModal = useUiStore((s) => s.openLoginModal)
  const setAuthIntent = useUiStore((s) => s.setAuthIntent)

  const [codeInput, setCodeInput] = useState('')
  const [appliedCode, setAppliedCode] = useState(null)
  const [codeError, setCodeError] = useState('')
  const [applyingCode, setApplyingCode] = useState(false)
  const [showReserveModal, setShowReserveModal] = useState(false)
  const draftOrderId = useCheckoutDraftStore((state) => state.draftOrderId)
  const promptCancelOnOpen = useCheckoutDraftStore((state) => state.promptCancelOnOpen)
  const resumeChecked = useCheckoutDraftStore((state) => state.resumeChecked)
  const setActiveDraft = useCheckoutDraftStore((state) => state.setActiveDraft)
  const clearActiveDraft = useCheckoutDraftStore((state) => state.clearActiveDraft)
  const [reserveError, setReserveError] = useState('')
  const [reserving, setReserving] = useState(false)

  const [paymentMethods, setPaymentMethods] = useState([])
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true)
  const [paymentMethodsError, setPaymentMethodsError] = useState('')

  const [showAddressConfirmModal, setShowAddressConfirmModal] = useState(false)
  const [addressConfirmed, setAddressConfirmed] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [addressConfirmError, setAddressConfirmError] = useState('')
  const [isConfirmingAddress, setIsConfirmingAddress] = useState(false)
  const [clientSectionOpen, setClientSectionOpen] = useState(false)
  const [deliverySectionOpen, setDeliverySectionOpen] = useState(false)
  const [livePricingEnabled, setLivePricingEnabled] = useState(false)
  const hasPromptedAddressRef = useRef(false)

  const isMasterAccount = isMasterAccountUser(user)
  const [showMasterClientPicker, setShowMasterClientPicker] = useState(false)
  const [showMasterCreateClient, setShowMasterCreateClient] = useState(false)
  const [masterBeneficiaries, setMasterBeneficiaries] = useState([])
  const [masterBeneficiarySearch, setMasterBeneficiarySearch] = useState('')
  const [isLoadingMasterBeneficiaries, setIsLoadingMasterBeneficiaries] = useState(false)
  const [masterPickerError, setMasterPickerError] = useState('')
  const [isSavingMasterBeneficiary, setIsSavingMasterBeneficiary] = useState(false)
  const [masterCreateError, setMasterCreateError] = useState('')
  const [editingMasterBeneficiary, setEditingMasterBeneficiary] = useState(null)
  const [deletingMasterBeneficiary, setDeletingMasterBeneficiary] = useState(null)
  const [isDeletingMasterBeneficiary, setIsDeletingMasterBeneficiary] = useState(false)
  const [masterDeleteError, setMasterDeleteError] = useState('')
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null)
  const [beneficiaryAddresses, setBeneficiaryAddresses] = useState([])
  const [masterCheckoutReady, setMasterCheckoutReady] = useState(false)

  const isEditing = !!editingOrderId
  const checkoutCustomer = isMasterAccount
    ? (selectedBeneficiary ? mapMasterBeneficiaryToCheckoutUser(selectedBeneficiary) : null)
    : user
  const addresses = isMasterAccount ? beneficiaryAddresses : (user?.addresses || [])
  const primaryAddress = addresses.find((a) => a.isPrimary) || addresses[0]
  const discount = appliedCode?.discount || 0
  const delivery = getDeliveryFeeForAddress(primaryAddress)
  const deliveryFee = delivery.fee
  const total = computeOrderTotal(subtotal, discount, deliveryFee, delivery.mode)
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalQuantity = totalItems
  const clientFullName = [checkoutCustomer?.firstName, checkoutCustomer?.lastNamePaternal, checkoutCustomer?.lastNameMaternal].filter(Boolean).join(' ') || '—'
  const deliverySummary = primaryAddress
    ? `${primaryAddress.district}, ${primaryAddress.city}`
    : 'Sin dirección'

  const eligibleDiscountByProductId = useMemo(
    () => buildEligibleDiscountMap(appliedCode?.eligible_items),
    [appliedCode?.eligible_items],
  )

  useEffect(() => {
    items.forEach((item) => {
      const isDecant = Boolean(item.isDecant || item.idProductDecant)
      const maxQuantity = getMaxCartQuantity(
        item.stock,
        role,
        isDecant,
        isDecant
          ? getDecantCartOptions(item, {
              items,
              productId: item.id,
              excludeDecantId: item.idProductDecant ?? null,
            })
          : null,
      )
      if (Number.isFinite(maxQuantity) && item.quantity > maxQuantity) {
        updateQuantity(item.id, maxQuantity, item.idProductDecant ?? null)
      }
    })
  }, [items, role, updateQuantity])

  useEffect(() => {
    if (!isAuthenticated) {
      openLoginModal(AUTH_INTENT.CHECKOUT)
      return
    }
    if (user && !user.profileComplete && !isMasterAccountUser(user)) {
      navigate('/mi-cuenta/completar-perfil', { replace: true })
      return
    }
    if (user?.profileComplete && !isMasterAccountUser(user) && !user.addresses?.length) {
      const returnPath = captureAuthReturnTo() || '/catalogo'
      setAuthIntent(AUTH_INTENT.CHECKOUT, returnPath)
      navigate(
        `/mi-cuenta/direcciones?flujo=pedido&returnTo=${encodeURIComponent(returnPath)}`,
        { replace: true },
      )
    }
  }, [isAuthenticated, user, navigate, openLoginModal, setAuthIntent, isMasterAccount])

  useEffect(() => {
    if (!isAuthenticated) return

    syncAddresses().catch(() => {})
  }, [isAuthenticated, syncAddresses])

  useEffect(() => {
    if (!isAuthenticated || !isMasterAccount || !accessToken || !resumeChecked || selectedBeneficiary) {
      return
    }

    const beneficiaryId =
      searchParams.get('masterBeneficiaryId') || readMasterCheckoutBeneficiaryId()
    if (!beneficiaryId) return

    let cancelled = false

    ;(async () => {
      try {
        const response = await getMasterBeneficiaryDetail(Number(beneficiaryId), accessToken)
        if (cancelled || !response.success || !response.data) return

        const beneficiary = response.data
        setSelectedBeneficiary(beneficiary)
        saveMasterCheckoutBeneficiaryId(beneficiary.id_client)

        const nextAddresses = await loadBeneficiaryAddresses(beneficiary.id_client)
        if (cancelled) return

        setBeneficiaryAddresses(nextAddresses)

        if (!nextAddresses.length) {
          navigate(
            `/mi-cuenta/direcciones?flujo=pedido&nueva=1&masterBeneficiaryId=${beneficiary.id_client}&returnTo=${encodeURIComponent(`/pedido?masterBeneficiaryId=${beneficiary.id_client}`)}`,
            { replace: true },
          )
          return
        }

        const primary = nextAddresses.find((item) => item.isPrimary) || nextAddresses[0]
        setSelectedAddressId(primary?.id || null)
        setAddressConfirmed(true)
        setMasterCheckoutReady(true)
        setShowMasterClientPicker(false)
      } catch {
        if (!cancelled) {
          clearMasterCheckoutBeneficiaryId()
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    isAuthenticated,
    isMasterAccount,
    accessToken,
    resumeChecked,
    selectedBeneficiary,
    searchParams,
    navigate,
  ])

  useEffect(() => {
    if (!isAuthenticated || !isMasterAccount || !accessToken || !resumeChecked) return

    if (draftOrderId || promptCancelOnOpen || masterCheckoutReady || selectedBeneficiary) {
      setShowMasterClientPicker(false)
      return
    }

    loadMasterBeneficiaries('')
    setShowMasterClientPicker(true)
  }, [
    isAuthenticated,
    isMasterAccount,
    accessToken,
    draftOrderId,
    promptCancelOnOpen,
    resumeChecked,
    masterCheckoutReady,
    selectedBeneficiary,
  ])

  useEffect(() => {
    if (!user?.profileComplete || isMasterAccount || addresses.length === 0 || !resumeChecked) return

    if (draftOrderId) {
      hasPromptedAddressRef.current = true
      setShowAddressConfirmModal(false)
      setAddressConfirmed(true)
      if (primaryAddress?.id) {
        setSelectedAddressId(primaryAddress.id)
      }
      return
    }

    if (promptCancelOnOpen) {
      setShowAddressConfirmModal(false)
      return
    }

    if (hasPromptedAddressRef.current) return

    hasPromptedAddressRef.current = true
    setSelectedAddressId(primaryAddress?.id || null)
    setShowAddressConfirmModal(true)
    setAddressConfirmed(false)
  }, [
    user?.profileComplete,
    addresses.length,
    primaryAddress?.id,
    draftOrderId,
    promptCancelOnOpen,
    resumeChecked,
  ])

  useEffect(() => {
    let cancelled = false

    fetchActivePaymentMethods()
      .then((methods) => {
        if (!cancelled) setPaymentMethods(methods)
      })
      .catch((error) => {
        if (!cancelled) setPaymentMethodsError(error.message)
      })
      .finally(() => {
        if (!cancelled) setLoadingPaymentMethods(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    fetchLiveMinoristaPricingStatus()
      .then((response) => {
        if (cancelled) return
        setLivePricingEnabled(Boolean(response?.data?.enabled))
      })
      .catch(() => {
        if (!cancelled) setLivePricingEnabled(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!editingDiscountCode || !accessToken || items.length === 0) return

    let cancelled = false

    ;(async () => {
      setApplyingCode(true)
      try {
        const response = await validateDiscountCoupon(editingDiscountCode, items, accessToken)
        if (cancelled) return

        const applied = mapValidationToAppliedCoupon(response)
        if (applied && applied.discount > 0) {
          setAppliedCode(applied)
          setCodeInput(applied.code)
          setCodeError('')
        }
      } catch (error) {
        if (!cancelled) {
          setCodeError(error.message)
          setAppliedCode(null)
        }
      } finally {
        if (!cancelled) setApplyingCode(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [editingDiscountCode, accessToken, items])

  useEffect(() => {
    if (draftOrderId && !promptCancelOnOpen) {
      setShowReserveModal(true)
    }
  }, [draftOrderId, promptCancelOnOpen])

  const handleApplyCode = async () => {
    if (!accessToken) {
      setCodeError('Inicia sesión para aplicar cupones')
      return
    }
    if (!codeInput.trim()) {
      setCodeError('Ingresa un código')
      return
    }

    setApplyingCode(true)
    setCodeError('')

    try {
      const response = await validateDiscountCoupon(codeInput, items, accessToken)
      const applied = mapValidationToAppliedCoupon(response)

      if (!applied || applied.discount <= 0) {
        setCodeError('El cupón no aplica a este pedido')
        setAppliedCode(null)
        return
      }

      setAppliedCode(applied)
      setCodeInput(applied.code)
    } catch (error) {
      setCodeError(error.message)
      setAppliedCode(null)
    } finally {
      setApplyingCode(false)
    }
  }

  const handleRemoveCode = () => {
    setAppliedCode(null)
    setCodeInput('')
    setCodeError('')
  }

  async function loadMasterBeneficiaries(search = '') {
    if (!accessToken) return

    setIsLoadingMasterBeneficiaries(true)
    setMasterPickerError('')

    try {
      const response = await listMasterBeneficiaries({ search }, accessToken)
      if (response.success) {
        setMasterBeneficiaries(response.data ?? [])
      } else {
        setMasterPickerError(response.message || 'No se pudieron cargar los clientes')
      }
    } catch (error) {
      setMasterPickerError(error.message || 'No se pudieron cargar los clientes')
    } finally {
      setIsLoadingMasterBeneficiaries(false)
    }
  }

  async function loadBeneficiaryAddresses(beneficiaryId) {
    const response = await listMasterBeneficiaryDirections(beneficiaryId, accessToken)
    if (!response.success) {
      throw new Error(response.message || 'No se pudieron cargar las direcciones')
    }

    return mapMasterBeneficiaryAddresses(response.data ?? [])
  }

  const handleMasterSearchChange = (value) => {
    setMasterBeneficiarySearch(value)
    loadMasterBeneficiaries(value)
  }

  const handleSelectMasterBeneficiary = async (beneficiary) => {
    setShowMasterClientPicker(false)
    setSelectedBeneficiary(beneficiary)
    saveMasterCheckoutBeneficiaryId(beneficiary.id_client)
    setMasterCheckoutReady(false)
    setAddressConfirmed(false)

    try {
      const nextAddresses = await loadBeneficiaryAddresses(beneficiary.id_client)
      setBeneficiaryAddresses(nextAddresses)

      const returnTo = `/pedido?masterBeneficiaryId=${beneficiary.id_client}`

      if (!nextAddresses.length) {
        navigate(
          `/mi-cuenta/direcciones?flujo=pedido&nueva=1&masterBeneficiaryId=${beneficiary.id_client}&returnTo=${encodeURIComponent(returnTo)}`,
        )
        return
      }

      const primary = nextAddresses.find((item) => item.isPrimary) || nextAddresses[0]
      setSelectedAddressId(primary?.id || null)
      setShowAddressConfirmModal(true)
    } catch (error) {
      setMasterPickerError(error.message)
      setShowMasterClientPicker(true)
    }
  }

  const handleOpenMasterCreateClient = () => {
    setMasterCreateError('')
    setEditingMasterBeneficiary(null)
    setShowMasterClientPicker(false)
    setShowMasterCreateClient(true)
  }

  const handleOpenMasterEditClient = (beneficiary) => {
    setMasterCreateError('')
    setEditingMasterBeneficiary(beneficiary)
    setShowMasterClientPicker(false)
    setShowMasterCreateClient(true)
  }

  const handleOpenMasterDeleteClient = (beneficiary) => {
    setMasterDeleteError('')
    setDeletingMasterBeneficiary(beneficiary)
  }

  const handleSubmitMasterBeneficiary = async (payload) => {
    setIsSavingMasterBeneficiary(true)
    setMasterCreateError('')

    try {
      if (editingMasterBeneficiary) {
        const response = await updateMasterBeneficiary(
          editingMasterBeneficiary.id_client,
          payload,
          accessToken,
        )

        if (!response.success) {
          setMasterCreateError(response.message || 'No se pudo actualizar el cliente')
          return
        }

        const updated = response.data
        setShowMasterCreateClient(false)
        setEditingMasterBeneficiary(null)
        await loadMasterBeneficiaries(masterBeneficiarySearch)

        if (selectedBeneficiary?.id_client === updated.id_client) {
          setSelectedBeneficiary(updated)
        }

        setShowMasterClientPicker(true)
        return
      }

      const response = await createMasterBeneficiary(payload, accessToken)
      if (!response.success) {
        setMasterCreateError(response.message || 'No se pudo crear el cliente')
        return
      }

      const beneficiary = response.data
      setShowMasterCreateClient(false)
      saveMasterCheckoutBeneficiaryId(beneficiary.id_client)
      navigate(
        `/mi-cuenta/direcciones?flujo=pedido&nueva=1&masterBeneficiaryId=${beneficiary.id_client}&returnTo=${encodeURIComponent(`/pedido?masterBeneficiaryId=${beneficiary.id_client}`)}`,
      )
    } catch (error) {
      setMasterCreateError(error.message || 'No se pudo guardar el cliente')
    } finally {
      setIsSavingMasterBeneficiary(false)
    }
  }

  const handleConfirmDeleteMasterBeneficiary = async () => {
    if (!deletingMasterBeneficiary) return

    setIsDeletingMasterBeneficiary(true)
    setMasterDeleteError('')

    try {
      const response = await deleteMasterBeneficiary(deletingMasterBeneficiary.id_client, accessToken)
      if (!response.success) {
        setMasterDeleteError(response.message || 'No se pudo eliminar el cliente')
        return
      }

      if (selectedBeneficiary?.id_client === deletingMasterBeneficiary.id_client) {
        setSelectedBeneficiary(null)
        setBeneficiaryAddresses([])
        setMasterCheckoutReady(false)
        setAddressConfirmed(false)
        clearMasterCheckoutBeneficiaryId()
      }

      setDeletingMasterBeneficiary(null)
      await loadMasterBeneficiaries(masterBeneficiarySearch)
      setShowMasterClientPicker(true)
    } catch (error) {
      setMasterDeleteError(error.message || 'No se pudo eliminar el cliente')
    } finally {
      setIsDeletingMasterBeneficiary(false)
    }
  }

  const handleChangeMasterClient = () => {
    setSelectedBeneficiary(null)
    setBeneficiaryAddresses([])
    setMasterCheckoutReady(false)
    setAddressConfirmed(false)
    setShowAddressConfirmModal(false)
    setMasterBeneficiarySearch('')
    clearMasterCheckoutBeneficiaryId()
    loadMasterBeneficiaries('')
    setShowMasterClientPicker(true)
  }

  const handleConfirmAddress = async () => {
    if (!selectedAddressId) return

    setIsConfirmingAddress(true)
    setAddressConfirmError('')

    try {
      const selected = addresses.find((item) => String(item.id) === String(selectedAddressId))

      if (!selected) {
        setAddressConfirmError('Selecciona una dirección válida')
        return
      }

      if (!selected.isPrimary) {
        if (isMasterAccount && selectedBeneficiary) {
          const response = await updateMasterBeneficiaryDirection(
            selectedBeneficiary.id_client,
            selected.idClientDirection,
            { is_primary: true },
            accessToken,
          )

          if (!response.success) {
            setAddressConfirmError(response.message || 'No se pudo actualizar la dirección principal')
            return
          }

          const refreshed = await loadBeneficiaryAddresses(selectedBeneficiary.id_client)
          setBeneficiaryAddresses(refreshed)
        } else {
          const result = await updateAddress(selected.id, { isPrimary: true })

          if (!result.success) {
            setAddressConfirmError(result.error || 'No se pudo actualizar la dirección principal')
            return
          }
        }
      }

      setAddressConfirmed(true)
      if (isMasterAccount) {
        setMasterCheckoutReady(true)
      }
      setShowAddressConfirmModal(false)
    } finally {
      setIsConfirmingAddress(false)
    }
  }

  const handleCloseAddressConfirmModal = () => {
    if (isConfirmingAddress) return
    setAddressConfirmError('')
    if (primaryAddress?.id) {
      setSelectedAddressId(primaryAddress.id)
      setAddressConfirmed(true)
    }
    setShowAddressConfirmModal(false)
  }

  const handleAddNewAddress = () => {
    const returnPath = captureAuthReturnTo() || '/pedido'
    if (isMasterAccount && selectedBeneficiary) {
      const returnTo = `${returnPath.includes('?') ? returnPath.split('?')[0] : returnPath}?masterBeneficiaryId=${selectedBeneficiary.id_client}`
      navigate(
        `/mi-cuenta/direcciones?flujo=pedido&nueva=1&masterBeneficiaryId=${selectedBeneficiary.id_client}&returnTo=${encodeURIComponent(returnTo)}`,
      )
      return
    }

    setAuthIntent(AUTH_INTENT.CHECKOUT, returnPath)
    navigate(
      `/mi-cuenta/direcciones?flujo=pedido&nueva=1&returnTo=${encodeURIComponent(returnPath)}`,
    )
  }

  const handleOpenAddressConfirmModal = () => {
    if (isMasterAccount) {
      if (!selectedBeneficiary) return

      if (!addresses.length) {
        handleAddNewAddress()
        return
      }
    }

    setSelectedAddressId(primaryAddress?.id || null)
    setAddressConfirmError('')
    setAddressConfirmed(false)
    setShowAddressConfirmModal(true)
  }

  const handleOpenReserveModal = async () => {
    if (!accessToken) {
      openLoginModal(AUTH_INTENT.CHECKOUT)
      return
    }

    setReserving(true)
    setReserveError('')

    try {
      const response = await reserveCheckoutOrder(
        {
          items,
          discountCode: appliedCode?.code || null,
          beneficiaryClientId: isMasterAccount ? selectedBeneficiary?.id_client : null,
          delivery: {
            id_client_direction: primaryAddress?.idClientDirection
              ? Number(primaryAddress.idClientDirection)
              : null,
            delivery_fee: deliveryFee,
            delivery_mode: delivery.mode,
            delivery_label: delivery.label,
            district: primaryAddress?.district || null,
            city: primaryAddress?.city || null,
            shalon: primaryAddress?.shalon || null,
            delivery_scope: primaryAddress?.deliveryScope || null,
          },
        },
        accessToken,
      )

      if (!response.success) {
        throw new Error(response.message || 'No se pudo reservar el stock del pedido')
      }

      const orderId = response.data?.id_client_order
      if (!orderId) {
        throw new Error('No se recibió la reserva del pedido')
      }

      setActiveDraft(orderId)
      savePendingCheckoutDraft({
        orderId,
        clientId: user.id,
      })
      setShowReserveModal(true)
    } catch (error) {
      setReserveError(error.message || 'No se pudo reservar el stock del pedido')
    } finally {
      setReserving(false)
    }
  }

  const handleCloseReserveModal = () => {
    setShowReserveModal(false)
  }

  const handleReservationCancelled = () => {
    clearActiveDraft()
    clearPendingCheckoutDraft()
    setShowReserveModal(false)
    setReserveError('')
  }

  const handleOrderCreated = async (apiOrder, { balancePaymentPreference } = {}) => {
    const mapped = mapApiClientOrder(apiOrder)

    const message = buildWhatsAppMessage({
      orderId: mapped.orderNumber,
      date: mapped.date,
      shippingDate: mapped.scheduledDeliveryDate,
      items: mapped.items,
      subtotal: mapped.subtotal,
      discount: mapped.discount,
      discountCode: mapped.discountCode,
      deliveryFee: mapped.deliveryFee,
      deliveryLabel: mapped.deliveryLabel,
      deliveryMode: mapped.deliveryMode,
      total: mapped.total,
      customer: checkoutCustomer,
      address: mapped.address || primaryAddress,
      paymentMode: mapped.paymentMode,
      reservationAmount: mapped.reservationAmount,
      amountPaid: mapped.amountPaid,
      balanceDue: mapped.balanceDue,
      payments: mapped.payments,
      balancePaymentPreference,
      status: mapped.status,
    })

    clearCart()
    clearEditingOrder()
    clearActiveDraft()
    clearPendingCheckoutDraft()
    setShowReserveModal(false)
    await openWhatsAppOrder(message)
    navigate('/mi-cuenta/pedidos')
  }

  if (items.length === 0 && !showReserveModal && !draftOrderId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Tu carrito está vacío</h1>
        <p className="mt-2 text-gray-600">Agrega productos antes de hacer un pedido.</p>
        <Link
          to="/catalogo"
          className="mt-6 inline-block rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
        >
          Ir al catálogo
        </Link>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Inicia sesión para continuar</h1>
        <p className="mt-2 text-gray-600">Usa el modal de inicio de sesión para completar tu pedido.</p>
        <button
          type="button"
          onClick={() => openLoginModal(AUTH_INTENT.CHECKOUT)}
          className="mt-6 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white"
        >
          Iniciar sesión
        </button>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-sm text-gray-600">Cargando tu sesión…</p>
      </div>
    )
  }

  if (!user.profileComplete && !isMasterAccount) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-sm text-gray-600">Redirigiendo para completar tu perfil…</p>
      </div>
    )
  }

  if (!isMasterAccount && !primaryAddress) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-sm text-gray-600">Cargando dirección de entrega…</p>
      </div>
    )
  }

  const isAddressReady = isMasterAccount ? masterCheckoutReady && addressConfirmed : addressConfirmed

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-6">
      {isEditing && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Estás actualizando productos del pedido <strong>#{editingOrderId}</strong>. Al reservar se creará un pedido nuevo en el sistema.
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resumen del pedido</h1>
          <p className="mt-1 text-sm text-gray-600">{totalItems} producto{totalItems !== 1 ? 's' : ''} en tu pedido</p>
        </div>
        {isEditing && (
          <Link
            to="/catalogo"
            className="flex items-center gap-1.5 rounded-full border border-black px-4 py-2 text-sm font-semibold text-black hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
            Agregar más productos
          </Link>
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b px-5 py-4">
              <h2 className="font-semibold text-gray-900">Productos</h2>
            </div>
            <ul className="max-h-[min(28rem,55vh)] divide-y overflow-y-auto px-5">
              {items.map((item, lineIndex) => {
                const isDecant = Boolean(item.isDecant || item.idProductDecant)
                const maxQuantity = getMaxCartQuantity(
                  item.stock,
                  role,
                  isDecant,
                  isDecant
                    ? getDecantCartOptions(item, {
                        items,
                        productId: item.id,
                        excludeDecantId: item.idProductDecant ?? null,
                      })
                    : null,
                )
                const atMaxStock = Number.isFinite(maxQuantity) && item.quantity >= maxQuantity
                const linePromoDiscount = getLinePromoDiscount(lineIndex, promoResult)
                const lineTotal = getLineDisplayTotal(item, lineIndex, promoResult)
                const discountInfo = eligibleDiscountByProductId.get(Number(item.id))

                return (
                  <li
                    key={item.idProductDecant ? `${item.id}-${item.idProductDecant}` : item.id}
                    className="flex gap-4 py-4"
                  >
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-20 w-16 shrink-0 rounded object-contain bg-gray-50" />
                    ) : (
                      <div className="h-20 w-16 shrink-0 rounded bg-gray-100" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.brand}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1, item.idProductDecant ?? null)}
                          className="rounded border border-gray-300 p-1.5 hover:bg-gray-50"
                          aria-label="Disminuir cantidad"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-[1.5rem] text-center text-sm font-semibold text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.idProductDecant ?? null)}
                          disabled={atMaxStock}
                          className="rounded border border-gray-300 p-1.5 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Aumentar cantidad"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id, item.idProductDecant ?? null)}
                          className="ml-1 rounded p-1.5 text-gray-400 hover:bg-gray-50 hover:text-red-600"
                          aria-label="Eliminar producto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {isDecant && linePromoDiscount > 0 && (
                        <p className="mt-1 text-xs font-bold text-black">
                          Descuento promoción: - S/ {linePromoDiscount.toFixed(2)}
                        </p>
                      )}
                      {discountInfo && (
                        <p className="mt-1 text-xs font-bold text-gray-900">
                          Cupón aplicado: - S/ {discountInfo.discountAmount.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      {discountInfo ? (
                        <>
                          <p className="text-sm text-gray-400 line-through">
                            S/ {discountInfo.lineSubtotal.toFixed(2)}
                          </p>
                          <p className="font-bold text-gray-900">
                            S/ {discountInfo.discountedSubtotal.toFixed(2)}
                          </p>
                        </>
                      ) : (
                        <p className="font-bold text-gray-900">S/ {lineTotal.toFixed(2)}</p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="px-5 py-4">
                {isMasterAccount ? (
                  <div className="mb-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleChangeMasterClient}
                      className="whitespace-nowrap text-xs font-semibold text-black hover:underline"
                    >
                      Cambiar cliente
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientSectionOpen((open) => !open)}
                      className="rounded p-0.5 text-gray-400 md:hidden"
                      aria-label={clientSectionOpen ? 'Ocultar datos del cliente' : 'Ver datos del cliente'}
                    >
                      <ChevronDown
                        className={`h-5 w-5 transition-transform ${clientSectionOpen ? 'rotate-180' : ''}`}
                        aria-hidden
                      />
                    </button>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setClientSectionOpen((open) => !open)}
                    className="flex min-w-0 items-center gap-2 text-left text-gray-900 md:pointer-events-none"
                    aria-expanded={clientSectionOpen}
                  >
                    <User className="h-5 w-5 shrink-0 text-brand" />
                    <div className="min-w-0">
                      <h3 className="whitespace-nowrap text-sm font-semibold sm:text-base">Datos del cliente</h3>
                      <p className={`truncate text-xs text-gray-500 md:hidden ${clientSectionOpen ? 'hidden' : 'block'}`}>
                        {checkoutCustomer ? clientFullName : 'Sin cliente'}
                      </p>
                    </div>
                  </button>
                  {!isMasterAccount ? (
                    <button
                      type="button"
                      onClick={() => setClientSectionOpen((open) => !open)}
                      className="rounded p-0.5 text-gray-400 md:hidden"
                      aria-label={clientSectionOpen ? 'Ocultar datos del cliente' : 'Ver datos del cliente'}
                    >
                      <ChevronDown
                        className={`h-5 w-5 transition-transform ${clientSectionOpen ? 'rotate-180' : ''}`}
                        aria-hidden
                      />
                    </button>
                  ) : null}
                </div>
              </div>
              <ul
                className={`space-y-1 border-t border-gray-100 px-5 pb-4 pt-3 text-sm text-gray-600 ${
                  clientSectionOpen ? 'block' : 'hidden'
                } md:mt-3 md:block md:border-t-0 md:px-5 md:pb-5 md:pt-0`}
              >
                {checkoutCustomer ? (
                  <>
                    <li>{clientFullName}</li>
                    {checkoutCustomer.documentId && (
                      <li>{checkoutCustomer.documentTypeName || 'Documento'}: {checkoutCustomer.documentId}</li>
                    )}
                    {!isMasterAccount && user?.email ? <li>{user.email}</li> : null}
                    <li>{checkoutCustomer.phone || '—'}</li>
                  </>
                ) : (
                  <li className="text-xs text-amber-700">Selecciona un cliente para continuar</li>
                )}
              </ul>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center justify-between gap-2 px-5 py-4">
                <button
                  type="button"
                  onClick={() => setDeliverySectionOpen((open) => !open)}
                  className="flex min-w-0 items-center gap-2 text-left text-gray-900 md:pointer-events-none"
                  aria-expanded={deliverySectionOpen}
                >
                  <MapPin className="h-5 w-5 shrink-0 text-brand" />
                  <div className="min-w-0">
                    <h3 className="whitespace-nowrap text-sm font-semibold sm:text-base">Entrega</h3>
                    <p className={`truncate text-xs text-gray-500 md:hidden ${deliverySectionOpen ? 'hidden' : 'block'}`}>
                      {deliverySummary}
                    </p>
                  </div>
                </button>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenAddressConfirmModal}
                    disabled={isMasterAccount && !selectedBeneficiary}
                    className="whitespace-nowrap text-xs font-semibold text-black hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
                  >
                    Cambiar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliverySectionOpen((open) => !open)}
                    className="rounded p-0.5 text-gray-400 md:hidden"
                    aria-label={deliverySectionOpen ? 'Ocultar entrega' : 'Ver entrega'}
                  >
                    <ChevronDown
                      className={`h-5 w-5 transition-transform ${deliverySectionOpen ? 'rotate-180' : ''}`}
                      aria-hidden
                    />
                  </button>
                </div>
              </div>
              <ul
                className={`space-y-1 border-t border-gray-100 px-5 pb-4 pt-3 text-sm text-gray-600 ${
                  deliverySectionOpen ? 'block' : 'hidden'
                } md:mt-3 md:block md:border-t-0 md:px-5 md:pb-5 md:pt-0`}
              >
                <li className="font-medium text-gray-900">{deliverySummary}</li>
                {primaryAddress ? (
                  <>
                    <li className="text-xs text-gray-500">{getScopeLabel(primaryAddress)}</li>
                    <li>{formatCheckoutAddressLine(primaryAddress)}</li>
                  </>
                ) : isMasterAccount && !selectedBeneficiary ? (
                  <li className="text-xs text-amber-700">Selecciona un cliente para ver su dirección</li>
                ) : isMasterAccount && selectedBeneficiary ? (
                  <li className="text-xs text-amber-700">Agrega una dirección para este cliente</li>
                ) : null}
              </ul>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="font-semibold text-gray-900">Cupón de descuento</h2>
            {livePricingEnabled ? (
              <p className="mt-2 text-xs text-gray-500">
                Con Precios Live activos solo aplican cupones habilitados para uso en Live.
              </p>
            ) : null}
            <div className="mt-3 flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  placeholder="Código"
                  disabled={!!appliedCode || applyingCode}
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm uppercase focus:border-black focus:outline-none disabled:bg-gray-50"
                />
              </div>
              {appliedCode ? (
                <button
                  type="button"
                  onClick={handleRemoveCode}
                  disabled={applyingCode}
                  className="shrink-0 rounded-lg border border-gray-300 px-3 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Quitar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyCode}
                  disabled={applyingCode || !codeInput.trim()}
                  className="shrink-0 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
                >
                  {applyingCode ? '…' : 'Aplicar'}
                </button>
              )}
            </div>
            {codeError && <p className="mt-2 text-xs text-red-600">{codeError}</p>}
            {appliedCode && (
              <p className="mt-2 text-xs font-bold text-gray-900">
                ✓ {appliedCode.code} aplicado — {appliedCode.label}
              </p>
            )}

            <div className="mt-6 space-y-2 border-t pt-4 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-bold text-gray-900">S/ {grossSubtotal.toFixed(2)}</span>
              </div>
              {decantPromoDiscount > 0 && (
                <div className="flex justify-between text-gray-900">
                  <span>Promoción decants</span>
                  <span className="font-bold">- S/ {decantPromoDiscount.toFixed(2)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-gray-900">
                  <span>Descuento</span>
                  <span className="font-bold">- S/ {discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-3 text-gray-600">
                <span className="shrink-0">Envío</span>
                <ShippingChargeDisplay
                  deliveryFee={deliveryFee}
                  deliveryMode={delivery.mode}
                  className="min-w-0 font-bold text-gray-900"
                />
              </div>
              <div className="flex justify-between border-t pt-2 text-lg">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-gray-900">S/ {total.toFixed(2)}</span>
              </div>
            </div>

            {!isAddressReady && (
              <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                {isMasterAccount
                  ? 'Selecciona el cliente y confirma su dirección de entrega antes de reservar el pedido.'
                  : 'Confirma tu dirección de entrega antes de reservar el pedido.'}
              </p>
            )}

            {paymentMethodsError && (
              <p className="mt-4 text-xs text-red-600">{paymentMethodsError}</p>
            )}

            {reserveError && (
              <p className="mt-4 text-xs text-red-600">{reserveError}</p>
            )}

            <button
              type="button"
              onClick={handleOpenReserveModal}
              disabled={
                loadingPaymentMethods
                || paymentMethods.length === 0
                || reserving
                || !isAddressReady
              }
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-black py-3.5 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {reserving ? 'Reservando stock…' : 'RESERVAR PEDIDO'}
            </button>
            <p className="mt-3 text-center text-xs text-gray-500">
              Podrás pagar con uno o más métodos y subir tus comprobantes antes de enviar por WhatsApp.
            </p>
          </div>
        </div>
      </div>

      <MasterCheckoutClientPickerModal
        open={showMasterClientPicker && isMasterAccount && !draftOrderId && !promptCancelOnOpen}
        beneficiaries={masterBeneficiaries}
        searchValue={masterBeneficiarySearch}
        onSearchChange={handleMasterSearchChange}
        onSelect={handleSelectMasterBeneficiary}
        onEdit={handleOpenMasterEditClient}
        onDelete={handleOpenMasterDeleteClient}
        onCreate={handleOpenMasterCreateClient}
        onClose={() => setShowMasterClientPicker(false)}
        isLoading={isLoadingMasterBeneficiaries}
        error={masterPickerError}
      />

      <MasterCheckoutCreateClientModal
        open={showMasterCreateClient}
        beneficiary={editingMasterBeneficiary}
        onClose={() => {
          setShowMasterCreateClient(false)
          setEditingMasterBeneficiary(null)
          setShowMasterClientPicker(true)
        }}
        onSubmit={handleSubmitMasterBeneficiary}
        isSubmitting={isSavingMasterBeneficiary}
        error={masterCreateError}
      />

      <MasterCheckoutDeleteClientModal
        beneficiary={deletingMasterBeneficiary}
        isProcessing={isDeletingMasterBeneficiary}
        error={masterDeleteError}
        onCancel={() => {
          if (isDeletingMasterBeneficiary) return
          setDeletingMasterBeneficiary(null)
          setMasterDeleteError('')
        }}
        onConfirm={handleConfirmDeleteMasterBeneficiary}
      />

      <CheckoutAddressConfirmModal
        open={showAddressConfirmModal && !draftOrderId && !promptCancelOnOpen && (!isMasterAccount || Boolean(selectedBeneficiary))}
        addresses={addresses}
        selectedAddressId={selectedAddressId}
        onSelectAddress={setSelectedAddressId}
        onConfirm={handleConfirmAddress}
        onAddNew={handleAddNewAddress}
        onClose={handleCloseAddressConfirmModal}
        isConfirming={isConfirmingAddress}
        error={addressConfirmError}
        title={isMasterAccount ? '¿La dirección del cliente es la correcta?' : undefined}
        description={isMasterAccount
          ? 'Confirma dónde recibirá el pedido el cliente seleccionado. Puedes elegir otra dirección guardada o agregar una nueva.'
          : undefined}
      />

      <ReserveOrderModal
        open={showReserveModal}
        draftOrderId={draftOrderId}
        onClose={handleCloseReserveModal}
        onCancelled={handleReservationCancelled}
        items={items}
        subtotal={subtotal}
        discount={discount}
        discountCode={appliedCode?.code || null}
        total={total}
        totalQuantity={totalQuantity}
        deliveryFee={deliveryFee}
        deliveryMode={delivery.mode}
        deliveryLabel={delivery.label}
        primaryAddress={primaryAddress}
        accessToken={accessToken}
        paymentMethods={paymentMethods}
        onOrderCreated={handleOrderCreated}
      />
    </div>
  )
}
