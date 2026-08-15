import { MapPin } from 'lucide-react'

/** Pin rojo clásico, similar al de Google Maps. */
export default function DeliveryMapCenterPin() {
  return (
    <div className="pointer-events-none flex flex-col items-center">
      <svg
        viewBox="0 0 28 40"
        aria-hidden="true"
        className="h-14 w-10 drop-shadow-[0_3px_8px_rgba(0,0,0,0.35)]"
      >
        <path
          d="M14 0C6.82 0 1 5.82 1 13c0 9.75 13 27 13 27s13-17.25 13-27C27 5.82 21.18 0 14 0z"
          fill="#EA4335"
        />
        <circle cx="14" cy="13" r="5" fill="#fff" />
      </svg>
    </div>
  )
}
