import { DELIVERY_TYPES } from './deliveryTypes'
import { formatShalonLabel } from './addressMapper'
import { COMPRA_RAPIDA_CHANNELS } from '../stores/compraRapidaStore'

const DELIVERY_OPTION_SHALOM = 'shalom'
const DELIVERY_OPTION_BALENZI = 'balenzi'

export function buildCompraRapidaGuestCustomer(customer) {
  return {
    name: customer.name?.trim() ?? '',
    last_name_paternal: customer.last_name_paternal?.trim() ?? '',
    last_name_maternal: customer.last_name_maternal?.trim() || null,
    id_document_type: customer.id_document_type ? Number(customer.id_document_type) : null,
    document_number: customer.document_number?.trim() || null,
    phone: customer.phone?.trim() ?? '',
  }
}

export function buildCompraRapidaGuestDeliveryPayload({
  deliveryChannel,
  deliveryScope,
  deliveryForm,
}) {
  if (deliveryChannel === COMPRA_RAPIDA_CHANNELS.SHALOM) {
    return {
      delivery_type: 'shalom',
      delivery_scope: deliveryScope || 'provincia',
      shalon: deliveryForm.shalon || formatShalonLabel(deliveryForm.shalonName, deliveryForm.shalonAddress),
      id_shalon: deliveryForm.idShalon ? Number(deliveryForm.idShalon) : undefined,
      district: deliveryForm.district || null,
      city: deliveryForm.city || null,
    }
  }

  return {
    delivery_type: 'delivery_rainau',
    full_address: deliveryForm.fullAddress,
    google_maps_link: deliveryForm.googleMapsLink || null,
    geo_lat: deliveryForm.geoLat,
    geo_lng: deliveryForm.geoLng,
    coverage_zone: deliveryForm.coverageZone,
    delivery_fee: Number(deliveryForm.deliveryFee || 0),
    district: deliveryForm.district || null,
    city: deliveryForm.city || 'Lima',
  }
}

export function buildCompraRapidaCheckoutPreset({
  deliveryChannel,
  deliveryScope,
  customer,
  deliveryForm,
}) {
  const isShalom = deliveryChannel === COMPRA_RAPIDA_CHANNELS.SHALOM
  const safeCustomer = customer && typeof customer === 'object' ? customer : {}
  const safeDeliveryForm = deliveryForm && typeof deliveryForm === 'object' ? deliveryForm : {}

  return {
    customer: { ...safeCustomer },
    deliveryForm: { ...safeDeliveryForm },
    deliveryType: isShalom ? DELIVERY_TYPES.SHALON : DELIVERY_TYPES.RAINAU,
    deliveryScope: isShalom ? (deliveryScope || 'provincia') : 'lima',
    deliveryOption: isShalom ? DELIVERY_OPTION_SHALOM : DELIVERY_OPTION_BALENZI,
    limaDeliveryType: isShalom ? null : DELIVERY_TYPES.RAINAU,
    startStep: 'date',
  }
}

export function mapCompraRapidaItemsToGuestCart(cartItems) {
  return cartItems.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    price: item.price,
    idProductDecant: item.idProductDecant ?? undefined,
    name: item.name,
    image: item.image,
    brand: item.brand,
    isDecant: item.isDecant,
  }))
}