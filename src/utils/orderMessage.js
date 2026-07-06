import { getRoleLabel } from './pricing'
import { DELIVERY_MODES } from './deliveryFee'

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
  return date.toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export function buildWhatsAppMessage({
  orderId,
  date,
  items,
  subtotal,
  discount,
  deliveryFee = 0,
  deliveryLabel,
  deliveryMode = DELIVERY_MODES.SHALON_FREE,
  total,
  customer,
  address,
}) {
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const lines = []

  lines.push(`${ICON.bag} *NUEVO PEDIDO — ${STORE_NAME}*`)
  lines.push(SEP)
  lines.push(`${ICON.clipboard} *Pedido:* ${orderId}`)
  lines.push(`${ICON.calendar} *Fecha:* ${date}`)
  lines.push(`${ICON.receipt} *Ítems:* ${totalItems}`)
  lines.push(SEP)
  lines.push(`${ICON.lotion} *PRODUCTOS*`)

  items.forEach((item, index) => {
    const lineTotal = item.price * item.quantity
    lines.push(`*${index + 1}.* ${item.name}`)
    lines.push(
      `   ${ICON.package} ${item.quantity} ${ICON.multiply} S/ ${item.price.toFixed(2)} ${ICON.equals} S/ ${lineTotal.toFixed(2)}`,
    )
  })

  lines.push(`${ICON.abacus} Subtotal: S/ ${subtotal.toFixed(2)}`)
  if (discount > 0) {
    lines.push(`${ICON.ticket} Descuento: -S/ ${discount.toFixed(2)}`)
  }
  lines.push(formatShippingLine({ deliveryFee, deliveryLabel, deliveryMode }))
  lines.push(`${ICON.coins} *Total: S/ ${total.toFixed(2)}*`)
  lines.push(SEP)
  lines.push(`${ICON.person} *CLIENTE*`)

  const fullName = [customer.firstName, customer.lastNamePaternal, customer.lastNameMaternal]
    .filter(Boolean)
    .join(' ')
  lines.push(`${ICON.wave} ${fullName || 'Sin nombre'}`)

  if (customer.documentId) {
    const docLabel = customer.documentType === 'CE' ? 'CE' : 'DNI'
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
  lines.push(`${ICON.check} Pedido listo para confirmar.`)

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
