import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import useBodyScrollLock from '../../hooks/useBodyScrollLock'
import ForgotPasswordFlow from './ForgotPasswordFlow'

export default function ChangePasswordModal({ email, onClose, onSuccess }) {
  const { sendPasswordResetCode, verifyPasswordResetCode, resetPasswordWithToken } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useBodyScrollLock(true)

  const handleSendResetCode = (resetEmail) => sendPasswordResetCode(resetEmail)

  const handleVerifyResetCode = async (resetEmail, code) => {
    setError('')
    setLoading(true)
    const result = await verifyPasswordResetCode(resetEmail, code)
    setLoading(false)
    return result
  }

  const handleResetPassword = async (payload) => {
    setError('')
    setLoading(true)
    const result = await resetPasswordWithToken(payload)
    setLoading(false)

    if (result.success) {
      onSuccess?.()
      return
    }

    setError(result.error)
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative z-10 max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-8 shadow-2xl sm:max-h-[90vh] sm:rounded-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>

        <ForgotPasswordFlow
          initialEmail={email}
          lockEmail
          hideChangeEmailLink
          emailStepTitle="Cambiar contraseña"
          emailStepDescription="Enviaremos un código de verificación a tu correo registrado."
          passwordStepTitle="Nueva contraseña"
          backLabel="Cancelar"
          loading={loading}
          error={error}
          onBack={onClose}
          onSendCode={handleSendResetCode}
          onVerifyCode={handleVerifyResetCode}
          onResetPassword={handleResetPassword}
        />
      </div>
    </div>,
    document.body,
  )
}
