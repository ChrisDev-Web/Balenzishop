import { useState, useEffect } from 'react'

const BREAKPOINTS = {
  desktop: 1280,
  tablet: 768,
}

/** 2×4 en móvil, 3×4 en tablet, 5×4 en desktop */
export function useCatalogPerPage() {
  const [perPage, setPerPage] = useState(8)

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      if (w >= BREAKPOINTS.desktop) setPerPage(20)
      else if (w >= BREAKPOINTS.tablet) setPerPage(12)
      else setPerPage(8)
    }

    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return perPage
}

export const CATALOG_ROWS = 4

export const CATALOG_GRID_CLASS = 'grid-cols-2 md:grid-cols-3 xl:grid-cols-5'
