import { useState } from "react"
import { ChevronDown, Clock, Gift, Info } from "lucide-react"
import { Switch } from "@/components/cashier-ds/primitives"
import { formatCurrency } from "@/lib/currency"
import { cn } from "@/lib/utils"
import type { Currency } from "@/types"

export type BonusOffer = {
  id: string
  matchPercent: number
  cap: number
  currency: Currency
  wageringMultiplier: number
  /** How the requirement is computed. Must be stated to the player. */
  wageringBasis: "bonus" | "bonus_plus_deposit"
  minDeposit: number
  maxBet: number
  maxCashout: number | null
  expiryDays: number
  /** Slots ~100%, table lower, live sometimes 0. */
  gameWeightsNote?: string
  excludedGamesNote?: string
}

export type ActiveBonus = {
  offer: BonusOffer
  bonusAmount: number
  depositAmount: number
  contributed: number
  expiresAt: string
}

const welcomeOffer: BonusOffer = {
  id: "welcome-100",
  matchPercent: 100,
  cap: 100,
  currency: "PLN",
  wageringMultiplier: 35,
  wageringBasis: "bonus",
  minDeposit: 100,
  maxBet: 5,
  maxCashout: 500,
  expiryDays: 30,
  gameWeightsNote: "Slots count 100%, table games 10%, live casino 10%.",
  excludedGamesNote: "Excluded games do not count.",
}

function requirement(offer: BonusOffer, bonus: number, deposit: number) {
  return offer.wageringBasis === "bonus" ? bonus * offer.wageringMultiplier : (bonus + deposit) * offer.wageringMultiplier
}

function wholeCurrency(value: number, currency: Currency) {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function WelcomeBonusOffer({
  offer = welcomeOffer,
  initialOptedIn = true,
  active,
  onOptInChange,
  onTerms,
}: {
  offer?: BonusOffer
  initialOptedIn?: boolean
  active?: ActiveBonus
  onOptInChange?: (optedIn: boolean) => void
  onTerms?: () => void
}) {
  const [optedIn, setOptedIn] = useState(initialOptedIn)
  const [termsOpen, setTermsOpen] = useState(false)
  const toggle = (value: boolean) => {
    setOptedIn(value)
    onOptInChange?.(value)
  }

  const req = active ? requirement(offer, active.bonusAmount, active.depositAmount) : 0
  const remaining = active ? Math.max(0, req - active.contributed) : 0
  const pct = active && req > 0 ? Math.min(100, (active.contributed / req) * 100) : 0

  return (
    <section
      aria-labelledby="welcome-bonus-title"
      className={cn(
        "relative overflow-hidden rounded-card bg-surface-2 ring-1 transition-colors",
        optedIn || active ? "ring-primary/40" : "ring-hairline",
      )}
    >
      <div className="grid gap-3.5 p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-primary">
              <Gift className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase leading-4 tracking-[0.08em] text-text-tertiary">First deposit bonus</p>
              <h2 id="welcome-bonus-title" className="mt-0.5 text-[20px] font-semibold leading-6 tracking-[-0.01em] text-foreground tabular-nums">
                {offer.matchPercent}% <span className="text-[15px] font-medium text-muted-foreground">up to</span> {wholeCurrency(offer.cap, offer.currency)}
              </h2>
            </div>
          </div>
          {!active && (
            <Switch
              checked={optedIn}
              onCheckedChange={toggle}
              aria-label="Add first deposit bonus"
              className="mt-1"
            />
          )}
        </div>

        {/* Key terms — compact scannable line */}
        <p className="text-[12px] leading-4 text-muted-foreground tabular-nums">
          Min {wholeCurrency(offer.minDeposit, offer.currency)} · {offer.wageringMultiplier}× wagering · Max bet {wholeCurrency(offer.maxBet, offer.currency)}
        </p>

        {/* Active bonus progress */}
        {active && (
          <div className="grid gap-2 rounded-card bg-surface-1 p-3 ring-1 ring-hairline">
            <div className="flex items-baseline justify-between gap-3">
              <p className="flex items-center gap-2 text-[12px] leading-4 text-muted-foreground">
                <Clock className="size-3.5 shrink-0" aria-hidden="true" />
                Ends {active.expiresAt}
              </p>
              <p className="text-[12px] font-semibold leading-4 text-foreground tabular-nums">{Math.round(pct)}%</p>
            </div>
            <div
              role="progressbar"
              aria-valuenow={Math.round(pct)}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-2 overflow-hidden rounded-full bg-surface-3"
            >
              <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[12px] leading-4 text-muted-foreground tabular-nums">
              <span className="font-semibold text-foreground">{formatCurrency(remaining, offer.currency)}</span> left of{" "}
              {formatCurrency(req, offer.currency)} ({offer.wageringBasis === "bonus" ? "bonus" : "bonus + deposit"} ×{" "}
              {offer.wageringMultiplier})
            </p>
          </div>
        )}

        {/* Terms — expandable */}
        <div className="border-t border-hairline pt-1">
          <button
            type="button"
            aria-expanded={termsOpen}
            onClick={() => setTermsOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-2 rounded py-2 text-left text-[12px] font-semibold leading-4 text-foreground/90 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span>Bonus terms</span>
            <ChevronDown className={cn("size-4 text-muted-foreground transition-transform duration-150", termsOpen && "rotate-180")} aria-hidden="true" />
          </button>
          {termsOpen && (
            <div className="grid gap-2 pb-1 text-[12px] leading-4 text-muted-foreground">
              <p>
                Applies to your first deposit of {formatCurrency(offer.minDeposit, offer.currency)} or more. Bonus is {offer.matchPercent}%
                of the deposit, capped at {formatCurrency(offer.cap, offer.currency)}.
              </p>
              <p>
                Wagering: {offer.wageringMultiplier}× the {offer.wageringBasis === "bonus" ? "bonus" : "bonus + deposit"}.{" "}
                {offer.gameWeightsNote} {offer.excludedGamesNote}
              </p>
              <p>
                Max bet while wagering {formatCurrency(offer.maxBet, offer.currency)}
                {offer.maxCashout !== null ? `, max cashout ${formatCurrency(offer.maxCashout, offer.currency)}` : ""}. Expires in{" "}
                {offer.expiryDays} days.
              </p>
              <p className="flex items-start gap-2">
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                <span>
                  Bonus funds are not cash.{" "}
                  <button type="button" onClick={onTerms} className="font-semibold text-primary underline underline-offset-2 hover:text-accent-hover">
                    Read the full bonus terms
                  </button>
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
