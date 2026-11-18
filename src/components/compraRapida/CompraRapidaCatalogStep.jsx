import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { Plus, Search } from 'lucide-react'
import { fetchCatalogProducts, fetchCatalogProductDetail } from '../../api/products'
import Pagination from '../catalog/Pagination'
import { COMPRA_RAPIDA_STEPS, useCompraRapidaStore } from '../../stores/compraRapidaStore'
import CompraRapidaDecantPickerModal from './CompraRapidaDecantPickerModal'
import { useAddToCart } from '../../hooks/useAddToCart'
import { buildCompraRapidaBottleCartProduct, COMPRA_RAPIDA_CART_MODE } from '../../utils/compraRapidaCart'

/** Backend CatalogListProductRequest solo permite 10, 20 o 50 */
const CATALOG_API_PAGE_SIZE = 10
const MOBILE_UI_PAGE_SIZE = 5
const DESKTOP_UI_PAGE_SIZE = 8
const DESKTOP_CATALOG_MEDIA = '(min-width: 768px)'

function readCatalogPageSize() {
  if (typeof window === 'undefined') return MOBILE_UI_PAGE_SIZE
  return window.matchMedia(DESKTOP_CATALOG_MEDIA).matches
    ? DESKTOP_UI_PAGE_SIZE
    : MOBILE_UI_PAGE_SIZE
}

function subscribeCatalogPageSize(onStoreChange) {
  const media = window.matchMedia(DESKTOP_CATALOG_MEDIA)
  media.addEventListener('change', onStoreChange)
  return () => media.removeEventListener('change', onStoreChange)
}

function useCompraRapidaCatalogPageSize() {
  return useSyncExternalStore(
    subscribeCatalogPageSize,
    readCatalogPageSize,
    () => MOBILE_UI_PAGE_SIZE,
  )
}

function catalogApiPageSizeForUi(uiPageSize) {
  return uiPageSize >= DESKTOP_UI_PAGE_SIZE ? 20 : CATALOG_API_PAGE_SIZE
}

function hasCatalogStock(item) {
  return Number(item?.stock) > 0
}

async function fetchSelladosInStockPage({
  catalogFilters,
  uiPage,
  uiPageSize,
  signal,
}) {
  const skip = (uiPage - 1) * uiPageSize
  const stocked = []
  let meta = null
  let apiPage = 1
  const apiPageSize = catalogApiPageSizeForUi(uiPageSize)

  while (stocked.length < skip + uiPageSize) {
    const result = await fetchCatalogProducts({
      filters: catalogFilters,
      page: apiPage,
      pageSize: apiPageSize,
    })

    if (signal?.aborted) return null

    meta = result.meta
    stocked.push(...result.items.filter(hasCatalogStock))

    const lastPage = result.meta?.last_page ?? apiPage
    if (apiPage >= lastPage) break
    apiPage += 1
  }

  return {
    items: stocked.slice(skip, skip + uiPageSize),
    meta,
    stockedTotal: stocked.length,
    catalogExhausted: apiPage >= (meta?.last_page ?? apiPage),
  }
}

function formatCatalogPrice(amount) {
  const value = Number(amount) || 0
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(value)
}

function mapDetailToDecantRow(detail) {
  if (!detail?.decants?.length) return null
  const priced = detail.decants.filter((decant) => decant.price > 0)
  if (priced.length === 0) return null

  const minPrice = Math.min(...priced.map((decant) => decant.price))

  return {
    id: detail.id,
    idBrand: detail.idBrand,
    name: detail.name,
    brand: detail.brand,
    image: detail.decants.find((d) => d.image)?.image || detail.image,
    price: minPrice,
    displayPrice: minPrice,
  }
}

async function buildDecantRowsFromCatalogPage(result) {
  const detailResults = await Promise.all(
    result.items.map((item) => fetchCatalogProductDetail(item.id).catch(() => null)),
  )

  const rows = []
  detailResults.forEach((detail) => {
    const row = mapDetailToDecantRow(detail)
    if (row) rows.push(row)
  })
  return rows
}

