import { useId } from "react"

/**
 * Mercury-inspired light payment card badge with subtle purple guilloché waves,
 * silver EMV chip, contactless indicator, and violet emblem circles,
 * sized for the 53×32 PaymentChip slot.
 */
export function CardBadgeMark({ className }: { className?: string }) {
  const uid = useId()
  const bgId = `${uid}-bg`
  const clipId = `${uid}-clip`
  const chipId = `${uid}-chip`
  return (
    <svg
      viewBox="0 0 38 24"
      fill="none"
      className={className ?? "h-[21px] w-[33px] shrink-0"}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={bgId} x1="0" y1="0" x2="38" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f3f0ff" />
        </linearGradient>
        <linearGradient id={chipId} x1="4.5" y1="8.5" x2="11" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <clipPath id={clipId}>
          <rect x="0.5" y="0.5" width="37" height="23" rx="3.5" />
        </clipPath>
      </defs>
      <rect x="0.5" y="0.5" width="37" height="23" rx="3.5" fill={`url(#${bgId})`} />
      {/* Subtle wavy guilloché horizon lines */}
      <g clipPath={`url(#${clipId})`} stroke="#7c3aed" strokeOpacity="0.32" strokeWidth="0.65">
        <path d="M0 3.2C8 1.8 14 4.8 22 2.8C29 1.1 33 3.6 38 2.4" />
        <path d="M0 5.4C8 4.0 14 7.0 22 5.0C29 3.3 33 5.8 38 4.6" />
        <path d="M0 7.6C8 6.2 14 9.2 22 7.2C29 5.5 33 8.0 38 6.8" />
        <path d="M0 9.8C8 8.4 14 11.4 22 9.4C29 7.7 33 10.2 38 9.0" />
        <path d="M0 12.0C8 10.6 14 13.6 22 11.6C29 9.9 33 12.4 38 11.2" />
      </g>
      <rect x="0.5" y="0.5" width="37" height="23" rx="3.5" stroke="#c4b5fd" strokeWidth="1.05" />
      {/* Brushed silver EMV chip */}
      <rect x="4.5" y="9" width="6.5" height="5" rx="1" fill={`url(#${chipId})`} stroke="#64748b" strokeWidth="0.55" />
      <path d="M4.5 11.5H11M7.75 9V14" stroke="#64748b" strokeWidth="0.5" />
      {/* Contactless waves */}
      <g stroke="#7c3aed" strokeOpacity="0.85" strokeWidth="0.9" strokeLinecap="round">
        <path d="M13 10.4a1.9 1.9 0 0 1 0 2.2" />
        <path d="M14.3 9.7a3.1 3.1 0 0 1 0 3.6" />
        <path d="M15.6 9.0a4.3 4.3 0 0 1 0 5.0" />
      </g>
      {/* Overlapping purple network circles */}
      <circle cx="28.2" cy="17.8" r="2.8" fill="#7c3aed" />
      <circle cx="31.8" cy="17.8" r="2.8" fill="#a78bfa" fillOpacity="0.85" />
    </svg>
  )
}

/**
 * Soft lavender-silver architectural bank emblem matching CardBadgeMark's
 * Mercury-inspired palette, sized for the 53×32 PaymentChip slot.
 */
