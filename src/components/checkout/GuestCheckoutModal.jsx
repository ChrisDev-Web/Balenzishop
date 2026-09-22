import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Trash2, Upload, MessageCircle, ChevronLeft, CreditCard, Map, ShieldCheck, UserRound, Truck } from 'lucide-react'
import {
  reserveGuestCheckout,
  submitGuestCheckout,
  cancelGuestCheckoutReservation,
} from '../../api/guestCheckout'
import { listDistrictsPublic, listProvincesPublic, listRegionsPublic, listShalonsPublic } from '../../api/clientDirections'
import { calculateReservationAmount } from '../../utils/reservation'
import { findPaymentMethodById, isCashPaymentMethod } from '../../utils/paymentMethods'
import {
  allowsCashBalancePayment,
  allowsPosBalancePayment,
  filterCheckoutPaymentMethods,
  filterInitialPaymentMethods,
  isPosPaymentMethod,
  calculatePosSurcharge,
} from '../../utils/paymentSurcharge'
import { computeOrderTotal, getDeliveryFeeForAddress } from '../../utils/deliveryFee'
import ShippingChargeDisplay from './ShippingChargeDisplay'
import {
  BALENZI_DELIVERY_LABEL,
  DELIVERY_TYPES,
  getOwnDeliveryPickupFormValues,
  isOwnDeliveryType,
  OWN_DELIVERY_PICKUP_POINT_URL,
} from '../../utils/deliveryTypes'
import { useRainauAvailableDeliveryDates } from '../../hooks/useRainauAvailableDeliveryDates'
import { useShalomAvailableDeliveryDates } from '../../hooks/useShalomAvailableDeliveryDates'
import PaymentMethodCheckoutInfo from './PaymentMethodCheckoutInfo'
import RainauDeliveryDatePicker from './RainauDeliveryDatePicker'
import CancelCheckoutConfirmModal from './CancelCheckoutConfirmModal'
import CheckoutProofPolicyModal from './CheckoutProofPolicyModal'
import CheckoutProofPolicyConfirmModal from './CheckoutProofPolicyConfirmModal'
import { createClientId } from '../../utils/createClientId'
import {
  hasAcceptedProofPolicy,
  markProofPolicyAccepted,
  normalizeProofPolicyClientId,
} from '../../utils/proofPolicyStorage'
import useBodyScrollLock from '../../hooks/useBodyScrollLock'
import {
  validateCustomPaymentAmount,
  formatPaymentModeLabel,
} from '../../utils/customPayment'
import { saveGuestOrder } from '../../utils/guestOrderStorage'
import { inferDeliveryScopeFromShalonProvince } from '../../utils/addressFormHelpers'
import {
  applyShalonSelectionToForm,
  buildShalonMapsUrl,
  formatShalonLabel,
  mapDistrictOption,
  mapProvinceOption,
  mapRegionOption,
} from '../../utils/addressMapper'
import { LIMA_CITY } from '../../data/shalonLocations'
import SearchableCombobox from '../ui/SearchableCombobox'
import ShalonSearchCombobox from '../account/ShalonSearchCombobox'
import DeliveryLocationPicker from '../account/DeliveryLocationPicker'
import {
  isSelectableRainauCoverage,
  RAINAU_COVERAGE_REQUIRED_MESSAGE,
  resolveRainauCoverage,
} from '../../utils/rainauCoverage'

const DELIVERY_OPTION_SHALOM = 'shalom'
const DELIVERY_OPTION_BALENZI = 'balenzi'
const DELIVERY_OPTION_OWN = 'own'

const PAYMENT_MODE_RESERVATION = 'reserva'
const PAYMENT_MODE_FULL = 'completo'
const PAYMENT_MODE_CUSTOM = 'personalizado'

const STEP_DELIVERY_TYPE = 'delivery_type'
const STEP_DETAILS = 'details'
const STEP_DATE = 'date'
const STEP_PAYMENT = 'payment'
const STEP_FINAL = 'final'

const STEPS = [STEP_DELIVERY_TYPE, STEP_DETAILS, STEP_DATE, STEP_PAYMENT, STEP_FINAL]

const PROOF_WARNING =
  'No se aceptan comprobantes falsos, simulados o de fecha anterior. Puede cancelar tu pedido e iniciar acciones legales.'

const RESERVATION_NOTICE =
  'La reserva se descuenta del total; el saldo lo pagas en el siguiente paso.'

const PRODUCT_LIST_SCROLL_CLASS = 'max-h-[11.5rem] overflow-y-auto overscroll-contain'

const emptyCustomer = {
  name: '',
  last_name_paternal: '',
  last_name_maternal: '',
  document_number: '',
  phone: '',
}

const emptyDeliveryForm = {
  idRegion: '',
  region: '',
  city: '',
  idProvince: '',
  idDistrict: '',
  idShalon: '',
  district: '',
  shalonName: '',
  shalonLat: null,
  shalonLng: null,
  shalon: '',
  fullAddress: '',
  googleMapsLink: '',
  geoLat: null,
  geoLng: null,
  coverageZone: null,
  deliveryFee: 0,
}

function createPaymentRow(amount = '') {
  return {
    key: createClientId(),
    id_payment_method: '',
    amount: amount === '' ? '' : String(amount),
    files: [],
  }
}

function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100
}

function rebalancePaymentRows(rows, expectedAmount) {
  if (rows.length === 0) return rows

  if (rows.length === 1) {
    return [{ ...rows[0], amount: String(roundMoney(expectedAmount)) }]
  }

  const othersTotal = rows
    .slice(1)
    .reduce((sum, row) => sum + (Number(row.amount) || 0), 0)

  const firstAmount = roundMoney(Math.max(0, expectedAmount - othersTotal))

  return rows.map((row, index) =>
    (index === 0 ? { ...row, amount: String(firstAmount) } : row),
  )
}

function getStepSubtitle(step, paymentMode, {
  isOwnDelivery = false,
  isShalomShipDate = false,
  balanceDue = 0,
} = {}) {
  switch (step) {
    case STEP_DELIVERY_TYPE:
      return 'Elige cómo recibirás tu pedido'
    case STEP_DETAILS:
      return 'Completa tus datos y la información de entrega'
    case STEP_DATE:
      if (isOwnDelivery) {
        return 'Elige la fecha de encuentro en el punto de entrega'
      }
      if (isShalomShipDate) {
        return 'Elige la fecha de envío a Shalom'
      }
      return 'Elige la fecha de entrega Balenzi'
    case STEP_PAYMENT:
      return 'Indica si pagarás la reserva, un monto personalizado o el total'
    case STEP_FINAL:
      return paymentMode === PAYMENT_MODE_FULL || balanceDue <= 0.009
        ? 'Confirma tu pedido antes de enviar'
        : 'Elige cómo cancelarás el saldo restante'
    default:
      return ''
  }
}

function hasBalanceAfterInitialPayment(mode, balance) {
  return (mode === PAYMENT_MODE_RESERVATION || mode === PAYMENT_MODE_CUSTOM)
    && balance > 0.009
}

function requiresDocumentNumber(deliveryOption) {
  return deliveryOption === DELIVERY_OPTION_SHALOM
}

