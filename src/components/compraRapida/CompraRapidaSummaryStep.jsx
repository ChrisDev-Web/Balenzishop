import { useId, useState } from 'react'
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  IdCard,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  Truck,
  UserRound,
} from 'lucide-react'
import { useCartStore } from '../../stores/cartStore'
import { useCartTotals } from '../../hooks/useCartTotals'
import { CART_MODES } from '../../utils/shoppingMode'
import { COMPRA_RAPIDA_CHANNELS, COMPRA_RAPIDA_STEPS, useCompraRapidaStore } from '../../stores/compraRapidaStore'
import { DELIVERY_MODES, getDeliveryFeeForAddress } from '../../utils/deliveryFee'
import { DELIVERY_TYPES } from '../../utils/deliveryTypes'

function formatSoles(amount) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(Number(amount) || 0)
}

function SummaryInfoRow({ icon: Icon, label, children }) {
  return (
    <div className="compra-rapida-summary__row">
      <span className="compra-rapida-summary__row-icon" aria-hidden>
        <Icon size={16} />
      </span>
      <div className="compra-rapida-summary__row-body">
        {label ? <span className="compra-rapida-summary__row-label">{label}</span> : null}
        <div className="compra-rapida-summary__row-value">{children}</div>
      </div>
    </div>
  )
}

