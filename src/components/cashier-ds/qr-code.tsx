import { useMemo } from "react"

import qrcode from "qrcode-generator"

import { cn } from "@/lib/utils"

/**
 * A modern dotted QR code: round data dots plus rounded finder eyes.
 *
 * Geometry follows the standard recipe — 7x7 finder eyes with their
 * 1-module separators kept clear, a baked-in 2-module quiet zone (the white
 * tile padding adds the rest), and error correction M — so the stylistic
 * rounding stays scannable.
 */
export function ModernQrCode({
  value,
  size = 132,
  foreground = "#000000",
  background = "#ffffff",
  errorCorrectionLevel = "M",
  label = "Deposit QR code",
  className,
}: {
  value: string
  size?: number
  foreground?: string
  background?: string
  /** Bump to "Q" when overlaying a center mark so the code stays scannable. */
  errorCorrectionLevel?: "L" | "M" | "Q" | "H"
  label?: string
  className?: string
}) {
  const { count, dots, eyes } = useMemo(() => {
    const qr = qrcode(0, errorCorrectionLevel)
    qr.addData(value)
    qr.make()
    const count = qr.getModuleCount()
    const inEyeZone = (row: number, col: number) =>
      (row < 8 && col < 8) || (row < 8 && col >= count - 8) || (row >= count - 8 && col < 8)
    const dots: Array<[number, number]> = []
    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        if (!inEyeZone(row, col) && qr.isDark(row, col)) dots.push([row, col])
      }
    }
    const eyes: Array<[number, number]> = [
      [0, 0],
      [0, count - 7],
      [count - 7, 0],
    ]
    return { count, dots, eyes }
  }, [value, errorCorrectionLevel])

  const margin = 2
  const total = count + margin * 2
  const offset = (module: number) => module + margin

  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      width={size}
      height={size}
      role="img"
      aria-label={label}
      className={cn("block", className)}
    >
      <rect width={total} height={total} fill={background} />
      {dots.map(([row, col]) => (
        <circle
          key={`${row}-${col}`}
          cx={offset(col) + 0.5}
          cy={offset(row) + 0.5}
          r={0.46}
          fill={foreground}
        />
      ))}
      {eyes.map(([row, col]) => (
        <g key={`${row}-${col}`}>
          <rect
            x={offset(col) + 0.5}
            y={offset(row) + 0.5}
            width={6}
            height={6}
            rx={1.75}
            fill="none"
            stroke={foreground}
            strokeWidth={1}
          />
          <rect
            x={offset(col) + 2}
            y={offset(row) + 2}
            width={3}
            height={3}
            rx={0.95}
            fill={foreground}
          />
        </g>
      ))}
    </svg>
  )
}