function buildGuestDeliveryPayload({
  deliveryScope,
  deliveryType,
  deliveryForm,
  scheduledDeliveryDate,
}) {
  const scheduledDate = scheduledDeliveryDate || null

  if (deliveryType === DELIVERY_TYPES.SHALON) {
    return {
      delivery_type: 'shalom',
      delivery_scope: deliveryScope,
      shalon: deliveryForm.shalon || formatShalonLabel(deliveryForm.shalonName, deliveryForm.shalonAddress),
      district: deliveryForm.district || null,
      city: deliveryForm.city || null,
      scheduled_delivery_date: scheduledDate,
    }
  }

  if (deliveryType === DELIVERY_TYPES.RAINAU) {
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
      scheduled_delivery_date: scheduledDate,
    }
  }

  return {
    delivery_type: 'delivery_own',
    full_address: deliveryForm.fullAddress?.trim() || null,
    google_maps_link: deliveryForm.googleMapsLink?.trim() || null,
    district: deliveryForm.district || null,
    city: deliveryForm.city || 'Lima',
    scheduled_delivery_date: scheduledDate,
  }
}

export default function GuestCheckoutModal({
  open,
  onClose,
  onOrderCreated,
  items,
  subtotal,
  discount,
  discountCode,
  packagingFee,
  paymentMethods,
}) {
  const [step, setStep] = useState(STEP_DELIVERY_TYPE)
  const [deliveryOption, setDeliveryOption] = useState(null)
  const [customer, setCustomer] = useState(emptyCustomer)
  const [deliveryScope, setDeliveryScope] = useState(null)
  const [limaDeliveryType, setLimaDeliveryType] = useState(null)
  const [deliveryType, setDeliveryType] = useState(DELIVERY_TYPES.SHALON)
  const [deliveryForm, setDeliveryForm] = useState(emptyDeliveryForm)
  const [draftOrderId, setDraftOrderId] = useState(null)
  const [guestToken, setGuestToken] = useState('')
  const [paymentMode, setPaymentMode] = useState(PAYMENT_MODE_RESERVATION)
  const [customPaymentAmount, setCustomPaymentAmount] = useState('')
  const [paymentRows, setPaymentRows] = useState([createPaymentRow()])
  const [remainderMethodId, setRemainderMethodId] = useState('')
  const [cashPaidWith, setCashPaidWith] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reserving, setReserving] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showProofPolicyModal, setShowProofPolicyModal] = useState(false)
  const [showProofPolicyConfirm, setShowProofPolicyConfirm] = useState(false)
  const [calendarPickerOpen, setCalendarPickerOpen] = useState(false)
  const [scheduledDeliveryDate, setScheduledDeliveryDate] = useState('')
  const [locationMapTrigger, setLocationMapTrigger] = useState(0)
  const [regionOptions, setRegionOptions] = useState([])
  const [provinceOptions, setProvinceOptions] = useState([])
  const [districtOptions, setDistrictOptions] = useState([])
  const [isLoadingRegions, setIsLoadingRegions] = useState(false)
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false)
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false)
  const modalScrollRef = useRef(null)
  const shalonFieldRef = useRef(null)

  const scrollShalonFieldIntoView = useCallback(() => {
    if (!window.matchMedia('(min-width: 640px)').matches) return

    const scrollEl = modalScrollRef.current
    const fieldEl = shalonFieldRef.current
    if (!scrollEl || !fieldEl) return

    requestAnimationFrame(() => {
      const scrollRect = scrollEl.getBoundingClientRect()
      const fieldRect = fieldEl.getBoundingClientRect()
      const dropdownSpace = 240
      const overflowBottom = fieldRect.bottom + dropdownSpace - scrollRect.bottom

      if (overflowBottom > 0) {
        scrollEl.scrollTop += overflowBottom + 8
      }
    })
  }, [])

  const handleShalonComboboxOpenChange = useCallback((isOpen) => {
    if (isOpen) scrollShalonFieldIntoView()
  }, [scrollShalonFieldIntoView])

  function handleModalScrollMouseDown(event) {
    const element = modalScrollRef.current
    if (!element || event.target !== element) return

    const scrollbarWidth = element.offsetWidth - element.clientWidth
    if (scrollbarWidth <= 0) return

    const rect = element.getBoundingClientRect()
    if (event.clientX >= rect.left + element.clientWidth) {
      event.stopPropagation()
    }
  }
  const stepIndex = STEPS.indexOf(step)
  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === STEPS.length - 1

  const isLimaScope = deliveryScope === 'lima'
  const isProvinciaScope = deliveryScope === 'provincia'
  const isShalomPickup = deliveryType === DELIVERY_TYPES.SHALON
  const isOwnDelivery = isLimaScope && isOwnDeliveryType(deliveryType)
  const isBalenziHomeDelivery = isLimaScope
    && deliveryType === DELIVERY_TYPES.RAINAU

  const deliveryAddress = useMemo(() => ({
    deliveryScope,
    deliveryType,
    deliveryFee: deliveryForm.deliveryFee,
    coverageZone: deliveryForm.coverageZone,
    geoLat: deliveryForm.geoLat,
    geoLng: deliveryForm.geoLng,
  }), [deliveryScope, deliveryType, deliveryForm])

  const deliveryInfo = useMemo(
    () => getDeliveryFeeForAddress(deliveryAddress),
    [deliveryAddress],
  )

  const deliveryMode = deliveryInfo.mode
  const deliveryLabel = deliveryInfo.label
  const effectiveDeliveryFee = deliveryInfo.fee

  const requiresRainauDeliveryDate = isBalenziHomeDelivery
  const requiresOwnDeliveryMeetingDate = isOwnDelivery
  const requiresShalomShipDate = isShalomPickup
  const requiresSharedRainauDeliveryDate = requiresRainauDeliveryDate || requiresOwnDeliveryMeetingDate

  const allowsPosForRemainder = allowsPosBalancePayment(
    deliveryMode,
    deliveryType,
  )

  const initialPaymentMethods = useMemo(
    () => filterInitialPaymentMethods(paymentMethods),
    [paymentMethods],
  )

  const remainderPaymentMethods = useMemo(
    () => filterCheckoutPaymentMethods(paymentMethods, {
      rainauDelivery: allowsPosForRemainder,
      allowCash: allowsCashBalancePayment(deliveryMode),
    }),
    [paymentMethods, allowsPosForRemainder, deliveryMode],
  )

  const {
    dates: availableDeliveryDates,
    sameDayCutoffPassed,
    isLoading: deliveryDatesLoading,
    error: deliveryDatesError,
    refresh: refreshDeliveryDates,
  } = useRainauAvailableDeliveryDates(open && requiresSharedRainauDeliveryDate, {
    deliveryMode: 'delivery',
    fastPoll: calendarPickerOpen,
    geoLat: requiresRainauDeliveryDate ? (deliveryForm.geoLat ?? null) : null,
    geoLng: requiresRainauDeliveryDate ? (deliveryForm.geoLng ?? null) : null,
  })

  const {
    dates: availableShalomDates,
    sameDayCutoffPassed: shalomSameDayCutoffPassed,
    isLoading: shalomDatesLoading,
    error: shalomDatesError,
    refresh: refreshShalomDates,
  } = useShalomAvailableDeliveryDates(open && requiresShalomShipDate, {
    fastPoll: calendarPickerOpen,
  })

  const reservationAmount = useMemo(
    () => calculateReservationAmount(items, { deliveryScope }),
    [items, deliveryScope],
  )

  const orderTotal = useMemo(
    () => computeOrderTotal(subtotal, discount, effectiveDeliveryFee, deliveryMode, packagingFee),
    [subtotal, discount, effectiveDeliveryFee, deliveryMode, packagingFee],
  )

  const customPaymentValidation = useMemo(
    () => (paymentMode === PAYMENT_MODE_CUSTOM
      ? validateCustomPaymentAmount(customPaymentAmount, reservationAmount, orderTotal)
      : { valid: true, amount: null, message: '' }),
    [paymentMode, customPaymentAmount, reservationAmount, orderTotal],
  )

  const expectedAmount = useMemo(() => {
    if (paymentMode === PAYMENT_MODE_FULL) return orderTotal
    if (paymentMode === PAYMENT_MODE_CUSTOM) {
      return customPaymentValidation.valid ? customPaymentValidation.amount : 0
    }
    return reservationAmount
  }, [paymentMode, orderTotal, reservationAmount, customPaymentValidation])

  const balanceDue = useMemo(() => {
    if (paymentMode === PAYMENT_MODE_FULL) return 0
    if (paymentMode === PAYMENT_MODE_CUSTOM && customPaymentValidation.valid) {
      return roundMoney(Math.max(0, orderTotal - customPaymentValidation.amount))
    }
    return roundMoney(Math.max(0, orderTotal - reservationAmount))
  }, [paymentMode, orderTotal, reservationAmount, customPaymentValidation])

  const paidTotal = useMemo(
    () => roundMoney(
      paymentRows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
    ),
    [paymentRows],
  )

  const amountMatches = Math.abs(paidTotal - expectedAmount) < 0.01

  const allRowsValid = paymentRows.every(
    (row) => row.id_payment_method && Number(row.amount) > 0 && row.files.length > 0,
  )

  const selectedRemainderMethod = findPaymentMethodById(remainderPaymentMethods, remainderMethodId)
  const remainderIsPos = isPosPaymentMethod(selectedRemainderMethod)
  const remainderIsCash = isCashPaymentMethod(selectedRemainderMethod)
  const remainderPosSurcharge = remainderIsPos ? calculatePosSurcharge(balanceDue) : 0
  const cashPaidWithAmount = Number(cashPaidWith)
  const cashPaidWithValid = !remainderIsCash
    || (Number.isFinite(cashPaidWithAmount) && cashPaidWithAmount >= balanceDue - 0.001)
  const cashChangeAmount = remainderIsCash && cashPaidWithValid
    ? roundMoney(Math.max(0, cashPaidWithAmount - balanceDue))
    : 0

  const guestProofPolicyId = normalizeProofPolicyClientId({
    documentNumber: customer.document_number,
    phone: customer.phone,
  })

  const canContinueFromDeliveryType = Boolean(deliveryOption)

  const canContinueFromDetails = useMemo(() => {
    if (!customer.name.trim() || !customer.last_name_paternal.trim()) {
      return false
    }

    if (requiresDocumentNumber(deliveryOption) && !customer.document_number.trim()) {
      return false
    }

    if (!customer.phone.trim()) {
      return false
    }

    if (deliveryOption === DELIVERY_OPTION_SHALOM) {
      return Boolean(deliveryForm.idShalon && deliveryForm.shalon)
    }

    if (deliveryOption === DELIVERY_OPTION_OWN) {
      return Boolean(deliveryForm.googleMapsLink?.trim())
    }

    if (deliveryOption === DELIVERY_OPTION_BALENZI) {
      return Boolean(
        deliveryForm.idDistrict
        && deliveryForm.fullAddress?.trim()
        && deliveryForm.geoLat != null
        && deliveryForm.geoLng != null
        && isSelectableRainauCoverage(resolveRainauCoverage(deliveryForm.geoLat, deliveryForm.geoLng)),
      )
    }

    return false
  }, [customer, deliveryOption, deliveryScope, deliveryForm])

  const canContinueFromDate = Boolean(scheduledDeliveryDate)

  const canContinueFromPayment = amountMatches
    && allRowsValid
    && (paymentMode !== PAYMENT_MODE_CUSTOM || customPaymentValidation.valid)

  const canContinueFromFinal = paymentMode === PAYMENT_MODE_FULL
    || balanceDue <= 0.009
    || (Boolean(remainderMethodId) && cashPaidWithValid)

  const canSubmit = canContinueFromFinal && !submitting && !cancelling && draftOrderId && guestToken

  const regionComboboxOptions = useMemo(
    () => regionOptions.map((item) => ({
      value: item.idRegion,
      label: item.label,
      raw: item,
    })),
    [regionOptions],
  )

  const provinceComboboxOptions = useMemo(
    () => provinceOptions.map((item) => ({
      value: item.idProvince,
      label: item.label,
      raw: item,
    })),
    [provinceOptions],
  )

  const districtComboboxOptions = useMemo(
    () => districtOptions.map((item) => ({
      value: item.idDistrict,
      label: item.name,
      searchText: item.name,
      raw: item,
    })),
    [districtOptions],
  )

  const resetState = useCallback(() => {
    setStep(STEP_DELIVERY_TYPE)
    setDeliveryOption(null)
    setCustomer(emptyCustomer)
    setDeliveryScope(null)
    setLimaDeliveryType(null)
    setDeliveryType(DELIVERY_TYPES.SHALON)
    setDeliveryForm(emptyDeliveryForm)
    setDraftOrderId(null)
    setGuestToken('')
    setPaymentMode(PAYMENT_MODE_RESERVATION)
    setCustomPaymentAmount('')
    setPaymentRows([createPaymentRow()])
    setRemainderMethodId('')
    setCashPaidWith('')
    setSubmitting(false)
    setReserving(false)
    setCancelling(false)
    setError('')
    setShowCancelConfirm(false)
    setShowProofPolicyModal(false)
    setShowProofPolicyConfirm(false)
    setCalendarPickerOpen(false)
    setScheduledDeliveryDate('')
    setLocationMapTrigger(0)
  }, [])

  useEffect(() => {
    if (!open) return
    resetState()
  }, [open, resetState])

  useEffect(() => {
    if (!scheduledDeliveryDate || availableDeliveryDates.length === 0) return

    const selected = availableDeliveryDates.find((entry) => entry.date === scheduledDeliveryDate)
    if (selected?.blocked) {
      setScheduledDeliveryDate('')
    }
  }, [availableDeliveryDates, scheduledDeliveryDate])

  useEffect(() => {
    if (!open) return
    setPaymentRows((rows) => rebalancePaymentRows(rows, expectedAmount))
  }, [open, expectedAmount, paymentRows.length])

  useEffect(() => {
    setRemainderMethodId('')
    setCashPaidWith('')
    if (paymentMode !== PAYMENT_MODE_CUSTOM) {
      setCustomPaymentAmount('')
    }
  }, [paymentMode])

  useEffect(() => {
    if (!remainderIsCash) {
      setCashPaidWith('')
    }
  }, [remainderIsCash, remainderMethodId])

  useEffect(() => {
    if (!isProvinciaScope || isShalomPickup) {
      setRegionOptions([])
      return undefined
    }

    let ignore = false
    setIsLoadingRegions(true)

    listRegionsPublic({ page: 1, page_size: 100 })
      .then((response) => {
        if (ignore) return
        setRegionOptions((response.data?.items ?? []).map(mapRegionOption))
      })
      .catch(() => {
        if (!ignore) setRegionOptions([])
      })
      .finally(() => {
        if (!ignore) setIsLoadingRegions(false)
      })

    return () => {
      ignore = true
    }
  }, [isProvinciaScope, isShalomPickup])

  useEffect(() => {
    if (!isProvinciaScope || isShalomPickup || !deliveryForm.idRegion) {
      setProvinceOptions([])
      return undefined
    }

    let ignore = false
    setIsLoadingProvinces(true)

    listProvincesPublic({ page: 1, page_size: 100, id_region: deliveryForm.idRegion })
      .then((response) => {
        if (ignore) return
        setProvinceOptions((response.data?.items ?? []).map(mapProvinceOption))
      })
      .catch(() => {
        if (!ignore) setProvinceOptions([])
      })
      .finally(() => {
        if (!ignore) setIsLoadingProvinces(false)
      })

    return () => {
      ignore = true
    }
  }, [isProvinciaScope, isShalomPickup, deliveryForm.idRegion])

  useEffect(() => {
    if (isShalomPickup || !deliveryScope) {
      setDistrictOptions([])
      return undefined
    }

    const shouldLoadDistricts = deliveryOption === DELIVERY_OPTION_BALENZI
      || (deliveryOption === DELIVERY_OPTION_SHALOM && isProvinciaScope)

    if (!shouldLoadDistricts) {
      setDistrictOptions([])
      return undefined
    }

    let ignore = false
    setIsLoadingDistricts(true)

    const request = isProvinciaScope
      ? listDistrictsPublic({ page: 1, page_size: 100, id_province: deliveryForm.idProvince })
      : listDistrictsPublic({ page: 1, page_size: 100, delivery_scope: 'lima' })

    request
      .then((response) => {
        if (ignore) return
        setDistrictOptions((response.data?.items ?? []).map(mapDistrictOption))
      })
      .catch(() => {
        if (!ignore) setDistrictOptions([])
      })
      .finally(() => {
        if (!ignore) setIsLoadingDistricts(false)
      })

    return () => {
      ignore = true
    }
  }, [deliveryScope, isProvinciaScope, isShalomPickup, deliveryForm.idProvince, deliveryOption])

  useEffect(() => {
    if (!isOwnDelivery || deliveryForm.idDistrict || districtOptions.length === 0) return

    const firstDistrict = districtOptions[0]
    setDeliveryForm((prev) => ({
      ...prev,
      idProvince: String(firstDistrict.idProvince),
      idDistrict: String(firstDistrict.idDistrict),
      district: firstDistrict.name,
      city: LIMA_CITY,
      ...getOwnDeliveryPickupFormValues(),
    }))
  }, [isOwnDelivery, districtOptions, deliveryForm.idDistrict])

  useEffect(() => {
    if (!open || !isShalomPickup || !deliveryForm.idDistrict) return

    listShalonsPublic({
      page: 1,
      page_size: 1,
      id_district: deliveryForm.idDistrict,
    }).catch(() => {})
  }, [open, isShalomPickup, deliveryForm.idDistrict])

  useBodyScrollLock(open)

  if (!open) return null

  function handleDeliveryTypeSelect(option) {
    setDeliveryOption(option)
    setDeliveryScope(null)
    setLimaDeliveryType(null)
    setScheduledDeliveryDate('')
    setDeliveryForm(emptyDeliveryForm)

    if (option === DELIVERY_OPTION_SHALOM) {
      setDeliveryType(DELIVERY_TYPES.SHALON)
      setDeliveryScope(null)
      setLimaDeliveryType(null)
      return
    }

    if (option === DELIVERY_OPTION_BALENZI) {
      setDeliveryType(DELIVERY_TYPES.RAINAU)
      setDeliveryScope('lima')
      setLimaDeliveryType('delivery')
      setDeliveryForm({
        ...emptyDeliveryForm,
        city: LIMA_CITY,
      })
      return
    }

    setDeliveryType(DELIVERY_TYPES.OWN)
    setDeliveryScope('lima')
    setLimaDeliveryType('delivery')
    setDeliveryForm({
      ...emptyDeliveryForm,
      city: LIMA_CITY,
      ...getOwnDeliveryPickupFormValues(),
    })
  }

  function handleShalonSelect(value, option) {
    const selected = option?.raw ?? null
    const nextScope = selected
      ? inferDeliveryScopeFromShalonProvince(selected.provinceName)
      : null

    if (nextScope) {
      setDeliveryScope(nextScope)
      setLimaDeliveryType('shalon')
    } else {
      setDeliveryScope(null)
      setLimaDeliveryType(null)
    }

    setDeliveryForm((prev) => ({
      ...prev,
      ...applyShalonSelectionToForm(selected, { deliveryScope: nextScope }),
    }))
  }

  function updateCustomerField(name, value) {
    setCustomer((current) => ({ ...current, [name]: value }))
  }

  function handleRegionSelect(value, option) {
    const selected = option?.raw
      ?? regionOptions.find((item) => String(item.idRegion) === String(value))

    setDeliveryForm((prev) => ({
      ...prev,
      idRegion: selected ? String(selected.idRegion) : '',
      region: selected?.name || '',
      city: '',
      idProvince: '',
      idDistrict: '',
      district: '',
      idShalon: '',
      shalonName: '',
      shalonLat: null,
      shalonLng: null,
      shalon: '',
    }))
  }

  function handleProvinceSelect(value, option) {
    const selected = option?.raw
      ?? provinceOptions.find((item) => String(item.idProvince) === String(value))

    setDeliveryForm((prev) => ({
      ...prev,
      idProvince: selected ? String(selected.idProvince) : '',
      city: selected?.name || '',
      idDistrict: '',
      district: '',
      idShalon: '',
      shalonName: '',
      shalonLat: null,
      shalonLng: null,
      shalon: '',
    }))
  }

  function handleDistrictSelect(value, option) {
    const selected = option?.raw
      ?? districtOptions.find((item) => String(item.idDistrict) === String(value))

    setDeliveryForm((prev) => ({
      ...prev,
      idProvince: selected ? String(selected.idProvince) : prev.idProvince,
      idDistrict: selected ? String(selected.idDistrict) : '',
      district: selected?.name || '',
      idShalon: '',
      shalonName: '',
      shalonLat: null,
      shalonLng: null,
      shalon: '',
      fullAddress: '',
      googleMapsLink: '',
      geoLat: null,
      geoLng: null,
      coverageZone: null,
      deliveryFee: 0,
    }))

    if (selected && isBalenziHomeDelivery) {
      setLocationMapTrigger((current) => current + 1)
    }
  }

  function handleDeliveryLocationChange({
    geoLat,
    geoLng,
    googleMapsLink,
    fullAddress,
    deliveryFee,
    coverageZone,
  }) {
    setDeliveryForm((prev) => ({
      ...prev,
      geoLat,
      geoLng,
      googleMapsLink,
      ...(fullAddress !== undefined ? { fullAddress } : {}),
      ...(deliveryFee !== undefined ? { deliveryFee } : {}),
      ...(coverageZone !== undefined ? { coverageZone } : {}),
    }))
  }

  function updateRow(key, patch) {
    setPaymentRows((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }

  function handlePaymentMethodChange(rowKey, methodId) {
    updateRow(rowKey, { id_payment_method: methodId })
  }

  function updateRowAmount(key, rawAmount) {
    setPaymentRows((rows) => {
      const rowIndex = rows.findIndex((row) => row.key === key)
      if (rowIndex <= 0) return rows

      const updated = rows.map((row) =>
        (row.key === key ? { ...row, amount: rawAmount } : row),
      )

      return rebalancePaymentRows(updated, expectedAmount)
    })
  }

  function addPaymentRow() {
    setPaymentRows((rows) => rebalancePaymentRows([...rows, createPaymentRow()], expectedAmount))
  }

  function removePaymentRow(key) {
    setPaymentRows((rows) => {
      if (rows.length === 1) return rows

      return rebalancePaymentRows(
        rows.filter((row) => row.key !== key),
        expectedAmount,
      )
    })
  }

  function handleFilesChange(key, event) {
    const selected = Array.from(event.target.files || [])
    updateRow(key, { files: selected })
    event.target.value = ''
  }

  function validateDetailsStep() {
    if (!customer.name.trim() || !customer.last_name_paternal.trim()) {
      setError('Completa nombre y apellido paterno.')
      return false
    }

    if (requiresDocumentNumber(deliveryOption) && !customer.document_number.trim()) {
      setError('El DNI es obligatorio para envíos Shalom.')
      return false
    }

    if (!customer.phone.trim()) {
      setError('Ingresa un teléfono válido.')
      return false
    }

    if (deliveryOption === DELIVERY_OPTION_SHALOM) {
      if (!deliveryForm.idShalon) {
        setError('Selecciona una agencia Shalom.')
        return false
      }

      return true
    }

    if (deliveryOption === DELIVERY_OPTION_BALENZI) {
      if (!deliveryForm.idDistrict) {
        setError('Selecciona un distrito.')
        return false
      }
      if (deliveryForm.geoLat == null || deliveryForm.geoLng == null) {
        setError('Indica la ubicación exacta en el mapa.')
        return false
      }
      if (!deliveryForm.fullAddress?.trim()) {
        setError('Escriba su dirección completa.')
        return false
      }
      if (!isSelectableRainauCoverage(resolveRainauCoverage(deliveryForm.geoLat, deliveryForm.geoLng))) {
        setError(RAINAU_COVERAGE_REQUIRED_MESSAGE)
        return false
      }

      return true
    }

    if (deliveryOption === DELIVERY_OPTION_OWN && !deliveryForm.googleMapsLink?.trim()) {
      setError('No se pudo cargar el punto de entrega.')
      return false
    }

    return true
  }

  async function cancelGuestDraft() {
    if (!draftOrderId || !guestToken) return

    const response = await cancelGuestCheckoutReservation(draftOrderId, guestToken)
    if (!response.success) {
      throw new Error(response.message || 'No se pudo cancelar la reserva')
    }

    setDraftOrderId(null)
    setGuestToken('')
  }

  function requestClose() {
    if (submitting || reserving) return
    setShowCancelConfirm(true)
  }

  async function goBack() {
    if (isFirstStep || submitting || reserving) return
    setError('')

    if (step === STEP_PAYMENT && draftOrderId && guestToken) {
      setCancelling(true)
      try {
        await cancelGuestDraft()
      } catch (cancelError) {
        setError(cancelError.message || 'No se pudo cancelar la reserva')
        setCancelling(false)
        return
      }
      setCancelling(false)
    }

    if (step === STEP_DETAILS && draftOrderId && guestToken) {
      setCancelling(true)
      try {
        await cancelGuestDraft()
      } catch (cancelError) {
        setError(cancelError.message || 'No se pudo cancelar la reserva')
        setCancelling(false)
        return
      }
      setCancelling(false)
    }

    setStep(STEPS[stepIndex - 1])
  }

  async function reserveDraftAndContinue() {
    setReserving(true)
    setError('')

    try {
      const response = await reserveGuestCheckout({
        items,
        customer: {
          name: customer.name.trim(),
          last_name_paternal: customer.last_name_paternal.trim(),
          last_name_maternal: customer.last_name_maternal.trim() || null,
          document_number: customer.document_number.trim(),
          phone: customer.phone.trim() || null,
        },
        delivery: buildGuestDeliveryPayload({
          deliveryScope,
          deliveryType,
          deliveryForm,
          scheduledDeliveryDate,
        }),
        discountCode,
      })

      if (!response.success) {
        throw new Error(response.message || 'No se pudo reservar el pedido')
      }

      setDraftOrderId(response.data.order.id_client_order)
      setGuestToken(response.data.guest_token)
      setStep(STEP_DATE)
    } catch (reserveError) {
      setError(reserveError.message || 'No se pudo reservar el pedido')
    } finally {
      setReserving(false)
    }
  }

  async function goNext() {
    setError('')

    if (step === STEP_DELIVERY_TYPE) {
      if (!canContinueFromDeliveryType) {
        setError('Elige un tipo de envío para continuar.')
        return
      }
      setStep(STEP_DETAILS)
      return
    }

    if (step === STEP_DETAILS) {
      if (!validateDetailsStep()) return
      await reserveDraftAndContinue()
      return
    }

    if (step === STEP_DATE) {
      if (!canContinueFromDate) {
        setError(
          requiresOwnDeliveryMeetingDate
            ? 'Selecciona una fecha de encuentro para continuar.'
            : requiresShalomShipDate
              ? 'Selecciona una fecha de envío a Shalom para continuar.'
              : 'Selecciona una fecha de entrega para continuar.',
        )
        return
      }

      setStep(STEP_PAYMENT)
      return
    }

    if (step === STEP_PAYMENT) {
      if (paymentMode === PAYMENT_MODE_CUSTOM && !customPaymentValidation.valid) {
        setError(customPaymentValidation.message || 'Indica un monto personalizado válido.')
        return
      }
      if (!canContinueFromPayment) {
        setError('Completa el método de pago, el monto y adjunta al menos un comprobante.')
        return
      }
      if (guestProofPolicyId && hasAcceptedProofPolicy(guestProofPolicyId)) {
        setStep(STEP_FINAL)
        return
      }
      setShowProofPolicyConfirm(true)
    }
  }

  function handleAcceptProofPolicy() {
    if (guestProofPolicyId) {
      markProofPolicyAccepted(guestProofPolicyId)
    }
    setShowProofPolicyConfirm(false)
    setStep(STEP_FINAL)
  }

  async function confirmCancelReservation() {
    setCancelling(true)
    setError('')

    try {
      if (draftOrderId && guestToken) {
        await cancelGuestDraft()
      }
      setShowCancelConfirm(false)
      onClose()
    } catch (cancelError) {
      setError(cancelError.message || 'No se pudo cancelar la reserva')
    } finally {
      setCancelling(false)
    }
  }

  async function handleSubmit() {
    if (!canSubmit) return

    setSubmitting(true)
    setError('')

    try {
      const payments = paymentRows.map((row) => ({
        id_payment_method: Number(row.id_payment_method),
        amount: Number(row.amount),
      }))

      const paymentProofs = paymentRows.map((row) => row.files)

      const response = await submitGuestCheckout(
        draftOrderId,
        {
          guestToken,
          paymentMode,
          payments,
          paymentProofs,
          balancePaymentMethodId: hasBalanceAfterInitialPayment(paymentMode, balanceDue)
            ? Number(remainderMethodId)
            : undefined,
          cashPaidWith: hasBalanceAfterInitialPayment(paymentMode, balanceDue) && remainderIsCash
            ? roundMoney(cashPaidWithAmount)
            : undefined,
          delivery: {
            scheduled_delivery_date: scheduledDeliveryDate,
            delivery_fee: effectiveDeliveryFee,
            geo_lat: deliveryForm.geoLat,
            geo_lng: deliveryForm.geoLng,
          },
        },
      )

      if (!response.success) {
        throw new Error(response.message || 'No se pudo registrar el pedido')
      }

      saveGuestOrder({
        id_client_order: response.data.id_client_order,
        guest_token: guestToken,
        order_number: response.data.order_number,
        total_amount: response.data.total_amount,
        status: response.data.status,
        display_status: response.data.display_status,
        created_at: response.data.created_at,
      })

      const balancePaymentPreference = selectedRemainderMethod
        ? {
            name: selectedRemainderMethod.name,
            posSurchargeNote: remainderIsPos
              ? `Recargo tarjeta (5%): S/ ${remainderPosSurcharge.toFixed(2)} sobre el saldo restante.`
              : null,
          }
        : null

      await onOrderCreated?.(response.data, { balancePaymentPreference, guestToken })
      onClose()
    } catch (submitError) {
      setError(submitError.message || 'No se pudo registrar el pedido')
    } finally {
      setSubmitting(false)
    }
  }

  function renderOrderSummary() {
    return (
      <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm">
        <div className="flex justify-between text-gray-700">
          <span>Subtotal</span>
          <span>S/ {subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="mt-1 flex justify-between text-gray-700">
            <span>Descuento{discountCode ? ` (${discountCode})` : ''}</span>
            <span>- S/ {discount.toFixed(2)}</span>
          </div>
        )}
        {packagingFee > 0 && (
          <div className="mt-1 flex justify-between text-gray-700">
            <span>Empaquetado</span>
            <span>S/ {packagingFee.toFixed(2)}</span>
          </div>
        )}
        <div className="mt-1 flex items-center justify-between gap-3 text-gray-700">
          <span className="shrink-0">Envío ({deliveryLabel || 'Por definir'})</span>
          <ShippingChargeDisplay
            deliveryFee={effectiveDeliveryFee}
            deliveryMode={deliveryMode}
            className="min-w-0"
          />
        </div>
        <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 font-bold text-gray-900">
          <span>Total estimado</span>
          <span>S/ {orderTotal.toFixed(2)}</span>
        </div>
      </div>
    )
  }

  function renderDeliveryTypeStep() {
    const options = [
      {
        key: DELIVERY_OPTION_SHALOM,
        title: 'Envío Shalom',
        description: 'Recibe tu pedido en una agencia Shalom en Lima o provincia.',
        icon: Truck,
      },
      {
        key: DELIVERY_OPTION_BALENZI,
        title: BALENZI_DELIVERY_LABEL,
        description: 'Te llevamos el pedido a tu domicilio en Lima con cobertura Rainau.',
        icon: ShieldCheck,
      },
      {
        key: DELIVERY_OPTION_OWN,
        title: 'Delivery propio',
        description: 'Envía tu courier o motorizado a recoger el pedido en nuestro punto de entrega.',
        icon: UserRound,
      },
    ]

    return (
      <div className="space-y-4">
        {renderOrderSummary()}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Tipo de envío
          </p>
          <div className="grid gap-3">
            {options.map(({ key, title, description, icon: Icon }) => {
              const isSelected = deliveryOption === key

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleDeliveryTypeSelect(key)}
                  className={`rounded-xl border-2 px-4 py-4 text-left transition ${
                    isSelected
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 hover:border-brand hover:bg-brand-light/40'
                  }`}
                >
                  <span className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-light text-brand">
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="font-semibold text-gray-900">{title}</p>
                  <p className="mt-1 text-xs text-gray-500">{description}</p>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  function renderDetailsStep() {
    const readonlyClass = 'mt-1 w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700'

    return (
      <div className="space-y-4">
        {renderOrderSummary()}

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Tus datos</p>
          <div className="grid gap-3 sm:grid-cols-6">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm text-gray-600">Nombre *</span>
              <input
                value={customer.name}
                onChange={(event) => updateCustomerField('name', event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                autoComplete="given-name"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm text-gray-600">Apellido paterno *</span>
              <input
                value={customer.last_name_paternal}
                onChange={(event) => updateCustomerField('last_name_paternal', event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                autoComplete="family-name"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm text-gray-600">Apellido materno</span>
              <input
                value={customer.last_name_maternal}
                onChange={(event) => updateCustomerField('last_name_maternal', event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
              />
            </label>
            <label className="block sm:col-span-3">
              <span className="mb-1 block text-sm text-gray-600">
                DNI{requiresDocumentNumber(deliveryOption) ? ' *' : ' (opcional)'}
              </span>
              <input
                value={customer.document_number}
                onChange={(event) => updateCustomerField('document_number', event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                inputMode="numeric"
              />
            </label>
            <label className="block sm:col-span-3">
              <span className="mb-1 block text-sm text-gray-600">Teléfono</span>
              <input
                value={customer.phone}
                onChange={(event) => updateCustomerField('phone', event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                autoComplete="tel"
              />
            </label>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Entrega</p>

          {deliveryOption === DELIVERY_OPTION_SHALOM && (
            <div ref={shalonFieldRef}>
              <label className="block text-sm text-gray-600">Agencia Shalom *</label>
              <ShalonSearchCombobox
                value={deliveryForm.idShalon}
                selectedLabel={deliveryForm.shalon}
                onChange={handleShalonSelect}
                onOpenChange={handleShalonComboboxOpenChange}
              />
              {deliveryForm.shalon && (
                <a
                  href={buildShalonMapsUrl({
                    name: deliveryForm.shalonName,
                    district: deliveryForm.district,
                    city: deliveryForm.city,
                    region: deliveryForm.region,
                    shalonLabel: deliveryForm.shalon,
                    geoLat: deliveryForm.shalonLat,
                    geoLng: deliveryForm.shalonLng,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-black hover:bg-gray-50 hover:text-black"
                >
                  <Map className="h-4 w-4 shrink-0" />
                  Ver ubicación Shalom
                </a>
              )}
            </div>
          )}

          {deliveryOption === DELIVERY_OPTION_BALENZI && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-gray-600">Ciudad *</label>
                <input
                  type="text"
                  value={LIMA_CITY}
                  readOnly
                  className={readonlyClass}
                  aria-readonly="true"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Distrito *</label>
                <SearchableCombobox
                  value={deliveryForm.idDistrict}
                  selectedLabel={deliveryForm.district}
                  placeholder="Selecciona un distrito"
                  searchPlaceholder="Escribe para buscar distrito…"
                  options={districtComboboxOptions}
                  isLoading={isLoadingDistricts}
                  disabled={isLoadingDistricts}
                  emptyMessage="No hay distritos disponibles."
                  onChange={handleDistrictSelect}
                />
              </div>
              {deliveryForm.idDistrict && (
                <div className="sm:col-span-2">
                  <DeliveryLocationPicker
                    value={{ lat: deliveryForm.geoLat, lng: deliveryForm.geoLng }}
                    googleMapsLink={deliveryForm.googleMapsLink}
                    fullAddress={deliveryForm.fullAddress}
                    districtName={deliveryForm.district}
                    mapOpenTrigger={locationMapTrigger}
                    onChange={handleDeliveryLocationChange}
                  />
                </div>
              )}
            </div>
          )}

          {deliveryOption === DELIVERY_OPTION_OWN && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-sm font-semibold text-gray-900">Punto de entrega</p>
              <p className="mt-1 text-xs text-gray-500">
                Envía tu courier o motorizado a recoger el pedido en este punto de encuentro.
              </p>
              <a
                href={OWN_DELIVERY_PICKUP_POINT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-black hover:bg-gray-50 hover:text-black"
              >
                <Map className="h-4 w-4 shrink-0" />
                Ver punto de entrega en Google Maps
              </a>
            </div>
          )}
        </div>
      </div>
    )
  }

  function renderDateStep() {
    if (requiresShalomShipDate) {
      return (
        <RainauDeliveryDatePicker
          variant="shalom"
          dates={availableShalomDates}
          value={scheduledDeliveryDate}
          isLoading={shalomDatesLoading}
          error={shalomDatesError}
          sameDayCutoffPassed={shalomSameDayCutoffPassed}
          onChange={setScheduledDeliveryDate}
          onRefreshDates={refreshShalomDates}
          onCalendarOpenChange={setCalendarPickerOpen}
        />
      )
    }

    return (
      <RainauDeliveryDatePicker
        variant={requiresOwnDeliveryMeetingDate ? 'own' : 'balenzi'}
        dates={availableDeliveryDates}
        value={scheduledDeliveryDate}
        isLoading={deliveryDatesLoading}
        error={deliveryDatesError}
        sameDayCutoffPassed={sameDayCutoffPassed}
        onChange={setScheduledDeliveryDate}
        onRefreshDates={refreshDeliveryDates}
        onCalendarOpenChange={setCalendarPickerOpen}
      />
    )
  }

  function renderPaymentStep() {
    return (
      <div className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <label className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs sm:text-sm ${paymentMode === PAYMENT_MODE_RESERVATION ? 'border-black bg-gray-50' : 'border-gray-200'}`}>
            <span className="flex min-w-0 items-center gap-1.5">
              <input
                type="radio"
                name="guest_payment_mode"
                className="h-3.5 w-3.5 shrink-0"
                checked={paymentMode === PAYMENT_MODE_RESERVATION}
                onChange={() => setPaymentMode(PAYMENT_MODE_RESERVATION)}
              />
              <span className="font-semibold text-gray-900">Solo reserva</span>
            </span>
            <span className="shrink-0 font-bold text-gray-900">S/ {reservationAmount.toFixed(2)}</span>
          </label>
          <label className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs sm:text-sm ${paymentMode === PAYMENT_MODE_FULL ? 'border-black bg-gray-50' : 'border-gray-200'}`}>
            <span className="flex min-w-0 items-center gap-1.5">
              <input
                type="radio"
                name="guest_payment_mode"
                className="h-3.5 w-3.5 shrink-0"
                checked={paymentMode === PAYMENT_MODE_FULL}
                onChange={() => setPaymentMode(PAYMENT_MODE_FULL)}
              />
              <span className="font-semibold text-gray-900">Pago completo</span>
            </span>
            <span className="shrink-0 font-bold text-gray-900">S/ {orderTotal.toFixed(2)}</span>
          </label>
          <label className={`flex cursor-pointer flex-col gap-2 rounded-lg border px-3 py-2 text-xs sm:text-sm sm:col-span-2 ${paymentMode === PAYMENT_MODE_CUSTOM ? 'border-black bg-gray-50' : 'border-gray-200'}`}>
            <span className="flex items-center gap-1.5">
              <input
                type="radio"
                name="guest_payment_mode"
                className="h-3.5 w-3.5 shrink-0"
                checked={paymentMode === PAYMENT_MODE_CUSTOM}
                onChange={() => setPaymentMode(PAYMENT_MODE_CUSTOM)}
              />
              <span className="font-semibold text-gray-900">Pago personalizado</span>
            </span>
            {paymentMode === PAYMENT_MODE_CUSTOM && (
              <div>
                <label className="block text-[11px] text-gray-600">
                  Monto a pagar ahora (mayor a S/ {reservationAmount.toFixed(2)}, máx. S/ {orderTotal.toFixed(2)})
                </label>
                <input
                  type="number"
                  min={roundMoney(reservationAmount + 0.1)}
                  max={orderTotal}
                  step="0.1"
                  inputMode="decimal"
                  placeholder="Ej. 250.50"
                  value={customPaymentAmount}
                  onChange={(event) => setCustomPaymentAmount(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-2 text-sm focus:border-black focus:outline-none"
                />
                {!customPaymentValidation.valid && customPaymentAmount.trim() !== '' && (
                  <p className="mt-1 text-[11px] text-red-600">{customPaymentValidation.message}</p>
                )}
              </div>
            )}
          </label>
        </div>

        {hasBalanceAfterInitialPayment(paymentMode, balanceDue) && (
          <p className="text-[11px] leading-snug text-gray-500">{RESERVATION_NOTICE}</p>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-gray-900">Método y comprobante</p>
            {paymentRows.length > 1 && (
              <button
                type="button"
                onClick={addPaymentRow}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-900 hover:underline"
              >
                <Plus className="h-3 w-3" />
                Agregar
              </button>
            )}
          </div>

          <div className="space-y-2">
            {paymentRows.map((row, index) => {
              const selectedMethod = findPaymentMethodById(initialPaymentMethods, row.id_payment_method)

              return (
                <div key={row.key} className="min-w-0 rounded-lg border border-gray-200 p-2.5">
                  {paymentRows.length > 1 && (
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-gray-900">Pago {index + 1}</p>
                      <button
                        type="button"
                        onClick={() => removePaymentRow(row.key)}
                        className="text-gray-500 hover:text-gray-800"
                        aria-label="Eliminar pago"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  <div className={`gap-2 ${paymentRows.length > 1 ? 'grid sm:grid-cols-[1fr_5.5rem]' : ''}`}>
                    <label className="block min-w-0 text-xs">
                      <span className="mb-0.5 block text-gray-600">Método</span>
                      <select
                        value={row.id_payment_method}
                        onChange={(e) => handlePaymentMethodChange(row.key, e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-2.5 py-2 text-sm focus:border-black focus:outline-none"
                      >
                        <option value="">Seleccionar…</option>
                        {initialPaymentMethods.map((method) => (
                          <option key={method.id ?? method.id_payment_method} value={String(method.id ?? method.id_payment_method)}>
                            {method.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    {paymentRows.length > 1 && (
                      <label className="block min-w-0 text-xs">
                        <span className="mb-0.5 block text-gray-600">Monto</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={row.amount}
                          readOnly={index === 0}
                          onChange={(e) => updateRowAmount(row.key, e.target.value)}
                          className={`w-full rounded-lg border border-gray-300 px-2.5 py-2 text-sm focus:border-black focus:outline-none ${
                            index === 0 ? 'cursor-default bg-gray-100 text-gray-700' : ''
                          }`}
                        />
                      </label>
                    )}
                  </div>

                  {paymentRows.length === 1 && expectedAmount > 0 && (
                    <p className="mt-1.5 text-[11px] text-gray-500">
                      Monto a pagar: <span className="font-semibold text-gray-800">S/ {expectedAmount.toFixed(2)}</span>
                    </p>
                  )}

                  <PaymentMethodCheckoutInfo method={selectedMethod} compact />

                  <div className="mt-2 min-w-0">
                    <label className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                      <Upload className="h-3.5 w-3.5" />
                      Adjuntar comprobante
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFilesChange(row.key, e)}
                      />
                    </label>
                    {row.files.length > 0 && (
                      <p className="mt-1 truncate text-[11px] text-gray-600">
                        {row.files.map((file) => file.name).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {paymentRows.length === 1 && (
            <button
              type="button"
              onClick={addPaymentRow}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 hover:underline"
            >
              <Plus className="h-3 w-3" />
              Dividir en más de un método
            </button>
          )}

          <p className="text-[11px] leading-snug text-amber-800">
            {PROOF_WARNING}{' '}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setShowProofPolicyModal(true)
              }}
              className="font-semibold underline hover:text-amber-900"
            >
              Ver términos
            </button>
          </p>

          {!amountMatches && paidTotal > 0 && expectedAmount > 0 && (
            <p className="text-xs text-red-600">
              La suma debe ser S/ {expectedAmount.toFixed(2)} (actual: S/ {paidTotal.toFixed(2)}).
            </p>
          )}
        </div>
      </div>
    )
  }

  function renderFinalStep() {
    if (hasBalanceAfterInitialPayment(paymentMode, balanceDue)) {
      const initialPaymentLabel = paymentMode === PAYMENT_MODE_CUSTOM
        ? 'Pago personalizado'
        : 'Reserva pagada'

      return (
        <div className="space-y-3">
          <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs">
            <div className="flex justify-between gap-2">
              <span className="text-gray-600">{initialPaymentLabel}</span>
              <span className="font-bold text-gray-900">
                S/ {paidTotal.toFixed(2)}
                {paymentRows[0] && (
                  <span className="font-normal text-gray-600">
                    {' '}· {findPaymentMethodById(initialPaymentMethods, paymentRows[0].id_payment_method)?.name || 'Método'}
                  </span>
                )}
              </span>
            </div>
            <div className="mt-1 flex justify-between gap-2 border-t border-gray-200 pt-1">
              <span className="text-gray-600">Saldo pendiente</span>
              <span className="font-bold text-gray-900">S/ {balanceDue.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-gray-900">¿Cómo cancelarás el saldo?</p>

            <div className="grid grid-cols-2 gap-2">
              {remainderPaymentMethods.map((method) => {
                const methodId = String(method.id ?? method.id_payment_method)
                const isSelected = remainderMethodId === methodId
                const isPos = isPosPaymentMethod(method)

                return (
                  <button
                    key={methodId}
                    type="button"
                    onClick={() => setRemainderMethodId(methodId)}
                    className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                      isSelected ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 font-semibold text-gray-900">
                      {isPos && <CreditCard className="h-3.5 w-3.5 shrink-0" />}
                      {method.name}
                    </span>
                    {isPos && (
                      <span className="mt-0.5 block text-[10px] text-gray-500">+5% al pagar</span>
                    )}
                  </button>
                )
              })}
            </div>

            {remainderIsPos && (
              <p className="mt-2 text-[11px] leading-snug text-amber-900">
                Recargo del 5% al pagar el saldo: S/ {remainderPosSurcharge.toFixed(2)} sobre S/ {balanceDue.toFixed(2)}.
              </p>
            )}

            {remainderIsCash && (
              <div className="mt-3 space-y-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-gray-900">Pagar con:</span>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs text-gray-500">
                      S/
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={cashPaidWith}
                      onChange={(event) => setCashPaidWith(event.target.value)}
                      placeholder={balanceDue.toFixed(2)}
                      className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-black"
                      aria-label="Monto con el que pagarás en efectivo"
                    />
                  </div>
                </label>

                {!cashPaidWithValid && (
                  <p className="text-xs text-red-600">
                    El monto a pagar en efectivo debe ser mayor o igual al saldo restante.
                  </p>
                )}

                {cashPaidWithValid && cashChangeAmount > 0 && (
                  <p className="text-[11px] text-gray-600">
                    Vuelto: S/ {cashChangeAmount.toFixed(2)}
                  </p>
                )}
              </div>
            )}

            {selectedRemainderMethod && !remainderIsPos && !remainderIsCash && (
              <div className="mt-2">
                <PaymentMethodCheckoutInfo method={selectedRemainderMethod} compact />
              </div>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        <ul className={`divide-y rounded-lg border border-gray-200 ${PRODUCT_LIST_SCROLL_CLASS}`}>
          {items.map((item) => (
            <li
              key={item.idProductDecant ? `${item.id}-${item.idProductDecant}` : item.id}
              className="flex gap-3 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                <p className="text-[11px] text-gray-500">{item.brand} · Cant. {item.quantity}</p>
              </div>
              <p className="shrink-0 text-sm font-bold text-gray-900">
                S/ {(Number(item.price) * Number(item.quantity)).toFixed(2)}
              </p>
            </li>
          ))}
        </ul>

        <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs space-y-0.5">
          <p className="font-bold text-gray-900">{formatPaymentModeLabel(paymentMode)}</p>
          {scheduledDeliveryDate && (
            <p className="text-gray-700">
              {requiresOwnDeliveryMeetingDate ? 'Encuentro' : 'Entrega'}: {scheduledDeliveryDate}
            </p>
          )}
          <div className="flex justify-between border-t border-gray-200 pt-1 font-bold text-gray-900">
            <span>Total pagado</span>
            <span>S/ {paidTotal.toFixed(2)}</span>
          </div>
        </div>

        <ul className="space-y-1.5 text-xs text-gray-700">
          {paymentRows.map((row, index) => {
            const method = findPaymentMethodById(initialPaymentMethods, row.id_payment_method)
            return (
              <li key={row.key} className="flex justify-between rounded-lg border border-gray-200 px-2.5 py-1.5">
                <span>{method?.name || `Pago ${index + 1}`}</span>
                <span className="font-bold text-gray-900">S/ {Number(row.amount).toFixed(2)}</span>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  function renderStepContent() {
    if (step === STEP_DELIVERY_TYPE) return renderDeliveryTypeStep()
    if (step === STEP_DETAILS) return renderDetailsStep()
    if (step === STEP_DATE) return renderDateStep()
    if (step === STEP_PAYMENT) return renderPaymentStep()
    if (step === STEP_FINAL) return renderFinalStep()
    return null
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-[200] flex items-end justify-center p-0 sm:items-center sm:p-4">
        <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
        <div
          role="dialog"
          aria-labelledby="guest-checkout-title"
          className="relative z-10 flex max-h-[92dvh] w-full min-w-0 max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-xl"
        >
          <div className="flex items-start justify-between gap-3 border-b px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Paso {stepIndex + 1} de {STEPS.length}
              </p>
              <h2 id="guest-checkout-title" className="text-base font-bold text-gray-900 sm:text-lg">
                Comprar como invitado
              </h2>
              <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                {getStepSubtitle(step, paymentMode, {
                  isOwnDelivery: requiresOwnDeliveryMeetingDate,
                  isShalomShipDate: requiresShalomShipDate,
                  balanceDue,
                })}
              </p>
            </div>
            <button
              type="button"
              onClick={requestClose}
              disabled={submitting || reserving}
              className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            ref={modalScrollRef}
            className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-3 sm:px-5 sm:py-4"
            onMouseDown={handleModalScrollMouseDown}
          >
            {renderStepContent()}
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </div>

          <div className="border-t px-4 py-3 sm:px-5 sm:py-4">
            {isLastStep ? (
              <>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-black px-4 py-2.5 text-xs font-bold text-white hover:bg-gray-800 disabled:opacity-50 sm:py-3.5 sm:text-sm"
                >
                  <MessageCircle className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                  {submitting ? 'Registrando pedido…' : 'Enviar por WhatsApp'}
                </button>
                <p className="mt-2 text-center text-[11px] text-gray-500 sm:text-xs">
                  Registramos tu pedido y luego se abre WhatsApp con el resumen.
                </p>
              </>
            ) : (
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                {isFirstStep ? (
                  <button
                    type="button"
                    onClick={requestClose}
                    disabled={submitting || cancelling || reserving}
                    className="rounded-full border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={submitting || reserving}
                    className="inline-flex items-center justify-center gap-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Atrás
                  </button>
                )}
                <button
                  type="button"
                  onClick={goNext}
                  disabled={
                    submitting
                    || reserving
                    || (step === STEP_DELIVERY_TYPE && !canContinueFromDeliveryType)
                    || (step === STEP_DETAILS && !canContinueFromDetails)
                    || (step === STEP_DATE && !canContinueFromDate)
                    || (step === STEP_PAYMENT && !canContinueFromPayment)
                  }
                  className="rounded-full bg-black px-6 py-2.5 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {reserving ? 'Reservando stock…' : 'Continuar'}
                </button>
              </div>
            )}

            {!isLastStep && isFirstStep && (
              <p className="mt-2 text-center text-[11px] text-gray-500 sm:text-xs">
                Al cancelar liberamos el stock reservado de tu pedido.
              </p>
            )}
          </div>
        </div>

        {showCancelConfirm && (
          <CancelCheckoutConfirmModal
            open={showCancelConfirm}
            isProcessing={cancelling}
            error={error}
            onContinue={() => {
              setShowCancelConfirm(false)
              setError('')
            }}
            onConfirmCancel={confirmCancelReservation}
          />
        )}

        <CheckoutProofPolicyModal
          open={showProofPolicyModal}
          onClose={() => setShowProofPolicyModal(false)}
        />

        <CheckoutProofPolicyConfirmModal
          open={showProofPolicyConfirm}
          onAccept={handleAcceptProofPolicy}
          onDecline={() => setShowProofPolicyConfirm(false)}
        />
      </div>
    </>,
    document.body,
  )
}
