import { getRoleLabel } from './pricing'
import { DELIVERY_MODES } from './deliveryFee'
import { formatAppDateTime } from './dateTime'

const STORE_NAME = 'BALENZISHOP'
const WHATSAPP_NUMBER = '51924341477'

/** Emojis via code points — evita corrupción al compilar el bundle */
const ICON = {
  bag: String.fromCodePoint(0x1f6cd, 0xfe0f),
  clipboard: String.fromCodePoint(0x1f4cb),
  calendar: String.fromCodePoint(0x1f4c5),
  receipt: String.fromCodePoint(0x1f9fe),
  lotion: String.fromCodePoint(0x1f9f4),
  package: String.fromCodePoint(0x1f4e6),
  money: String.fromCodePoint(0x1f4b5),
  multiply: '×',
  equals: '=',
  abacus: String.fromCodePoint(0x1f9ee),
  ticket: String.fromCodePoint(0x1f39f, 0xfe0f),
  card: String.fromCodePoint(0x1f4b3),
  truck: String.fromCodePoint(0x1f69a),
  check: String.fromCodePoint(0x2705),
  coins: String.fromCodePoint(0x1f4b0),
  person: String.fromCodePoint(0x1f464),
  wave: String.fromCodePoint(0x1f64b),
  id: String.fromCodePoint(0x1faaa),
  email: String.fromCodePoint(0x1f4e7),
  phone: String.fromCodePoint(0x1f4f1),
  pin: String.fromCodePoint(0x1f4cd),
  label: String.fromCodePoint(0x1f3f7, 0xfe0f),
  pushpin: String.fromCodePoint(0x1f4cc),
  telephone: String.fromCodePoint(0x1f4de),
  role: String.fromCodePoint(0x1f454),
}

const SEP = '━━━━━━━━━━━━━━━━━'

function formatShippingLine({ deliveryFee, deliveryLabel, deliveryMode }) {
  if (deliveryMode === DELIVERY_MODES.DELIVERY && deliveryFee > 0) {
    return `${ICON.truck} Envío (${deliveryLabel || 'Delivery'}): S/ ${deliveryFee.toFixed(2)}`
  }
  if (deliveryMode === DELIVERY_MODES.SHALON_PAID) {
    return `${ICON.truck} Recojo en Shalon (con cargo)`
  }
  return `${ICON.truck} Recojo en Shalon: sin cargo`
}

export function generateOrderId() {
  return `PED-${String(Math.floor(10000 + Math.random() * 90000))}`
}

export function formatOrderDate(date = new Date()) {
  return formatAppDateTime(date)
}

export function buildWhatsAppMessage({
  orderId,
  date,
  items,
  subtotal,
  discount,
  discountCode,
  deliveryFee = 0,
  deliveryLabel,
  deliveryMode = DELIVERY_MODES.SHALON_FREE,
  total,
  customer,
  address,
  paymentMode,
  reservationAmount = 0,
  amountPaid = 0,
  balanceDue = 0,
  payments = [],
  status = 'Pendiente',
}) {
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const lines = []

  lines.push(`${ICON.bag} *NUEVO PEDIDO — ${STORE_NAME}*`)
  lines.push(SEP)
  lines.push(`${ICON.clipboard} *Pedido:* ${orderId}`)
  lines.push(`${ICON.calendar} *Fecha:* ${date}`)
  lines.push(`${ICON.receipt} *Ítems:* ${totalItems}`)
  lines.push(`${ICON.label} *Estado:* ${status}`)
  lines.push(SEP)
  lines.push(`${ICON.lotion} *PRODUCTOS*`)

  items.forEach((item, index) => {
    const lineTotal = item.price * item.quantity
    const discountInfo = item.discountAmount > 0
      ? ` (desc. -S/ ${item.discountAmount.toFixed(2)})`
      : ''
    lines.push(`*${index + 1}.* ${item.name}`)
    lines.push(
      `   ${ICON.package} ${item.quantity} ${ICON.multiply} S/ ${item.price.toFixed(2)} ${ICON.equals} S/ ${(item.discountedSubtotal ?? lineTotal).toFixed(2)}${discountInfo}`,
    )
  })

  lines.push(`${ICON.abacus} Subtotal: S/ ${subtotal.toFixed(2)}`)
  if (discount > 0) {
    const codeSuffix = discountCode ? ` (${discountCode})` : ''
    lines.push(`${ICON.ticket} Descuento${codeSuffix}: -S/ ${discount.toFixed(2)}`)
  }
  lines.push(formatShippingLine({ deliveryFee, deliveryLabel, deliveryMode }))
  lines.push(`${ICON.coins} *Total pedido: S/ ${total.toFixed(2)}*`)

  if (paymentMode === 'reserva') {
    lines.push(`${ICON.money} Reserva pagada: S/ ${amountPaid.toFixed(2)} (S/ ${reservationAmount.toFixed(2)} esperado)`)
    lines.push(`${ICON.coins} Saldo pendiente: S/ ${balanceDue.toFixed(2)}`)
  } else if (paymentMode === 'completo') {
    lines.push(`${ICON.money} Pago completo registrado: S/ ${amountPaid.toFixed(2)}`)
  }

  if (payments.length > 0) {
    lines.push(`${ICON.card} *Pagos registrados:*`)
    payments.forEach((payment) => {
      lines.push(`   • ${payment.methodName}: S/ ${Number(payment.amount).toFixed(2)}`)
    })
  }

  lines.push(SEP)
  lines.push(`${ICON.person} *CLIENTE*`)

  const fullName = [customer.firstName, customer.lastNamePaternal, customer.lastNameMaternal]
    .filter(Boolean)
    .join(' ')
  lines.push(`${ICON.wave} ${fullName || 'Sin nombre'}`)

  if (customer.documentId) {
    const docLabel = customer.documentTypeName || 'Documento'
    lines.push(`${ICON.id} ${docLabel}: ${customer.documentId}`)
  }
  if (customer.email) lines.push(`${ICON.email} ${customer.email}`)
  if (customer.phone) lines.push(`${ICON.phone} ${customer.phone}`)
  lines.push(`${ICON.role} *${getRoleLabel(customer.role)}*`)

  lines.push(SEP)
  lines.push(`${ICON.pin} *ENTREGA*`)

  if (address) {
    lines.push(`${ICON.label} *Ubicación principal*`)
    lines.push(`${ICON.pin} ${address.district}, ${address.city}`)
    if (address.shalon) lines.push(`${ICON.pushpin} ${address.shalon}`)
    if (customer.phone) lines.push(`${ICON.telephone} ${customer.phone}`)
  } else {
    lines.push(`${ICON.pin} Sin dirección registrada`)
  }

  lines.push(SEP)
  lines.push(`${ICON.check} Pedido registrado. Estado: ${status}.`)

  return lines.join('\n')
}

