import type { ComponentType } from "react"
import { CreditCard, Landmark, Wallet, Coins } from "lucide-react"
import { PaymentBlik, PaymentPaypal } from "@tabler/payments-react"

/**
 * Payment-method logos for the Polish market.
 *
 * Sources:
 * - @tabler/payments-react (installed): React components for brands it covers.
 * - public/payment-logos/*.svg: self-hosted files. Run `./fetch-payment-logos.sh`
 *   to pull the open-licensed sets (richiehug/payment-icons dark variants +
 *   datatrans/payment-logos for methods tabler lacks). Verify each brand's
 *   usage guidelines before production.
 *
 * Every entry has a fallback lucide icon so a missing file degrades to an
 * outline glyph instead of a broken image.
 */

export type PaymentLogoId =
  | "blik" | "p24" | "tpay" | "dotpay" | "bank-transfer" | "sepa"
  | "card" | "visa" | "mastercard"
  | "trustly" | "rapid-transfer"
  | "skrill" | "neteller" | "paypal" | "muchbetter" | "jeton" | "mifinity" | "payz"
  | "applepay" | "googlepay"
  | "paysafecard" | "neosurf"
  | "crypto" | "binance-pay"

type Logo = {
  /** Path under /public, self-hosted. */
  src?: string
  /** tabler payments React component, when available. */
  component?: ComponentType<{ variant?: "color" | "light" | "dark"; size?: number; className?: string }>
  /** lucide fallback when neither src nor component resolves. */
  fallback: ComponentType<{ size?: number; className?: string }>
  /** true when the wordmark is wide rather than square. */
  wide?: boolean
}

const logos: Record<PaymentLogoId, Logo> = {
  blik: { src: "/payment-logos/blik.svg", component: PaymentBlik, fallback: Landmark, wide: true },
  p24: { src: "/payment-logos/przelewy24.svg", fallback: Landmark, wide: true },
  tpay: { src: "/payment-logos/tpay.svg", fallback: Landmark, wide: true },
  dotpay: { src: "/payment-logos/dotpay.svg", fallback: Landmark, wide: true },
  "bank-transfer": { fallback: Landmark },
  sepa: { src: "/payment-logos/sepa.svg", fallback: Landmark, wide: true },
  card: { component: undefined, src: "/payment-logos/visa.svg", fallback: CreditCard },
  visa: { src: "/payment-logos/visa.svg", fallback: CreditCard },
  mastercard: { src: "/payment-logos/mastercard.svg", fallback: CreditCard },
  trustly: { src: "/payment-logos/trustly.svg", fallback: Landmark, wide: true },
  "rapid-transfer": { src: "/payment-logos/rapid-transfer.svg", fallback: Landmark, wide: true },
  skrill: { src: "/payment-logos/skrill.svg", fallback: Wallet, wide: true },
  neteller: { src: "/payment-logos/neteller.svg", fallback: Wallet, wide: true },
  paypal: { src: "/payment-logos/paypal.svg", component: PaymentPaypal, fallback: Wallet, wide: true },
  muchbetter: { src: "/payment-logos/muchbetter.svg", fallback: Wallet, wide: true },
  jeton: { src: "/payment-logos/jeton.svg", fallback: Wallet, wide: true },
  mifinity: { src: "/payment-logos/mifinity.svg", fallback: Wallet, wide: true },
  payz: { src: "/payment-logos/payz.svg", fallback: Wallet, wide: true },
  applepay: { src: "/payment-logos/apple-pay.svg", fallback: Wallet, wide: true },
  googlepay: { src: "/payment-logos/google-pay.svg", fallback: Wallet, wide: true },
  paysafecard: { src: "/payment-logos/paysafecard.svg", fallback: Wallet, wide: true },
  neosurf: { src: "/payment-logos/neosurf.svg", fallback: Wallet, wide: true },
  crypto: { fallback: Coins },
  "binance-pay": { src: "/payment-logos/binance.svg", fallback: Coins },
}

/** Logo path for a method, or undefined when the method should use its
 *  fallback glyph. Unlisted ids fall back by flow: bank-like rails get
 *  Landmark, everything else gets Wallet. */
export function paymentLogoSrc(id: string): string | undefined {
  return logos[id as PaymentLogoId]?.src
}

export function paymentLogoWide(id: string): boolean {
  return logos[id as PaymentLogoId]?.wide ?? false
}

export function paymentLogoFallback(id: string): ComponentType<{ size?: number; className?: string }> {
  const entry = logos[id as PaymentLogoId]
  if (entry) return entry.fallback
  return Wallet
}

/** Attachment point for App.tsx Method entries: `logo: paymentLogoSrc("blik")`,
 *  `logoWide: paymentLogoWide("blik")`, `Icon: paymentLogoFallback("blik")`. */
export { logos as paymentLogos }
