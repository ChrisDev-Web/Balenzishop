import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ShoppingCart, ChevronDown, Package, User, MapPin, LogIn, LogOut, Menu, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useCartStore } from '../../stores/cartStore'
import LoginModal from '../auth/LoginModal'
import CartDropdown from '../cart/CartDropdown'
import { useUiStore } from '../../stores/uiStore'
import { AUTH_INTENT } from '../../utils/authFlow'

const navLinks = [
  { to: '/', label: 'Inicio' },
  { to: '/mujeres', label: 'Mujeres' },
  { to: '/hombres', label: 'Hombres' },
  { to: '/promociones', label: 'Promociones' },
  { to: '/catalogo', label: 'Catálogo' },
]

const navLinkClass = (isActive) =>
  `navbar-text font-nav px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-opacity lg:px-4 lg:text-xs ${
    isActive ? 'opacity-100' : 'opacity-90 hover:opacity-100'
  }`

const sidebarLinkClass = (isActive) =>
  `font-nav block border-b border-gray-100 px-5 py-4 text-sm font-semibold uppercase tracking-[0.16em] transition-colors ${
    isActive ? 'bg-gray-100 text-black' : 'text-gray-800 hover:bg-gray-50'
  }`

function AccountMenu({ accountOpen, setAccountOpen, accountRef, isAuthenticated, openLoginModal, logout, displayName }) {
  const navigate = useNavigate()

  const goTo = (path) => (e) => {
    e.preventDefault()
    setAccountOpen(false)
    navigate(path)
  }

  const toggleAccount = (e) => {
    e.stopPropagation()
    setAccountOpen((open) => !open)
  }

  return (
    <div className="relative z-20" ref={accountRef}>
      <button
        type="button"
        onClick={toggleAccount}
        className="navbar-text flex touch-manipulation items-center gap-1 rounded-full p-2 text-sm font-medium text-white hover:bg-white/10 min-[400px]:gap-1.5 min-[400px]:px-2 min-[400px]:py-1"
        aria-label="Mi cuenta"
        aria-expanded={accountOpen}
      >
        <User className="navbar-icon h-5 w-5 min-[400px]:h-6 min-[400px]:w-6" />
        <span className="hidden max-w-[80px] truncate lg:inline">{displayName}</span>
        <ChevronDown className={`navbar-icon hidden h-4 w-4 transition-transform min-[400px]:block ${accountOpen ? 'rotate-180' : ''}`} />
      </button>

      {accountOpen && (
        <div className="absolute right-0 z-[120] mt-2 w-52 overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-black/5">
          {!isAuthenticated ? (
            <>
              <button
                type="button"
                onClick={() => { openLoginModal(AUTH_INTENT.ONBOARDING); setAccountOpen(false) }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                <LogIn className="h-4 w-4 text-gray-700" />
                Iniciar sesión
              </button>
              <Link
                to="/mi-cuenta/pedidos"
                onClick={goTo('/mi-cuenta/pedidos')}
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Package className="h-4 w-4 text-gray-500" />
                Mis pedidos
              </Link>
              <Link
                to="/mi-cuenta/direcciones"
                onClick={goTo('/mi-cuenta/direcciones')}
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
              >
                <MapPin className="h-4 w-4 text-gray-500" />
                Direcciones
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/mi-cuenta"
                onClick={goTo('/mi-cuenta')}
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
              >
                <User className="h-4 w-4 text-gray-700" />
                Mi cuenta
              </Link>
              <Link
                to="/mi-cuenta/pedidos"
                onClick={goTo('/mi-cuenta/pedidos')}
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Package className="h-4 w-4 text-gray-500" />
                Mis pedidos
              </Link>
              <Link
                to="/mi-cuenta/direcciones"
                onClick={goTo('/mi-cuenta/direcciones')}
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
              >
                <MapPin className="h-4 w-4 text-gray-500" />
                Direcciones
              </Link>
              <hr className="border-gray-100" />
              <button
                type="button"
                onClick={() => { logout(); setAccountOpen(false) }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function CartButton({ count, isOpen, toggleCart, closeCart }) {
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={toggleCart}
        className="navbar-icon relative rounded-full p-1.5 text-white hover:bg-white/10 min-[400px]:p-2"
        aria-label="Carrito de compras"
        aria-expanded={isOpen}
      >
        <ShoppingCart className="h-5 w-5 min-[400px]:h-6 min-[400px]:w-6" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
            {count}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="hidden sm:block">
          <CartDropdown onClose={closeCart} variant="anchored" />
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const [accountOpen, setAccountOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const mobileAccountRef = useRef(null)
  const desktopAccountRef = useRef(null)
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuthStore()
  const { totalItems, isOpen, toggleCart, closeCart } = useCartStore()
  const { loginModalOpen, openLoginModal, closeLoginModal } = useUiStore()
  const count = totalItems()

  useEffect(() => {
    if (!accountOpen) return undefined

    const handler = (e) => {
      const inMobile = mobileAccountRef.current?.contains(e.target)
      const inDesktop = desktopAccountRef.current?.contains(e.target)
      if (!inMobile && !inDesktop) {
        setAccountOpen(false)
      }
    }

    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [accountOpen])

  useEffect(() => {
    if (!sidebarOpen) return undefined

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setSidebarOpen(false)
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [sidebarOpen])

  const displayName = user?.firstName || user?.email?.split('@')[0] || 'Usuario'

  const openSidebar = () => {
    setAccountOpen(false)
    setSidebarOpen(true)
  }

  const { pathname } = useLocation()
  const immersiveNav =
    pathname === '/' ||
    pathname === '/mujeres' ||
    pathname === '/hombres' ||
    pathname === '/promociones'

  useEffect(() => {
    setAccountOpen(false)
    setSidebarOpen(false)
    document.body.style.overflow = ''
  }, [pathname])

  const goToPedidos = (e) => {
    e.preventDefault()
    setAccountOpen(false)
    setSidebarOpen(false)
    navigate('/mi-cuenta/pedidos')
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-[100] w-full ${immersiveNav ? 'navbar-glass-immersive' : 'navbar-glass'}`}
      >
        {/* Mobile bar */}
        <div className="relative flex h-14 items-center justify-between px-3 min-[400px]:h-16 min-[400px]:px-4 md:hidden">
          <div className="relative z-20 flex items-center gap-1">
            <button
              type="button"
              onClick={openSidebar}
              className="navbar-icon rounded-full p-2 text-white hover:bg-white/10"
              aria-label="Abrir menú"
              aria-expanded={sidebarOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link
              to="/mi-cuenta/pedidos"
              onClick={goToPedidos}
              className="navbar-icon rounded-full p-2 text-white hover:bg-white/10"
              aria-label="Mis pedidos"
            >
              <Package className="h-5 w-5" />
            </Link>
          </div>

          <Link
            to="/"
            className="pointer-events-auto absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
          >
            <img
              src="/Logo/Balenzi - Logo.png"
              alt="BalenziShop"
              className="navbar-logo h-10 w-auto object-contain min-[400px]:h-12"
            />
          </Link>

          <div className="relative z-20 flex items-center gap-1">
            <AccountMenu
              accountOpen={accountOpen}
              setAccountOpen={setAccountOpen}
              accountRef={mobileAccountRef}
              isAuthenticated={isAuthenticated}
              openLoginModal={openLoginModal}
              logout={logout}
              displayName={displayName}
            />
            <CartButton count={count} isOpen={isOpen} toggleCart={toggleCart} closeCart={closeCart} />
          </div>
        </div>

        {/* Desktop bar */}
        <div className="hidden h-16 w-full items-center justify-between gap-4 pl-8 pr-6 md:flex">
          <Link to="/" className="shrink-0">
            <img
              src="/Logo/Balenzi - Logo.png"
              alt="BalenziShop"
              className="navbar-logo h-14 w-auto object-contain"
            />
          </Link>

          <nav className="flex items-center gap-2 lg:gap-4">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => navLinkClass(isActive)}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2 lg:gap-4">
            <Link
              to="/mi-cuenta/pedidos"
              className="navbar-text flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-medium text-white hover:bg-white/10"
            >
              <Package className="navbar-icon h-5 w-5" />
              <span className="hidden sm:inline">Mis pedidos</span>
            </Link>

            <AccountMenu
              accountOpen={accountOpen}
              setAccountOpen={setAccountOpen}
              accountRef={desktopAccountRef}
              isAuthenticated={isAuthenticated}
              openLoginModal={openLoginModal}
              logout={logout}
              displayName={displayName}
            />

            <CartButton count={count} isOpen={isOpen} toggleCart={toggleCart} closeCart={closeCart} />
          </div>
        </div>
      </header>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="fixed inset-y-0 left-0 z-[70] flex w-[min(85vw,300px)] flex-col bg-white shadow-2xl md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <span className="font-nav text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                Menú
              </span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-2">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => sidebarLinkClass(isActive)}
                >
                  {link.label}
                </NavLink>
              ))}

              <div className="mt-4 border-t border-gray-200 pt-2">
                <NavLink
                  to="/mi-cuenta"
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => sidebarLinkClass(isActive)}
                >
                  Mi cuenta
                </NavLink>
                <NavLink
                  to="/mi-cuenta/pedidos"
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => sidebarLinkClass(isActive)}
                >
                  Mis pedidos
                </NavLink>
              </div>
            </nav>
          </aside>
        </>
      )}

      <div className="navbar-spacer" aria-hidden="true" />

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={closeCart} aria-hidden="true" />
          <div className="sm:hidden">
            <CartDropdown onClose={closeCart} variant="mobile" />
          </div>
        </>
      )}

      <LoginModal isOpen={loginModalOpen} onClose={closeLoginModal} />
    </>
  )
}