function SummaryAccordion({
  sectionId,
  icon: Icon,
  title,
  preview,
  badge,
  defaultOpen = false,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen)
  const reactId = useId()
  const panelId = `${sectionId}-${reactId}`

  return (
    <article
      className={`compra-rapida-summary__card${open ? ' compra-rapida-summary__card--open' : ''}`}
    >
      <button
        type="button"
        className="compra-rapida-summary__toggle"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span className="compra-rapida-summary__section-icon" aria-hidden>
          <Icon size={18} />
        </span>
        <span className="compra-rapida-summary__toggle-text">
          <span className="compra-rapida-summary__section-title">
            {title}
            {badge != null ? (
              <span className="compra-rapida-summary__count">{badge}</span>
            ) : null}
          </span>
          {!open && preview ? (
            <span className="compra-rapida-summary__preview">{preview}</span>
          ) : null}
        </span>
        <ChevronDown
          size={20}
          className={`compra-rapida-summary__chevron${open ? ' compra-rapida-summary__chevron--open' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div id={panelId} className="compra-rapida-summary__panel">
          {children}
        </div>
      ) : null}
    </article>
  )
}

export default function CompraRapidaSummaryStep() {
  const {
    customer,
    deliveryForm,
    deliveryChannel,
    deliveryScope,
    setStep,
  } = useCompraRapidaStore()

  const cartItems = useCartStore((state) => state.minoristaItems)
  const {
    grossSubtotal,
    subtotal: subtotalAfterPromo,
    decantPromoDiscount,
  } = useCartTotals(CART_MODES.MINORISTA)
  const totalUnits = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const estimatedDelivery = getDeliveryFeeForAddress({
    deliveryScope: deliveryScope || (deliveryChannel === COMPRA_RAPIDA_CHANNELS.RAINAU_LIMA ? 'lima' : 'provincia'),
    deliveryType: deliveryChannel === COMPRA_RAPIDA_CHANNELS.RAINAU_LIMA
      ? DELIVERY_TYPES.RAINAU
      : DELIVERY_TYPES.SHALON,
    deliveryFee: deliveryForm.deliveryFee,
    coverageZone: deliveryForm.coverageZone,
    geoLat: deliveryForm.geoLat,
    geoLng: deliveryForm.geoLng,
  })
  const estimatedTotal = subtotalAfterPromo
    + (estimatedDelivery.mode === DELIVERY_MODES.DELIVERY ? Number(estimatedDelivery.fee || 0) : 0)

  const fullName = [
    customer.name,
    customer.last_name_paternal,
    customer.last_name_maternal,
  ].filter(Boolean).join(' ')

  const isLimaRainau = deliveryChannel === COMPRA_RAPIDA_CHANNELS.RAINAU_LIMA
  const DeliveryModeIcon = isLimaRainau ? ShieldCheck : Truck
  const deliveryModeLabel = isLimaRainau ? 'Motorizado (Lima)' : 'Shalom'

  const contactPreview = [fullName, customer.phone].filter(Boolean).join(' · ') || 'Sin datos'
  const deliveryLocation = deliveryChannel === COMPRA_RAPIDA_CHANNELS.SHALOM
    ? [deliveryForm.district, deliveryForm.city].filter(Boolean).join(' · ')
    : (deliveryForm.district || 'Lima')
  const deliveryPreview = `${deliveryModeLabel}${deliveryLocation ? ` · ${deliveryLocation}` : ''}`

  return (
    <section className="compra-rapida-summary">
      <header className="compra-rapida-summary__hero">
        <h1 className="compra-rapida-summary__title">Resumen de tu pedido</h1>
        <p className="compra-rapida-summary__subtitle">
          Toca cada bloque para ver el detalle.
        </p>
      </header>

      <SummaryAccordion
        sectionId="contact"
        icon={UserRound}
        title="Datos de contacto"
        preview={contactPreview}
      >
        <SummaryInfoRow icon={UserRound} label="Nombre">
          {fullName || '—'}
        </SummaryInfoRow>
        <SummaryInfoRow icon={Phone} label="Teléfono">
          {customer.phone || '—'}
        </SummaryInfoRow>
        <SummaryInfoRow icon={IdCard} label="Documento">
          {customer.document_number ? (
            customer.document_number
          ) : (
            <span className="compra-rapida-muted">No indicado</span>
          )}
        </SummaryInfoRow>
      </SummaryAccordion>

      <SummaryAccordion
        sectionId="delivery"
        icon={DeliveryModeIcon}
        title="Entrega"
        preview={deliveryPreview}
      >
        <div className="compra-rapida-summary__delivery-badge">
          <DeliveryModeIcon size={16} aria-hidden />
          <span>{isLimaRainau ? 'Motorizado (Lima) · Rainau' : 'Shalom'}</span>
        </div>
        {deliveryChannel === COMPRA_RAPIDA_CHANNELS.SHALOM ? (
          <>
            <SummaryInfoRow icon={MapPin} label="Sede">
              <span className="compra-rapida-summary__address">
                {deliveryForm.shalon || deliveryForm.shalonName || '—'}
              </span>
            </SummaryInfoRow>
            <p className="compra-rapida-summary__location-hint">
              {deliveryLocation || '—'}
            </p>
          </>
        ) : (
          <>
            <SummaryInfoRow icon={MapPin} label="Dirección">
              <span className="compra-rapida-summary__address">
                {deliveryForm.fullAddress || '—'}
              </span>
            </SummaryInfoRow>
            <p className="compra-rapida-summary__location-hint">
              {deliveryForm.district || 'Lima'}
            </p>
          </>
        )}
      </SummaryAccordion>

      <SummaryAccordion
        sectionId="products"
        icon={Package}
        title="Productos"
        badge={totalUnits}
        preview={formatSoles(subtotalAfterPromo)}
        defaultOpen
      >
        <ul className="compra-rapida-summary__list">
          {cartItems.map((item) => (
            <li
              key={item.idProductDecant ? `${item.id}-${item.idProductDecant}` : item.id}
              className="compra-rapida-summary__product"
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt=""
                  className="compra-rapida-summary__product-thumb"
                  loading="lazy"
                />
              ) : (
                <div
                  className="compra-rapida-summary__product-thumb compra-rapida-summary__product-thumb--empty"
                  aria-hidden
                />
              )}
              <div className="compra-rapida-summary__product-meta">
                <p className="compra-rapida-summary__product-name">
                  {item.name}
                  {item.isDecant && (item.decantSizeMl ?? item.sizeMl)
                    ? ` · ${item.decantSizeMl ?? item.sizeMl} ml`
                    : ''}
                </p>
                <p className="compra-rapida-summary__product-qty">
                  Cantidad: {item.quantity}
                </p>
              </div>
              <span className="compra-rapida-summary__product-price">
                {formatSoles(item.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <footer className="compra-rapida-summary__totals">
          <div className="compra-rapida-summary__totals-row">
            <span>Subtotal productos</span>
            <strong>{formatSoles(grossSubtotal)}</strong>
          </div>
          {decantPromoDiscount > 0 ? (
            <div className="compra-rapida-summary__totals-row">
              <span>Promoción decants</span>
              <strong>- {formatSoles(decantPromoDiscount)}</strong>
            </div>
          ) : null}
          {estimatedDelivery.fee > 0 ? (
            <div className="compra-rapida-summary__totals-row">
              <span>Envío ({estimatedDelivery.label})</span>
              <strong>{formatSoles(estimatedDelivery.fee)}</strong>
            </div>
          ) : null}
          <div className="compra-rapida-summary__totals-row compra-rapida-summary__totals-row--accent">
            <span>Total estimado</span>
            <strong>{formatSoles(estimatedTotal)}</strong>
          </div>
          <p className="compra-rapida-summary__totals-hint">
            El pago se confirma en el siguiente paso.
          </p>
        </footer>
      </SummaryAccordion>

      <div className="compra-rapida-summary__actions">
        <button
          type="button"
          className="compra-rapida-btn compra-rapida-btn--ghost compra-rapida-summary__back"
          onClick={() => setStep(COMPRA_RAPIDA_STEPS.CATALOG)}
        >
          <ChevronLeft size={18} aria-hidden />
          Volver al catálogo
        </button>
        <button
          type="button"
          className="compra-rapida-btn compra-rapida-btn--primary compra-rapida-summary__continue"
          onClick={() => setStep(COMPRA_RAPIDA_STEPS.CHECKOUT)}
        >
          Continuar
          <ArrowRight size={18} aria-hidden />
        </button>
      </div>
    </section>
  )
}