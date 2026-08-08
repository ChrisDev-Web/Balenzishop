import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Tag, MapPin, User, Plus, Minus, Trash2 } from 'lucide-react'
import { useCartStore } from '../stores/cartStore'
import { useAuthStore } from '../stores/authStore'
import { useCheckoutDraftStore } from '../stores/checkoutDraftStore'
import { useUiStore } from '../stores/uiStore'
import { AUTH_INTENT } from '../utils/authFlow'
import { fetchActivePaymentMethods } from '../api/paymentMethods'
import {
  validateDiscountCoupon,
  mapValidationToAppliedCoupon,
  buildEligibleDiscountMap,
} from '../api/discountCoupons'
import { getDeliveryFeeForAddress, computeOrderTotal, formatShippingDisplay } from '../utils/deliveryFee'
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

export default function CheckoutPage() {
  const navigate = useNavigate()
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
  const hasPromptedAddressRef = useRef(false)

  const isEditing = !!editingOrderId
  const addresses = user?.addresses || []
  const primaryAddress = addresses.find((a) => a.isPrimary) || addresses[0]
  const discount = appliedCode?.discount || 0
  const delivery = getDeliveryFeeForAddress(primaryAddress)
  const deliveryFee = delivery.fee
  const total = computeOrderTotal(subtotal, discount, deliveryFee, delivery.mode)
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalQuantity = totalItems

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
    if (user && !user.profileComplete) {
      navigate('/mi-cuenta/completar-perfil', { replace: true })
      return
    }
    if (user?.profileComplete && !user.addresses?.length) {
      navigate('/mi-cuenta/direcciones?flujo=pedido', { replace: true })
    }
  }, [isAuthenticated, user, navigate, openLoginModal])

  useEffect(() => {
    if (!isAuthenticated) return

    syncAddresses().catch(() => {})
  }, [isAuthenticated, syncAddresses])

  useEffect(() => {
    if (!user?.profileComplete || addresses.length === 0) return

    if (draftOrderId && !promptCancelOnOpen) {
      setAddressConfirmed(true)
      return
    }

    if (hasPromptedAddressRef.current) return

    hasPromptedAddressRef.current = true
    setSelectedAddressId(primaryAddress?.id || null)
    setShowAddressConfirmModal(true)
    setAddressConfirmed(false)
  }, [user?.profileComplete, addresses.length, primaryAddress?.id, draftOrderId, promptCancelOnOpen])

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
        const result = await updateAddress(selected.id, { isPrimary: true })

        if (!result.success) {
          setAddressConfirmError(result.error || 'No se pudo actualizar la dirección principal')
          return
        }
      }

      setAddressConfirmed(true)
      setShowAddressConfirmModal(false)
    } finally {
      setIsConfirmingAddress(false)
    }
  }

  const handleAddNewAddress = () => {
    setAuthIntent(AUTH_INTENT.CHECKOUT, '/pedido')
    navigate('/mi-cuenta/direcciones?flujo=pedido&nueva=1')
  }

  const handleOpenAddressConfirmModal = () => {
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
      items: mapped.items,
      subtotal: mapped.subtotal,
      discount: mapped.discount,
      discountCode: mapped.discountCode,
      deliveryFee: mapped.deliveryFee,
      deliveryLabel: mapped.deliveryLabel,
      deliveryMode: mapped.deliveryMode,
      total: mapped.total,
      customer: user,
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

  if (!user?.profileComplete) {
    return null
  }

  if (!primaryAddress) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-sm text-gray-600">Cargando dirección de entrega…</p>
      </div>
    )
  }

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
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-2 text-gray-900">
                <User className="h-5 w-5 text-brand" />
                <h3 className="font-semibold">Datos del cliente</h3>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-gray-600">
                <li>{[user.firstName, user.lastNamePaternal, user.lastNameMaternal].filter(Boolean).join(' ') || '—'}</li>
                {user.documentId && <li>{user.documentTypeName || 'Documento'}: {user.documentId}</li>}
                <li>{user.email}</li>
                <li>{user.phone || '—'}</li>
              </ul>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-gray-900">
                  <MapPin className="h-5 w-5 text-brand" />
                  <h3 className="font-semibold">Entrega</h3>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddressConfirmModal}
                  className="shrink-0 text-xs font-semibold text-black hover:underline"
                >
                  Cambiar
                </button>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-gray-600">
                <li className="font-medium text-gray-900">
                  {primaryAddress.district}, {primaryAddress.city}
                </li>
                <li className="text-xs text-gray-500">{getScopeLabel(primaryAddress)}</li>
                <li>{formatCheckoutAddressLine(primaryAddress)}</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="font-semibold text-gray-900">Cupón de descuento</h2>
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
              <div className="flex justify-between text-gray-600">
                <span>Envío</span>
                <span className="font-bold text-gray-900">
                  {formatShippingDisplay({ deliveryFee })}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2 text-lg">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-gray-900">S/ {total.toFixed(2)}</span>
              </div>
            </div>

            {!addressConfirmed && (
              <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Confirma tu dirección de entrega antes de reservar el pedido.
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
                || !addressConfirmed
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

      <CheckoutAddressConfirmModal
        open={showAddressConfirmModal}
        addresses={addresses}
        selectedAddressId={selectedAddressId}
        onSelectAddress={setSelectedAddressId}
        onConfirm={handleConfirmAddress}
        onAddNew={handleAddNewAddress}
        isConfirming={isConfirmingAddress}
        error={addressConfirmError}
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
