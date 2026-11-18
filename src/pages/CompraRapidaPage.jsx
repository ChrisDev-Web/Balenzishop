import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GuestCheckoutModal from '../components/checkout/GuestCheckoutModal'
import CompraRapidaSetupStep from '../components/compraRapida/CompraRapidaSetupStep'
import CompraRapidaCatalogStep from '../components/compraRapida/CompraRapidaCatalogStep'
import { useCartStore } from '../stores/cartStore'
import { useCartTotals } from '../hooks/useCartTotals'
import { CART_MODES } from '../utils/shoppingMode'
import CompraRapidaSummaryStep from '../components/compraRapida/CompraRapidaSummaryStep'
import CompraRapidaCartBar from '../components/compraRapida/CompraRapidaCartBar'
import { fetchActivePaymentMethods } from '../api/paymentMethods'
import {
  COMPRA_RAPIDA_STEPS,
  useCompraRapidaStore,
} from '../stores/compraRapidaStore'
import {
  buildCompraRapidaCheckoutPreset,
  mapCompraRapidaItemsToGuestCart,
} from '../utils/compraRapidaCheckout'
import '../styles/compra-rapida.css'

const VALID_COMPRA_RAPIDA_STEPS = new Set(Object.values(COMPRA_RAPIDA_STEPS))

export default function CompraRapidaPage() {
  const navigate = useNavigate()
  const step = useCompraRapidaStore((state) => state.step)
  const setupSaved = useCompraRapidaStore((state) => state.setupSaved)
  const cartItems = useCartStore((state) => state.minoristaItems)
  const { subtotal: cartSubtotalAfterPromo } = useCartTotals(CART_MODES.MINORISTA)
  const deliveryChannel = useCompraRapidaStore((state) => state.deliveryChannel)
  const customer = useCompraRapidaStore((state) => state.customer)
  const deliveryForm = useCompraRapidaStore((state) => state.deliveryForm)
  const deliveryScope = useCompraRapidaStore((state) => state.deliveryScope)
  const resetFlow = useCompraRapidaStore((state) => state.resetFlow)
  const setStep = useCompraRapidaStore((state) => state.setStep)

  const [paymentMethods, setPaymentMethods] = useState([])
  const orderJustCompletedRef = useRef(false)

  useEffect(() => {
    fetchActivePaymentMethods()
      .then((methods) => setPaymentMethods(methods ?? []))
      .catch(() => setPaymentMethods([]))
  }, [])

  const activeStep = VALID_COMPRA_RAPIDA_STEPS.has(step) ? step : COMPRA_RAPIDA_STEPS.SETUP

  useEffect(() => {
    if (!VALID_COMPRA_RAPIDA_STEPS.has(step)) {
      setStep(COMPRA_RAPIDA_STEPS.SETUP)
      return
    }
    if (step === COMPRA_RAPIDA_STEPS.CATALOG && !setupSaved) {
      setStep(COMPRA_RAPIDA_STEPS.SETUP)
    }
    if (step === COMPRA_RAPIDA_STEPS.SUMMARY && cartItems.length === 0) {
      setStep(COMPRA_RAPIDA_STEPS.CATALOG)
    }
  }, [step, setupSaved, cartItems.length, setStep])

  const guestItems = useMemo(
    () => mapCompraRapidaItemsToGuestCart(cartItems),
    [cartItems],
  )

  const compraRapidaPreset = useMemo(() => {
    if (!setupSaved || !deliveryChannel) return null
    return buildCompraRapidaCheckoutPreset({
      deliveryChannel,
      deliveryScope,
      customer,
      deliveryForm,
    })
  }, [setupSaved, deliveryChannel, deliveryScope, customer, deliveryForm])

  function handleOrderCreated() {
    orderJustCompletedRef.current = true
    useCartStore.getState().clearCart(CART_MODES.MINORISTA)

    const { setupSaved, setStep: goToStep } = useCompraRapidaStore.getState()
    if (setupSaved) {
      goToStep(COMPRA_RAPIDA_STEPS.CATALOG)
    } else {
      resetFlow()
    }

    navigate('/compra-rapida', { replace: true })
  }

  function handleCheckoutClose() {
    if (orderJustCompletedRef.current) {
      orderJustCompletedRef.current = false
      return
    }
    setStep(COMPRA_RAPIDA_STEPS.SUMMARY)
  }

  return (
    <div className={`compra-rapida-page compra-rapida-page--${activeStep}`}>
      {activeStep === COMPRA_RAPIDA_STEPS.SETUP ? <CompraRapidaSetupStep /> : null}
      {activeStep === COMPRA_RAPIDA_STEPS.CATALOG ? (
        <div className="compra-rapida-catalog-layout">
          <CompraRapidaCatalogStep />
          <CompraRapidaCartBar />
        </div>
      ) : null}
      {activeStep === COMPRA_RAPIDA_STEPS.SUMMARY
      || activeStep === COMPRA_RAPIDA_STEPS.CHECKOUT ? (
        <CompraRapidaSummaryStep />
      ) : null}

      <GuestCheckoutModal
        open={activeStep === COMPRA_RAPIDA_STEPS.CHECKOUT}
        onClose={handleCheckoutClose}
        onOrderCreated={handleOrderCreated}
        items={guestItems}
        subtotal={cartSubtotalAfterPromo}
        discount={0}
        discountCode=""
        packagingFee={0}
        paymentMethods={paymentMethods}
        compraRapidaPreset={compraRapidaPreset}
        compraRapidaLink
      />
    </div>
  )
}