function CatalogProductRow({ product, onAdd, addLabel = 'Añadir' }) {
  return (
    <article className="compra-rapida-product-row">
      <div className="compra-rapida-product-row__thumb">
        {product.image ? (
          <img src={product.image} alt="" loading="lazy" />
        ) : (
          <span>—</span>
        )}
      </div>
      <div className="compra-rapida-product-row__info">
        <p className="compra-rapida-product-row__name">{product.name}</p>
        <p className="compra-rapida-product-row__brand">{product.brand || '—'}</p>
        <p className="compra-rapida-product-row__price">
          {formatCatalogPrice(product.displayPrice ?? product.price)}
        </p>
      </div>
      <button
        type="button"
        className="compra-rapida-btn compra-rapida-btn--secondary compra-rapida-product-row__add"
        onClick={(event) => onAdd(product, event)}
      >
        <Plus size={16} aria-hidden />
        {addLabel}
      </button>
    </article>
  )
}

function CatalogProductCard({ product, onAdd, addLabel = 'Añadir' }) {
  return (
    <article className="compra-rapida-product-card">
      <div className="compra-rapida-product-card__thumb">
        {product.image ? (
          <img src={product.image} alt="" loading="lazy" />
        ) : (
          <span>—</span>
        )}
      </div>
      <p className="compra-rapida-product-card__name">{product.name}</p>
      <p className="compra-rapida-product-card__brand">{product.brand}</p>
      <p className="compra-rapida-product-card__price">
        {formatCatalogPrice(product.displayPrice ?? product.price)}
      </p>
      <button
        type="button"
        className="compra-rapida-btn compra-rapida-btn--secondary compra-rapida-product-card__add"
        onClick={(event) => onAdd(product, event)}
      >
        <Plus size={16} aria-hidden />
        {addLabel}
      </button>
    </article>
  )
}