export function buildBalancePaymentWhatsAppMessage({
  orderId,
  date,
  total,
  balanceDue,
  amountPaid,
  payments = [],
  customer,
}) {
  const lines = []

  lines.push(`${ICON.check} *PAGO RESTANTE COMPLETADO — ${STORE_NAME}*`)
  lines.push(SEP)
  lines.push(`${ICON.clipboard} *Pedido:* ${orderId}`)
  lines.push(`${ICON.calendar} *Fecha:* ${date}`)
  lines.push(`${ICON.coins} *Total pedido:* S/ ${Number(total).toFixed(2)}`)
  lines.push(`${ICON.money} *Saldo pagado ahora:* S/ ${Number(balanceDue).toFixed(2)}`)
  lines.push(`${ICON.abacus} *Total pagado acumulado:* S/ ${Number(amountPaid).toFixed(2)}`)
  lines.push(SEP)

  if (payments.length > 0) {
    lines.push(`${ICON.card} *Pagos del saldo:*`)
    payments.forEach((payment) => {
      lines.push(`   • ${payment.methodName}: S/ ${Number(payment.amount).toFixed(2)}`)
    })
    lines.push(SEP)
  }

  const fullName = [customer?.firstName, customer?.lastNamePaternal, customer?.lastNameMaternal]
    .filter(Boolean)
    .join(' ')
  lines.push(`${ICON.person} *CLIENTE:* ${fullName || 'Sin nombre'}`)
  if (customer?.documentId) {
    lines.push(`${ICON.id} ${customer.documentTypeName || 'Documento'}: ${customer.documentId}`)
  }
  if (customer?.phone) lines.push(`${ICON.phone} ${customer.phone}`)

  lines.push(SEP)
  lines.push(`${ICON.check} PAGO RESTANTE COMPLETADO`)

  return lines.join('\n')
}

function buildWhatsAppUrl(message) {
  const encoded = encodeURIComponent(message)
  // wa.me corrompe emojis al redirigir; api.whatsapp.com preserva UTF-8
  return `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encoded}`
}

async function copyMessageToClipboard(message) {
  try {
    await navigator.clipboard.writeText(message)
    return true
  } catch {
    try {
      const textarea = document.createElement('textarea')
      textarea.value = message
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(textarea)
      return ok
    } catch {
      return false
    }
  }
}

export async function openWhatsAppOrder(message) {
  await copyMessageToClipboard(message)

  const url = buildWhatsAppUrl(message)
  const link = document.createElement('a')
  link.href = url
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  return { copied: true }
}

export function getWhatsAppNumber() {
  return WHATSAPP_NUMBER
}
