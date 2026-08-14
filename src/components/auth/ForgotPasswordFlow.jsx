import { useEffect, useMemo, useState } from 'react'
import PasswordInput from '../ui/PasswordInput'
import OtpCodeInput from './OtpCodeInput'

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base md:text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900'

const CODE_TTL_MS = 5 * 60 * 1000
const RESEND_COOLDOWN_MS = 60 * 1000

function formatCountdown(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function getSecondsLeft(deadlineMs, nowMs) {
  if (!deadlineMs) return 0
  return Math.max(0, Math.floor((deadlineMs - nowMs) / 1000))
}

function startCodeDeadline() {
  return Date.now() + CODE_TTL_MS
}

function startResendDeadline() {
  return Date.now() + RESEND_COOLDOWN_MS
}

export default function ForgotPasswordFlow({
  initialEmail = '',
  lockEmail = false,
  emailStepTitle = 'Recuperar contraseña',
  emailStepDescription = 'Te enviaremos un código de 4 dígitos a tu correo para restablecer tu acceso.',
  passwordStepTitle = 'Restablece tu contraseña',
  backLabel = '← Volver al ingreso',
  hideChangeEmailLink = false,
  loading = false,
  error = '',
  onBack,
  onSendCode,
  onVerifyCode,
  onResetPassword,
}) {
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [localError, setLocalError] = useState('')
  const [sendStatus, setSendStatus] = useState('idle')
  const [expiresAtMs, setExpiresAtMs] = useState(null)
  const [resendAvailableAtMs, setResendAvailableAtMs] = useState(null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    setEmail(initialEmail)
  }, [initialEmail])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const codeSecondsLeft = useMemo(
    () => getSecondsLeft(expiresAtMs, now),
    [expiresAtMs, now],
  )

  const resendSecondsLeft = useMemo(
    () => getSecondsLeft(resendAvailableAtMs, now),
    [resendAvailableAtMs, now],
  )

  const displayError = localError || (step === 'password' ? error : '')

  const dispatchSendCode = async (trimmedEmail, { advanceStep = false } = {}) => {
    setLocalError('')
    setSendStatus('sending')

    if (advanceStep) {
      setCode('')
      setExpiresAtMs(null)
      setResendAvailableAtMs(null)
      setStep('code')
    }

    const result = await onSendCode(trimmedEmail)

    if (!result.success) {
      setSendStatus('error')
      setLocalError(result.error)
      return result
    }

    setSendStatus('sent')
    setExpiresAtMs(startCodeDeadline())
    setResendAvailableAtMs(startResendDeadline())
    return result
  }

  const handleSendCode = async (event) => {
    event?.preventDefault()

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setLocalError('Ingresa tu correo electrónico.')
      return
    }

    await dispatchSendCode(trimmedEmail, { advanceStep: true })
  }

  const handleVerifyCode = async (event) => {
    event.preventDefault()
    setLocalError('')

    if (sendStatus === 'sending') {
      setLocalError('Estamos enviando tu código. Espera un momento e inténtalo de nuevo.')
      return
    }

    if (code.length !== 4) {
      setLocalError('Ingresa el código de 4 dígitos.')
      return
    }

    if (codeSecondsLeft <= 0) {
      setLocalError('El código expiró. Solicita uno nuevo.')
      return
    }

    const result = await onVerifyCode(email.trim(), code)
    if (!result.success) {
      setLocalError(result.error)
      return
    }

    setResetToken(result.resetToken)
    setStep('password')
  }

  const handleResetPassword = async (event) => {
    event.preventDefault()
    setLocalError('')

    if (password.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (password !== passwordConfirm) {
      setLocalError('Las contraseñas no coinciden.')
      return
    }

    await onResetPassword({
      email: email.trim(),
      resetToken,
      password,
      passwordConfirm,
    })
  }

  const handleResendCode = async () => {
    if (resendSecondsLeft > 0 || sendStatus === 'sending') return

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setStep('email')
      setLocalError('Ingresa tu correo electrónico.')
      return
    }

    setCode('')
    await dispatchSendCode(trimmedEmail)
  }

  if (step === 'email') {
    return (
      <>
        <h2 className="text-center text-2xl font-bold text-gray-900">{emailStepTitle}</h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          {emailStepDescription}
        </p>

        <form onSubmit={handleSendCode} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Correo electrónico</label>
            <input
              type="email"
              required
              value={email}
              readOnly={lockEmail}
              disabled={lockEmail}
              onChange={(event) => {
                if (!lockEmail) setEmail(event.target.value)
              }}
              className={
                lockEmail
                  ? `${inputClass} cursor-not-allowed bg-gray-50 text-gray-600`
                  : inputClass
              }
              placeholder="tu@correo.com"
            />
          </div>

          {displayError && <p className="text-sm text-red-600">{displayError}</p>}

          <button
            type="submit"
            className="btn-fill btn-fill--solid w-full rounded-full py-3 text-sm"
          >
            Enviar código
          </button>
        </form>

        <button type="button" onClick={onBack} className="mt-4 w-full text-sm text-gray-500 hover:text-gray-900">
          {backLabel}
        </button>
      </>
    )
  }

  if (step === 'code') {
    return (
      <>
        <h2 className="text-center text-2xl font-bold text-gray-900">Verifica tu código</h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          {sendStatus === 'sending' ? (
            <>Enviando código a <span className="font-medium text-gray-900">{email}</span>...</>
          ) : (
            <>Revisa tu correo <span className="font-medium text-gray-900">{email}</span></>
          )}
        </p>

        <form onSubmit={handleVerifyCode} className="mt-6 space-y-5">
          <div>
            <label className="mb-3 block text-center text-sm font-medium text-gray-700">
              Ingresa el código de 4 dígitos
            </label>
            <OtpCodeInput
              value={code}
              onChange={setCode}
              disabled={loading || sendStatus !== 'sent' || codeSecondsLeft <= 0}
              hasError={Boolean(displayError)}
              autoFocus
            />
          </div>

          <p className="text-center text-sm text-gray-500">
            {sendStatus === 'sending' ? (
              <>Preparando envío del código…</>
            ) : codeSecondsLeft > 0 ? (
              <>El código expira en <span className="font-semibold text-gray-900">{formatCountdown(codeSecondsLeft)}</span></>
            ) : (
              <span className="font-medium text-red-600">El código expiró</span>
            )}
          </p>

          {displayError && <p className="text-center text-sm text-red-600">{displayError}</p>}

          <button
            type="submit"
            disabled={loading || sendStatus !== 'sent' || codeSecondsLeft <= 0 || sendStatus === 'sending'}
            className="btn-fill btn-fill--solid w-full rounded-full py-3 text-sm disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Continuar'}
          </button>

          <button
            type="button"
            onClick={handleResendCode}
            disabled={loading || resendSecondsLeft > 0 || sendStatus === 'sending'}
            className="w-full text-sm font-medium text-gray-900 underline hover:no-underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
          >
            {resendSecondsLeft > 0
              ? `Reenviar código en ${formatCountdown(resendSecondsLeft)}`
              : 'Reenviar código'}
          </button>
        </form>

        {!hideChangeEmailLink && !lockEmail && (
          <button
            type="button"
            onClick={() => {
              setStep('email')
              setLocalError('')
              setSendStatus('idle')
            }}
            className="mt-4 w-full text-sm text-gray-500 hover:text-gray-900"
          >
            ← Cambiar correo
          </button>
        )}
      </>
    )
  }

  return (
    <>
      <h2 className="text-center text-2xl font-bold text-gray-900">{passwordStepTitle}</h2>
      <p className="mt-2 text-center text-sm text-gray-500">
        Crea una contraseña nueva para tu cuenta.
      </p>

      <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nueva contraseña</label>
          <PasswordInput
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Confirmar contraseña</label>
          <PasswordInput
            required
            value={passwordConfirm}
            onChange={(event) => setPasswordConfirm(event.target.value)}
            className={inputClass}
          />
        </div>

        {displayError && <p className="text-sm text-red-600">{displayError}</p>}

        <button
          type="submit"
          disabled={loading}
          className="btn-fill btn-fill--solid w-full rounded-full py-3 text-sm disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Restablecer contraseña'}
        </button>
      </form>
    </>
  )
}
