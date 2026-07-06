import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function PasswordInput({ className = '', wrapperClassName = '', ...props }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className={`relative w-full ${wrapperClassName}`.trim()}>
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={`${className} pr-11`.trim()}
      />
      <button
        type="button"
        onClick={() => setVisible((show) => !show)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
  )
}