export function BankTransferMark({
  instant = false,
  className,
}: {
  instant?: boolean
  className?: string
}) {
  const uid = useId()
  const roofId = `${uid}-roof`
  const colId = `${uid}-col`
  const baseId = `${uid}-base`
  return (
    <svg
      viewBox="0 0 28 24"
      fill="none"
      className={className ?? "h-6 w-7 shrink-0"}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={roofId} x1="14" y1="2.5" x2="14" y2="9.5" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ede9fe" />
          <stop offset="100%" stopColor="#ddd6fe" />
        </linearGradient>
        <linearGradient id={colId} x1="0" y1="9.5" x2="0" y2="18.5" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="22%" stopColor="#f1f5f9" />
          <stop offset="85%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#c4b5fd" />
        </linearGradient>
        <linearGradient id={baseId} x1="14" y1="18.5" x2="14" y2="22.5" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ddd6fe" />
          <stop offset="100%" stopColor="#c4b5fd" />
        </linearGradient>
      </defs>
      {/* Columns */}
      {[6.2, 10.6, 15.0, 19.4].map((x) => (
        <rect
          key={x}
          x={x}
          y="9.2"
          width="2.4"
          height="9.3"
          rx="0.5"
          fill={`url(#${colId})`}
          stroke="#94a3b8"
          strokeWidth="0.7"
        />
      ))}
      {/* Pediment roof */}
      <path
        d="M13.2 2.8a1.5 1.5 0 0 1 1.6 0l8.4 4.8c.78.45.46 1.65-.44 1.65H5.24c-.9 0-1.22-1.2-.44-1.65l8.4-4.8Z"
        fill={`url(#${roofId})`}
        stroke="#8b5cf6"
        strokeOpacity="0.65"
        strokeWidth="1.15"
        strokeLinejoin="round"
      />
      {/* Subtle inner roof highlight */}
      <path
        d="M14 4.4 7.7 7.95h12.6L14 4.4Z"
        fill="#ffffff"
        fillOpacity="0.45"
      />
      {/* Stepped foundation plinth */}
      <rect
        x="4.5"
        y="18.3"
        width="19"
        height="1.9"
        rx="0.7"
        fill="#ede9fe"
        stroke="#8b5cf6"
        strokeOpacity="0.55"
        strokeWidth="0.9"
      />
      <rect
        x="3.5"
        y="20.1"
        width="21"
        height="2.1"
        rx="0.7"
        fill={`url(#${baseId})`}
        stroke="#8b5cf6"
        strokeOpacity="0.65"
        strokeWidth="0.95"
      />
      {instant ? (
        <>
          <circle cx="23" cy="5.5" r="4.3" fill="#7c3aed" stroke="#ffffff" strokeWidth="1.2" />
          <path d="M23.5 3.1 21.3 5.9h1.5l-.35 2 2.2-2.8h-1.5l.35-2Z" fill="#ffffff" />
        </>
      ) : null}
    </svg>
  )
}

/**
 * Clean light-surface duotone wallet fallback icon with brand purple accents,
 * sized for the 53×32 PaymentChip slot.
 */
export function WalletBadgeMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 26 24"
      fill="none"
      className={className ?? "h-6 w-[26px] shrink-0"}
      aria-hidden="true"
    >
      <path
        d="M5 6.5 18 4.2c1-.18 1.9.58 1.9 1.6v1.2H5V6.5Z"
        fill="#ddd6fe"
        stroke="#7c3aed"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <rect
        x="2.5"
        y="6.8"
        width="19.5"
        height="13.5"
        rx="3"
        fill="#f5f3ff"
        stroke="#7c3aed"
        strokeWidth="1.5"
      />
      <rect x="16" y="11" width="7.5" height="5" rx="1.6" fill="#7c3aed" />
      <circle cx="19.2" cy="13.5" r="1" fill="#ffffff" />
    </svg>
  )
}

/**
 * Miniature back-of-card CVC visual cue showing the magnetic stripe and 3-digit
 * security code badge, matching Stripe/Apple Pay field hints.
 */
export function CvcHintMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 20"
      fill="none"
      className={className ?? "h-5 w-7 shrink-0"}
      aria-hidden="true"
    >
      <rect x="0.75" y="0.75" width="26.5" height="18.5" rx="3.25" fill="#FFFFFF" stroke="#C5CBD6" strokeWidth="1.25" />
      <rect x="1.4" y="4.2" width="25.2" height="3.4" fill="#9CA3AF" />
      <rect x="3.5" y="10.6" width="8.5" height="3.4" rx="1" fill="#E5E7EB" />
      <rect x="12.5" y="9.4" width="13" height="7" rx="3.5" fill="#6B7280" />
      <text
        x="19"
        y="14.55"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="5"
        fontWeight="700"
        letterSpacing="0.15"
        fontFamily="Inter, -apple-system, Arial, sans-serif"
      >
        123
      </text>
    </svg>
  )
}
