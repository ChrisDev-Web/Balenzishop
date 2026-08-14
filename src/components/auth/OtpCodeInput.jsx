import { useEffect, useRef } from 'react'

export default function OtpCodeInput({
  value,
  onChange,
  length = 4,
  disabled = false,
  hasError = false,
  autoFocus = false,
}) {
  const inputsRef = useRef([])

  const digits = Array.from({ length }, (_, index) => value[index] ?? '')

  useEffect(() => {
    if (autoFocus) {
      inputsRef.current[0]?.focus()
    }
  }, [autoFocus])

  const focusInput = (index) => {
    inputsRef.current[index]?.focus()
    inputsRef.current[index]?.select()
  }

  const emitValue = (nextDigits) => {
    onChange(nextDigits.join('').slice(0, length))
  }

  const handleChange = (index, rawValue) => {
    const sanitized = rawValue.replace(/\D/g, '')

    if (!sanitized) {
      const nextDigits = [...digits]
      nextDigits[index] = ''
      emitValue(nextDigits)
      return
    }

    const nextDigits = [...digits]

    if (sanitized.length > 1) {
      sanitized.split('').forEach((digit, offset) => {
        const targetIndex = index + offset
        if (targetIndex < length) {
          nextDigits[targetIndex] = digit
        }
      })
      emitValue(nextDigits)
      const nextFocusIndex = Math.min(index + sanitized.length, length - 1)
      focusInput(nextFocusIndex)
      return
    }

    nextDigits[index] = sanitized[0]
    emitValue(nextDigits)

    if (index < length - 1) {
      focusInput(index + 1)
    }
  }

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      event.preventDefault()
      const nextDigits = [...digits]
      nextDigits[index - 1] = ''
      emitValue(nextDigits)
      focusInput(index - 1)
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      focusInput(index - 1)
    }

    if (event.key === 'ArrowRight' && index < length - 1) {
      event.preventDefault()
      focusInput(index + 1)
    }
  }

  const handlePaste = (event) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return

    const nextDigits = Array.from({ length }, (_, index) => pasted[index] ?? '')
    emitValue(nextDigits)

    const nextFocusIndex = Math.min(pasted.length, length) - 1
    if (nextFocusIndex >= 0) {
      focusInput(nextFocusIndex)
    }
  }

  return (
    <div className="flex items-center justify-center gap-2.5 sm:gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputsRef.current[index] = element
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`Dígito ${index + 1} del código`}
          aria-invalid={hasError}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.target.select()}
          className={`h-14 w-12 rounded-xl border bg-[#f7f7f8] text-center text-2xl font-semibold text-gray-900 outline-none transition sm:h-16 sm:w-14 ${
            hasError
              ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
              : 'border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-200'
          } disabled:opacity-60`}
        />
      ))}
    </div>
  )
}
