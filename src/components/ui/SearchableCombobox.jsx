import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { matchesSearchPrefix } from '../../utils/searchText'

function getOptionSearchText(option) {
  return option.searchText ?? option.label ?? ''
}

export default function SearchableCombobox({
  value,
  selectedLabel = '',
  placeholder = 'Seleccionar…',
  searchPlaceholder = 'Escribe para buscar…',
  options = [],
  isLoading = false,
  disabled = false,
  emptyMessage = 'No hay opciones disponibles.',
  onChange,
}) {
  const listboxId = useId()
  const rootRef = useRef(null)
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const normalizedValue = value == null || value === '' ? '' : String(value)
  const hasSelection = normalizedValue !== ''
  const trimmedQuery = query.trim()

  const filteredOptions = useMemo(() => {
    if (!trimmedQuery) return options
    return options.filter((option) =>
      matchesSearchPrefix(getOptionSearchText(option), trimmedQuery),
    )
  }, [options, trimmedQuery])

  const displayValue = isOpen || !hasSelection ? query : selectedLabel

  useEffect(() => {
    if (!isOpen) return undefined

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false)
        setQuery('')
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [isOpen])

  function openForSearch(initialText = '') {
    setIsOpen(true)
    setQuery(initialText)
    requestAnimationFrame(() => {
      const input = inputRef.current
      if (!input) return
      input.focus()
      const length = input.value.length
      input.setSelectionRange(length, length)
    })
  }

  function handleInputChange(event) {
    const nextQuery = event.target.value
    setQuery(nextQuery)
    setIsOpen(true)
    if (hasSelection) {
      onChange('')
    }
  }

  function handleSelect(option) {
    onChange(String(option.value), option)
    setQuery('')
    setIsOpen(false)
  }

  function handleClear(event) {
    event.preventDefault()
    event.stopPropagation()
    setQuery('')
    setIsOpen(false)
    onChange('')
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  function handleFocus() {
    if (hasSelection) {
      const selectedOption = options.find((option) => String(option.value) === normalizedValue)
      openForSearch(selectedOption?.searchText ?? selectedLabel)
      onChange('')
      return
    }

    setIsOpen(true)
  }

  const showEmptyState = !isLoading && trimmedQuery.length > 0 && filteredOptions.length === 0

  return (
    <div className={`relative${isOpen ? ' z-20' : ''}`} ref={rootRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 pr-16 text-sm focus:border-gray-900 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
          value={displayValue}
          placeholder={isOpen ? searchPlaceholder : placeholder}
          onChange={handleInputChange}
          onFocus={handleFocus}
          disabled={disabled}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />

        <div className="pointer-events-none absolute inset-y-0 right-0 mt-1 flex items-center gap-1 pr-2 text-gray-400">
          {hasSelection && !isOpen ? (
            <button
              type="button"
              className="pointer-events-auto rounded p-1 hover:bg-gray-100 hover:text-gray-700"
              onClick={handleClear}
              disabled={disabled}
              aria-label="Limpiar selección"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>

      {isOpen ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {isLoading ? (
            <li className="px-3 py-2 text-sm text-gray-500">Cargando…</li>
          ) : null}

          {showEmptyState ? (
            <li className="px-3 py-2 text-sm text-gray-500">{emptyMessage}</li>
          ) : null}

          {!isLoading
            ? filteredOptions.map((option) => (
                <li key={String(option.value)}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={String(option.value) === normalizedValue}
                    className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                      String(option.value) === normalizedValue ? 'bg-gray-100 font-medium' : 'text-gray-900'
                    }`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelect(option)}
                  >
                    {option.label}
                  </button>
                </li>
              ))
            : null}
        </ul>
      ) : null}
    </div>
  )
}
