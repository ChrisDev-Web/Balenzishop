import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Tag, MapPin, User, Plus } from 'lucide-react'
import { useCartStore } from '../stores/cartStore'
import { useAuthStore } from '../stores/authStore'
import { useUiStore } from '../stores/uiStore'
import { AUTH_INTENT } from '../utils/authFlow'
import { fetchActivePaymentMethods } from '../api/paymentMethods'
import {
  validateDiscountCoupon,
  mapValidationToAppliedCoupon,
  buildEligibleDiscountMap,
} from '../api/discountCoupons'
import { getDeliveryFeeForAddress, computeOrderTotal } from '../utils/deliveryFee'
import { buildWhatsAppMessage, openWhatsAppOrder } from '../utils/orderMessage'
import { mapApiClientOrder } from '../utils/clientOrderMapper'
import ReserveOrderModal from '../components/checkout/ReserveOrderModal'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, totalPrice, clearCart, clearEditingOrder, editingOrderId, editingDiscountCode } = useCartStore()
  const { user, isAuthenticated, accessToken } = useAuthStore()
  const openLoginModal = useUiStore((s) => s.openLoginModal)

  const [codeInput, setCodeInput] = useState('')
  const [appliedCode, setAppliedCode] = useState(null)
  const [codeError, setCodeError] = useState('')
  const [applyingCode, setApplyingCode] = useState(false)
  const [showReserveModal, setShowReserveModal] = useState(false)

  const [paymentMethods, setPaymentMethods] = useState([])
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true)
  const [paymentMethodsError, setPaymentMethodsError] = useState('')

  const isEditing = !!editingOrderId
  const primaryAddress = user?.addresses?.find((a) => a.isPrimary) || user?.addresses?.[0]
  const subtotal = totalPrice()
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

  const handleOrderCreated = async (apiOrder) => {
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
      status: mapped.status,
    })

    clearCart()
    clearEditingOrder()
    await openWhatsAppOrder(message)
    navigate('/mi-cuenta/pedidos')
  }

  if (items.length === 0 && !showReserveModal) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Tu carrito está vacío</h1>
        <p className="mt-2 text-gray-600">Agrega productos antes de hacer un pedido.</p>
        <Link to="/catalogo" className="mt-6 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white">
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

  if (!user?.profileComplete || !primaryAddress) {
    return null
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
              {items.map((item) => {
                const lineTotal = item.price * item.quantity
                const discountInfo = eligibleDiscountByProductId.get(Number(item.id))

                return (
                  <li key={item.id} className="flex gap-4 py-4">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-20 w-16 shrink-0 rounded object-contain bg-gray-50" />
                    ) : (
                      <div className="h-20 w-16 shrink-0 rounded bg-gray-100" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.brand}</p>
                      <p className="mt-1 text-sm text-gray-600">Cantidad: {item.quantity}</p>
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
              <div className="flex items-center gap-2 text-gray-900">
                <MapPin className="h-5 w-5 text-brand" />
                <h3 className="font-semibold">Entrega</h3>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-gray-600">
                <li className="font-medium text-gray-900">Ubicación principal</li>
                <li>{primaryAddress.district}, {primaryAddress.city}</li>
                <li>{primaryAddress.shalon}</li>
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
                <span className="font-bold text-gray-900">S/ {subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-gray-900">
                  <span>Descuento</span>
                  <span className="font-bold">- S/ {discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Envío</span>
                <span className="font-bold text-gray-900">
                  {delivery.mode === 'delivery' && deliveryFee > 0
                    ? `S/ ${deliveryFee.toFixed(2)}`
                    : 'Sin cargo'}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2 text-lg">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-gray-900">S/ {total.toFixed(2)}</span>
              </div>
            </div>

            {paymentMethodsError && (
              <p className="mt-4 text-xs text-red-600">{paymentMethodsError}</p>
            )}

            <button
              type="button"
              onClick={() => setShowReserveModal(true)}
              disabled={loadingPaymentMethods || paymentMethods.length === 0}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-black py-3.5 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-50"
            >
              RESERVAR PEDIDO
            </button>
            <p className="mt-3 text-center text-xs text-gray-500">
              Podrás pagar con uno o más métodos y subir tus comprobantes antes de enviar por WhatsApp.
            </p>
          </div>
        </div>
      </div>

      <ReserveOrderModal
        open={showReserveModal}
        onClose={() => setShowReserveModal(false)}
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
