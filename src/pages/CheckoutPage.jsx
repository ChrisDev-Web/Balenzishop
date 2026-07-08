import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Tag, MessageCircle, MapPin, User, Plus } from 'lucide-react'
import { useCartStore } from '../stores/cartStore'
import { useAuthStore } from '../stores/authStore'
import { useUiStore } from '../stores/uiStore'
import { AUTH_INTENT } from '../utils/authFlow'
import { validateDiscountCode } from '../data/discountCodes'
import { getDeliveryFeeForAddress, computeOrderTotal } from '../utils/deliveryFee'
import {
  generateOrderId,
  formatOrderDate,
  buildWhatsAppMessage,
  openWhatsAppOrder,
} from '../utils/orderMessage'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, totalPrice, clearCart, editingOrderId, editingDiscountCode } = useCartStore()
  const { user, isAuthenticated, addOrder, updateOrder } = useAuthStore()
  const openLoginModal = useUiStore((s) => s.openLoginModal)

  const [codeInput, setCodeInput] = useState('')
  const [appliedCode, setAppliedCode] = useState(null)
  const [codeError, setCodeError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const isEditing = !!editingOrderId

  const primaryAddress = user?.addresses?.find((a) => a.isPrimary) || user?.addresses?.[0]
  const subtotal = totalPrice()
  const discount = appliedCode?.discount || 0
  const delivery = getDeliveryFeeForAddress(primaryAddress)
  const deliveryFee = delivery.fee
  const total = computeOrderTotal(subtotal, discount, deliveryFee, delivery.mode)
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)

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
    if (editingDiscountCode) {
      const result = validateDiscountCode(editingDiscountCode)
      if (result.valid) {
        setAppliedCode(result)
        setCodeInput(result.code)
      }
    }
  }, [editingDiscountCode])

  const handleApplyCode = () => {
    const result = validateDiscountCode(codeInput)
    if (!result.valid) {
      setCodeError(result.error)
      setAppliedCode(null)
      return
    }
    setCodeError('')
    setAppliedCode(result)
  }

  const handleRemoveCode = () => {
    setAppliedCode(null)
    setCodeInput('')
    setCodeError('')
  }

  const handleConfirmOrder = async () => {
    if (!isAuthenticated || !user) {
      navigate('/catalogo')
      return
    }

    if (!primaryAddress) {
      alert('Agrega una dirección de entrega en Mi cuenta → Direcciones antes de confirmar.')
      navigate('/mi-cuenta/direcciones')
      return
    }

    setSubmitting(true)

    const orderId = isEditing ? editingOrderId : generateOrderId()
    const date = formatOrderDate()

    const orderPayload = {
      id: orderId,
      date,
      items: items.map((i) => ({
        id: i.id,
        name: i.name,
        brand: i.brand,
        price: i.price,
        quantity: i.quantity,
      })),
      subtotal,
      discount,
      discountCode: appliedCode?.code || null,
      deliveryFee,
      deliveryLabel: delivery.label,
      deliveryMode: delivery.mode,
      total,
      address: primaryAddress,
    }

    const message = buildWhatsAppMessage({
      orderId,
      date,
      items,
      subtotal,
      discount,
      deliveryFee,
      deliveryLabel: delivery.label,
      deliveryMode: delivery.mode,
      total,
      customer: user,
      address: primaryAddress,
    })

    if (isEditing) {
      updateOrder(orderId, orderPayload)
    } else {
      addOrder(orderPayload)
    }

    clearCart()
    await openWhatsAppOrder(message)

    setSubmitting(false)
    navigate('/mi-cuenta/pedidos')
  }

  if (items.length === 0 && !submitting) {
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

  if (!user?.profileComplete) {
    return null
  }

  if (!primaryAddress) {
    return null
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-6">
      {isEditing && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Editando pedido <strong>#{editingOrderId}</strong>. Puedes agregar más productos desde el catálogo.
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Resumen del pedido actualizado' : 'Resumen del pedido'}
          </h1>
          <p className="mt-1 text-sm text-gray-600">{totalItems} producto{totalItems !== 1 ? 's' : ''} en tu pedido</p>
        </div>
        {isEditing && (
          <Link
            to="/catalogo"
            className="flex items-center gap-1.5 rounded-full border border-brand px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-light"
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
              {items.map((item) => (
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
                  </div>
                  <p className="font-bold text-brand">S/ {(item.price * item.quantity).toFixed(2)}</p>
                </li>
              ))}
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
              {primaryAddress ? (
                <ul className="mt-3 space-y-1 text-sm text-gray-600">
                  <li className="font-medium text-gray-900">Ubicación principal</li>
                  <li>{primaryAddress.district}, {primaryAddress.city}</li>
                  <li>{primaryAddress.shalon}</li>
                  {delivery.mode === 'delivery' && deliveryFee > 0 && (
                    <li className="text-brand">{delivery.label}: S/ {deliveryFee.toFixed(2)}</li>
                  )}
                  {delivery.mode === 'shalon_paid' && (
                    <li className="text-gray-600">Recojo en Shalon (con cargo)</li>
                  )}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-amber-600">
                  No tienes dirección.{' '}
                  <Link to="/mi-cuenta/direcciones" className="font-semibold text-brand underline">
                    Agregar dirección
                  </Link>
                </p>
              )}
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
                  disabled={!!appliedCode}
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm uppercase focus:border-brand focus:outline-none disabled:bg-gray-50"
                />
              </div>
              {appliedCode ? (
                <button
                  type="button"
                  onClick={handleRemoveCode}
                  className="shrink-0 rounded-lg border border-gray-300 px-3 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Quitar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyCode}
                  className="shrink-0 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-700"
                >
                  Aplicar
                </button>
              )}
            </div>
            {codeError && <p className="mt-2 text-xs text-red-600">{codeError}</p>}
            {appliedCode && (
              <p className="mt-2 text-xs font-medium text-green-600">
                ✓ {appliedCode.code} aplicado — {appliedCode.label}
              </p>
            )}

            <div className="mt-6 space-y-2 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>S/ {subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento</span>
                  <span>- S/ {discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Envío</span>
                {delivery.mode === 'delivery' && deliveryFee > 0 ? (
                  <span>S/ {deliveryFee.toFixed(2)}</span>
                ) : delivery.mode === 'shalon_paid' ? (
                  <span className="text-gray-600">Recojo Shalon (con cargo)</span>
                ) : (
                  <span className="text-green-600">Sin cargo</span>
                )}
              </div>
              <div className="flex justify-between border-t pt-2 text-lg font-bold">
                <span>Total</span>
                <span className="text-brand">S/ {total.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleConfirmOrder}
              disabled={submitting || !primaryAddress}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3.5 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-50"
            >
              <MessageCircle className="h-5 w-5" />
              {isEditing ? 'Actualizar y enviar por WhatsApp' : 'Confirmar y enviar por WhatsApp'}
            </button>
            <p className="mt-3 text-center text-xs text-gray-500">
              Se abrirá WhatsApp con el resumen. El mensaje también se copia al portapapeles.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