export default function CompraRapidaCatalogStep() {
  const uiPageSize = useCompraRapidaCatalogPageSize()
  const catalogTab = useCompraRapidaStore((state) => state.catalogTab)
  const setCatalogTab = useCompraRapidaStore((state) => state.setCatalogTab)
  const setStep = useCompraRapidaStore((state) => state.setStep)
  const addToCart = useAddToCart(COMPRA_RAPIDA_CART_MODE)

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selladosUiPage, setSelladosUiPage] = useState(1)
  const [decantGlobalPage, setDecantGlobalPage] = useState(1)
  const [decantRowsCache, setDecantRowsCache] = useState([])
  const [decantLoadedThroughApiPage, setDecantLoadedThroughApiPage] = useState(0)
  const [selladosMeta, setSelladosMeta] = useState(null)
  const [selladosStockedTotal, setSelladosStockedTotal] = useState(null)
  const [selladosVisibleItems, setSelladosVisibleItems] = useState([])
  const [decantMeta, setDecantMeta] = useState(null)
  const decantLoadStateRef = useRef({
    rows: [],
    throughPage: 0,
    meta: null,
    filtersKey: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [decantPickerProduct, setDecantPickerProduct] = useState(null)

  const isSellados = catalogTab === 'sellados'
  const searchActive = debouncedSearch.trim().length > 0

  const catalogFilters = useMemo(() => (
    searchActive ? { search: debouncedSearch.trim() } : {}
  ), [debouncedSearch, searchActive])

  function clearProductSearch() {
    setSearchQuery('')
    setDebouncedSearch('')
    setSelladosUiPage(1)
    setDecantGlobalPage(1)
    setSelladosVisibleItems([])
    setDecantRowsCache([])
    setDecantLoadedThroughApiPage(0)
    setSelladosStockedTotal(null)
    setSelladosMeta(null)
    setDecantMeta(null)
    setError('')
    decantLoadStateRef.current = {
      rows: [],
      throughPage: 0,
      meta: null,
      filtersKey: catalogFiltersKey,
    }
  }

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => window.clearTimeout(handle)
  }, [searchQuery])

  const catalogFiltersKey = useMemo(
    () => JSON.stringify(catalogFilters),
    [catalogFilters],
  )

  useEffect(() => {
    setSelladosUiPage(1)
    setDecantGlobalPage(1)
    setDecantRowsCache([])
    setDecantLoadedThroughApiPage(0)
    setDecantMeta(null)
    setSelladosStockedTotal(null)
    decantLoadStateRef.current = {
      rows: [],
      throughPage: 0,
      meta: null,
      filtersKey: catalogFiltersKey,
    }
  }, [catalogTab, debouncedSearch, catalogFiltersKey, uiPageSize])

  useEffect(() => {
    if (!isSellados) return undefined

    if (!searchActive) {
      setSelladosVisibleItems([])
      setSelladosMeta(null)
      setSelladosStockedTotal(null)
      setIsLoading(false)
      setError('')
      return undefined
    }

    const controller = new AbortController()
    setIsLoading(true)
    setError('')

    ;(async () => {
      try {
        const result = await fetchSelladosInStockPage({
          catalogFilters,
          uiPage: selladosUiPage,
          uiPageSize,
          signal: controller.signal,
        })
        if (controller.signal.aborted || result == null) return

        setSelladosVisibleItems(result.items)
        setSelladosMeta(result.meta)
        if (result.catalogExhausted) {
          setSelladosStockedTotal(result.stockedTotal)
        } else {
          setSelladosStockedTotal(null)
        }
      } catch {
        if (!controller.signal.aborted) {
          setError('No se pudieron cargar los productos.')
          setSelladosVisibleItems([])
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    })()

    return () => {
      controller.abort()
    }
  }, [isSellados, selladosUiPage, catalogFilters, uiPageSize, searchActive])

  useEffect(() => {
    if (isSellados) return undefined

    if (!searchActive) {
      setDecantRowsCache([])
      setDecantLoadedThroughApiPage(0)
      setDecantMeta(null)
      setIsLoading(false)
      setError('')
      decantLoadStateRef.current = {
        rows: [],
        throughPage: 0,
        meta: null,
        filtersKey: catalogFiltersKey,
      }
      return undefined
    }

    let ignore = false
    const rowsNeeded = decantGlobalPage * uiPageSize

    async function loadDecantsForGlobalPage() {
      const stored = decantLoadStateRef.current
      if (stored.filtersKey !== catalogFiltersKey) {
        stored.rows = []
        stored.throughPage = 0
        stored.meta = null
        stored.filtersKey = catalogFiltersKey
      }

      if (stored.rows.length >= rowsNeeded) {
        setDecantRowsCache(stored.rows)
        setDecantLoadedThroughApiPage(stored.throughPage)
        setDecantMeta(stored.meta)
        return
      }

      const lastCatalogPage = stored.meta?.last_page ?? null
      if (lastCatalogPage != null && stored.throughPage >= lastCatalogPage) {
        setDecantRowsCache(stored.rows)
        setDecantLoadedThroughApiPage(stored.throughPage)
        setDecantMeta(stored.meta)
        return
      }

      setIsLoading(true)
      setError('')

      try {
        let cache = [...stored.rows]
        let throughPage = stored.throughPage
        let meta = stored.meta
        let nextApiPage = throughPage + 1

        while (cache.length < rowsNeeded) {
          if (meta?.last_page != null && nextApiPage > meta.last_page) break

          const result = await fetchCatalogProducts({
            filters: catalogFilters,
            page: nextApiPage,
            pageSize: catalogApiPageSizeForUi(uiPageSize),
          })
          if (ignore) return

          meta = result.meta
          const rows = await buildDecantRowsFromCatalogPage(result)
          if (ignore) return

          cache = [...cache, ...rows]
          throughPage = nextApiPage
          nextApiPage += 1

          if (throughPage >= (result.meta?.last_page ?? throughPage)) break
        }

        decantLoadStateRef.current = {
          rows: cache,
          throughPage,
          meta,
          filtersKey: catalogFiltersKey,
        }
        setDecantRowsCache(cache)
        setDecantLoadedThroughApiPage(throughPage)
        setDecantMeta(meta)
      } catch {
        if (!ignore) {
          setError('No se pudieron cargar los decants.')
        }
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }

    void loadDecantsForGlobalPage()

    return () => {
      ignore = true
    }
  }, [isSellados, decantGlobalPage, catalogFilters, catalogFiltersKey, uiPageSize, searchActive])

  const decantHasMoreCatalogPages = (decantMeta?.last_page ?? 1) > decantLoadedThroughApiPage
  const decantFilledPages = Math.max(1, Math.ceil(decantRowsCache.length / uiPageSize))

  const selladosTotalPages = useMemo(() => {
    if (selladosStockedTotal != null && selladosStockedTotal > 0) {
      return Math.max(1, Math.ceil(selladosStockedTotal / uiPageSize))
    }

    const total = selladosMeta?.total
    if (total != null && Number(total) > 0) {
      return Math.max(1, Math.ceil(Number(total) / uiPageSize))
    }

    const lastApiPage = selladosMeta?.last_page ?? 1
    const apiPageSize = catalogApiPageSizeForUi(uiPageSize)
    return Math.max(1, Math.ceil((lastApiPage * apiPageSize) / uiPageSize))
  }, [selladosMeta, selladosStockedTotal, uiPageSize])

  const visibleItems = useMemo(() => {
    if (isSellados) return selladosVisibleItems

    const start = (decantGlobalPage - 1) * uiPageSize
    return decantRowsCache.slice(start, start + uiPageSize)
  }, [isSellados, selladosVisibleItems, decantRowsCache, decantGlobalPage, uiPageSize])

  const decantTotalPages = useMemo(() => {
    if (decantHasMoreCatalogPages) {
      return Math.max(decantFilledPages, decantGlobalPage) + 1
    }
    return Math.max(1, decantFilledPages)
  }, [decantFilledPages, decantGlobalPage, decantHasMoreCatalogPages])

  const pagination = isSellados
    ? {
      currentPage: selladosUiPage,
      totalPages: selladosTotalPages,
      onPageChange: setSelladosUiPage,
    }
    : {
      currentPage: decantGlobalPage,
      totalPages: decantTotalPages,
      onPageChange: setDecantGlobalPage,
    }

  function handleAddBottle(product, event) {
    addToCart(buildCompraRapidaBottleCartProduct(product), event)
    clearProductSearch()
  }

  function handleDecantAdded() {
    clearProductSearch()
  }

  function handleAdd(product, event) {
    if (isSellados) {
      handleAddBottle(product, event)
      return
    }
    setDecantPickerProduct(product)
  }

  return (
    <section className="compra-rapida-catalog">
      <header className="compra-rapida-catalog__header">
        <div>
          <h1 className="compra-rapida-catalog__title">Elige tus productos</h1>
          <button
            type="button"
            className="compra-rapida-link-btn"
            onClick={() => setStep(COMPRA_RAPIDA_STEPS.SETUP)}
          >
            Editar datos de entrega
          </button>
        </div>
        <div className="compra-rapida-catalog__tabs" role="tablist" aria-label="Tipo de producto">
          <button
            type="button"
            role="tab"
            aria-selected={isSellados}
            className={`compra-rapida-tab${isSellados ? ' compra-rapida-tab--active' : ''}`}
            onClick={() => setCatalogTab('sellados')}
          >
            Sellados
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isSellados}
            className={`compra-rapida-tab${!isSellados ? ' compra-rapida-tab--active' : ''}`}
            onClick={() => setCatalogTab('decants')}
          >
            Decants
          </button>
        </div>
      </header>

      <label className="compra-rapida-search">
        <Search size={18} aria-hidden className="compra-rapida-search__icon" />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Buscar por nombre"
          autoComplete="off"
          enterKeyHint="search"
        />
      </label>

      {error ? <p className="compra-rapida-error" role="alert">{error}</p> : null}
      {isLoading ? <p className="compra-rapida-muted">Cargando productos…</p> : null}

      {!isLoading && !searchActive ? (
        <p className="compra-rapida-muted compra-rapida-catalog__hint">
          Escribe el nombre del producto en el buscador. Mostramos coincidencias mientras escribes.
        </p>
      ) : null}

      {!isLoading && searchActive && visibleItems.length === 0 ? (
        <p className="compra-rapida-muted">No encontramos productos con ese nombre.</p>
      ) : null}

      {searchActive && visibleItems.length > 0 ? (
        <>
          <div className="compra-rapida-catalog__list md:hidden">
            {visibleItems.map((product) => (
              <CatalogProductRow
                key={product.id}
                product={product}
                onAdd={handleAdd}
                addLabel={isSellados ? 'Añadir' : 'Elegir'}
              />
            ))}
          </div>

          <div className="compra-rapida-catalog__grid hidden md:grid">
            {visibleItems.map((product) => (
              <CatalogProductCard
                key={product.id}
                product={product}
                onAdd={handleAdd}
                addLabel={isSellados ? 'Añadir' : 'Elegir'}
              />
            ))}
          </div>
        </>
      ) : null}

      {!isLoading && searchActive && visibleItems.length > 0 && pagination.totalPages > 1 ? (
        <div className="compra-rapida-catalog__pagination">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.onPageChange}
          />
        </div>
      ) : null}

      {decantPickerProduct ? (
        <CompraRapidaDecantPickerModal
          product={decantPickerProduct}
          onClose={() => setDecantPickerProduct(null)}
          onAdded={handleDecantAdded}
        />
      ) : null}
    </section>
  )
}