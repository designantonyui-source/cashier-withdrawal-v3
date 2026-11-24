import { PaymentPrzelewy24 } from "@tabler/payments-react"
import { useEffect, useRef, useState } from "react"

import { formatCurrency } from "@/lib/currency"
import { toBankPickerOptions } from "@/lib/bank-options"
import { formatNumber } from "./money"
import {
  ActionButton,
  CashierHeader,
  CashierSurface,
  InlineNotice,
  PaymentChip,
  QuickAmounts,
  SecureTransactionNote,
  SheetPickerField,
  StatusToast,
  SummaryList,
  SummaryRow,
  SupportButton,
} from "./primitives"

const PRESETS = [100, 250, 500]
const FEE_RATE = 0.02
const BANKS = ["mBank", "PKO Bank Polski", "Bank Pekao", "ING Bank Śląski", "Santander Bank Polska", "Other bank"]

export function QuickTopUpFlow({
  balance = 12,
  betAmount = 20,
  initialAmount = 100,
  initialBank = "mBank",
  initialStatus = "idle",
  onBackToGame,
  onContactSupport,
}: {
  balance?: number
  betAmount?: number
  initialAmount?: number
  initialBank?: string
  initialStatus?: "idle" | "success"
  onBackToGame?: () => void
  onContactSupport?: () => void
}) {
  const [amount, setAmount] = useState(initialAmount)
  const [bank, setBank] = useState(initialBank)
  const [status, setStatus] = useState<"idle" | "processing" | "success">(initialStatus === "success" ? "success" : "idle")
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const fee = Math.round(amount * FEE_RATE * 100) / 100
  const total = Math.round((amount + fee) * 100) / 100
  const newBalance = Math.round((balance + amount) * 100) / 100
  const canPay = amount >= 100 && bank.length > 0 && status === "idle"

  const pay = () => {
    if (!canPay) return
    setStatus("processing")
    timer.current = setTimeout(() => setStatus("success"), 1200)
  }

  return (
    <CashierSurface label="Quick top-up">
      <CashierHeader title="Top up to continue" onClose={onBackToGame} />
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {status === "success" ? (
          <div className="grid gap-4">
            <StatusToast
              tone="success"
              title="Payment successful"
              description={`Your new balance is ${formatCurrency(newBalance, "PLN")}.`}
            />
            <SummaryList>
              <SummaryRow label="You receive" value={formatCurrency(amount, "PLN")} />
              <SummaryRow label="Payment method" value={bank ? `Przelewy24 · ${bank}` : "Przelewy24"} />
              <SummaryRow label="Fee" value={formatCurrency(fee, "PLN")} />
              <SummaryRow label="Total to pay" value={formatCurrency(total, "PLN")} emphasis />
            </SummaryList>
          </div>
        ) : (
          <div className="grid gap-4">
            <p className="text-[14px] leading-5 text-muted-foreground">
              Balance {formatCurrency(balance, "PLN")} · this bet {formatCurrency(betAmount, "PLN")}. Top up without leaving the game.
            </p>
            <QuickAmounts
              amounts={PRESETS}
              format={(value) => formatNumber(value, "pl-PL")}
              value={PRESETS.includes(amount) ? amount : null}
              onSelect={(value) => setAmount(value)}
            />
            <div className="grid gap-2 rounded-card bg-surface-2 p-4">
              <div className="flex items-center gap-3">
                <PaymentChip>
                  <PaymentPrzelewy24 variant="light" size={26} className="shrink-0" aria-hidden="true" />
                </PaymentChip>
                <div className="grid">
                  <p className="text-[15px] font-semibold leading-5">Przelewy24</p>
                  <p className="text-[12px] leading-4 text-muted-foreground">Pay by bank · 2% fee</p>
                </div>
              </div>
              <SheetPickerField
                id="topup-bank"
                label="Bank"
                sheetTitle="Choose your bank"
                placeholder="Choose your bank"
                value={bank}
                options={toBankPickerOptions(BANKS)}
                onChange={setBank}
                className="mt-1"
              />
            </div>
            <SummaryList variant="receipt">
              <SummaryRow label="You receive" value={formatCurrency(amount, "PLN")} />
              <SummaryRow label="Payment method" value={bank ? `Przelewy24 · ${bank}` : "Przelewy24"} />
              <SummaryRow label="Fee" value={formatCurrency(fee, "PLN")} positive={fee === 0} />
              <SummaryRow label="Total to pay" value={formatCurrency(total, "PLN")} emphasis />
            </SummaryList>
            <InlineNotice title="You stay in the game">
              Confirm in your banking app. Nothing is charged until you confirm there.
            </InlineNotice>
          </div>
        )}
      </div>
      <div className="shrink-0 border-t border-hairline bg-background/80 px-5 pb-6 pt-3 backdrop-blur-xl">
        {status === "success" ? (
          <div className="grid gap-2">
            {onBackToGame && <ActionButton onClick={onBackToGame}>Back to game</ActionButton>}
            {onContactSupport && <SupportButton variant="ghost" size="sm" onClick={onContactSupport} />}
          </div>
        ) : (
          <div className="grid gap-2.5">
            <ActionButton disabled={!canPay} loading={status === "processing"} loadingLabel="Processing…" onClick={pay}>
              Continue
            </ActionButton>
            <SecureTransactionNote methodName="Przelewy24" />
            {onBackToGame && <ActionButton variant="ghost" onClick={onBackToGame}>Back to game</ActionButton>}
          </div>
        )}
      </div>
    </CashierSurface>
  )
}
