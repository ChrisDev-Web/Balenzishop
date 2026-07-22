export default function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`skeleton-shimmer bg-stone-200/90 ${className}`}
      aria-hidden="true"
      {...props}
    />
  )
}
