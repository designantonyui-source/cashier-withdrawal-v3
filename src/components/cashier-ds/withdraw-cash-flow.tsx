import {
  PaymentBlik,
  PaymentMastercard,
  PaymentNeteller,
  PaymentPaypal,
  PaymentSkrill,
  PaymentVisa,
} from "@tabler/payments-react"
import {
  ArrowUpRight,
  CreditCard,
  Landmark,
  Plus,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import { useEffect, useId, useMemo, useState, type ReactNode } from "react"

import { cn } from "@/lib/utils"
import { getBankLogoSrc } from "@/lib/bank-options"
import { BankTransferMark, CardBadgeMark, WalletBadgeMark } from "./payment-icons"

import {
  currencyExponent,
  formatMoney,
  formatNumber,
  formatReceipt,
  normalizeAmountInput,
  parseAmount,
  roundToExponent,
} from "./money"
import {
  ActionButton,
  AmountDisplay,
  BalanceCard,
  CashierHeader,
  CashierSheet,
  CurrencyAmountField,
  HeaderBalanceSubtitle,
  MethodGroup,
  MethodRow,
  MethodTrigger,
  PaymentChip,
  QuickAmounts,
  SecureTransactionNote,
  StatusToast,
  SummaryList,
  SummaryRow,
} from "./primitives"

export type WithdrawalMethodOption = {
  id: string
  name: string
  description: string
  /** When the money is expected to reach the destination. */
  eta: string
  feeRate: number
  icon: LucideIcon
  /** Brand mark via @tabler/payments-react; rendered at 28px in the 56px slot. */
  brand?: "blik" | "paypal" | "card"
  /** Where the payout lands, used for the header label. */
  flow?: "bank" | "card" | "wallet"
}

export type WithdrawalDestination = {
  id: string
  /** Which withdrawal method this destination belongs to. */
  methodId: string
  /** e.g. "Visa •••• 4242" */
  title: string
  /** e.g. "Anna Kowalska" */
  subtitle?: string
  /** e.g. "PL61 •••• •••• 2874" */
  meta?: string
}

export type WithdrawalConfirmation = {
  methodId: string
  methodName: string
  destinationId: string
  destinationTitle: string
  amount: number
  fee: number
  total: number
}

type Screen = "hub" | "destination" | "amount" | "review"

type ActivityRow = {
  id: string
  methodName: string
  destinationTitle: string
  amount: number
  fee: number
  total: number
}

const METHODS: WithdrawalMethodOption[] = [
  {
    id: "bank-transfer",
    name: "Bank transfer",
    description: "To your bank account",
    eta: "1–2 business days",
    feeRate: 0.02,
    icon: Landmark,
    flow: "bank",
  },
  {
    id: "card",
    name: "Card",
    description: "Visa or Mastercard",
    eta: "1–2 business days",
    feeRate: 0.03,
    icon: CreditCard,
    brand: "card",
    flow: "card",
  },
  {
    id: "blik",
    name: "BLIK",
    description: "To your linked bank account",
    eta: "Minutes, up to 24 hours",
    feeRate: 0,
    icon: Landmark,
    brand: "blik",
    flow: "bank",
  },
  {
    id: "paypal",
    name: "PayPal",
    description: "To your PayPal wallet",
    eta: "1–2 business days",
    feeRate: 0,
    icon: Wallet,
    brand: "paypal",
    flow: "wallet",
  },
]

const DESTINATIONS: WithdrawalDestination[] = [
  {
    id: "card-4242",
    methodId: "card",
    title: "Visa •••• 4242",
    subtitle: "Anna Kowalska",
  },
  {
    id: "bank-mbank",
    methodId: "bank-transfer",
    title: "mBank",
    subtitle: "PL61 •••• •••• 2874",
  },
  {
    id: "blik-mbank",
    methodId: "blik",
    title: "mBank",
    subtitle: "PL61 •••• •••• 2874",
  },
  {
    id: "paypal-me",
    methodId: "paypal",
    title: "PayPal",
    subtitle: "anna@example.com",
  },
]

function DestinationIcon({
  item,
  flow,
}: {
  item: WithdrawalDestination
  flow?: WithdrawalMethodOption["flow"]
}) {
  const bankLogo = flow === "bank" ? getBankLogoSrc(item.title) : undefined
  if (bankLogo) {
    return (
      <PaymentChip className="px-1.5 py-1">
        <img src={bankLogo} alt="" className="max-h-full max-w-full object-contain" />
      </PaymentChip>
    )
  }

  const label = `${item.title} ${item.subtitle ?? ""}`.toLowerCase()
  if (flow === "card") {
    if (label.includes("visa")) {
      return (
        <PaymentChip>
          <PaymentVisa variant="light" size={30} className="shrink-0" aria-hidden="true" />
        </PaymentChip>
      )
    }
    if (label.includes("master")) {
      return (
        <PaymentChip>
          <PaymentMastercard variant="light" size={30} className="shrink-0" aria-hidden="true" />
        </PaymentChip>
      )
    }
    return (
      <PaymentChip>
        <CardBadgeMark />
      </PaymentChip>
    )
  }

  if (flow === "wallet") {
    if (label.includes("paypal")) {
      return (
        <PaymentChip>
          <PaymentPaypal variant="light" size={30} className="shrink-0" aria-hidden="true" />
        </PaymentChip>
      )
    }
    if (label.includes("skrill")) {
      return (
        <PaymentChip>
          <PaymentSkrill variant="light" size={30} className="shrink-0" aria-hidden="true" />
        </PaymentChip>
      )
    }
    if (label.includes("neteller")) {
      return (
        <PaymentChip>
          <PaymentNeteller variant="light" size={30} className="shrink-0" aria-hidden="true" />
        </PaymentChip>
      )
    }
    return (
      <PaymentChip>
        <WalletBadgeMark />
      </PaymentChip>
    )
  }

  return (
    <PaymentChip>
      <BankTransferMark />
    </PaymentChip>
  )
}

export function WithdrawCashFlow({
  currency = "PLN",
  locale = "pl-PL",
  balance: initialBalance = 250,
  methods = METHODS,
  destinations = DESTINATIONS,
  minimum = 100,
  maximum = 5000,
  quickAmounts = [100, 250, 500, 1000],
  onAddDestination,
  onCancelAddDestination,
  addDestinationSlot,
  selectedDestinationId,
  onSelectDestination,
  onConfirm,
  onCancel,
  onExit,
  variant = "full",
  initialScreen,
  initialAmount,
  initialDestinationId,
  balanceVisible,
  onToggleBalanceVisible,
  className,
}: {
  currency?: string
  locale?: string
  balance?: number
  methods?: WithdrawalMethodOption[]
  destinations?: WithdrawalDestination[]
  minimum?: number
  maximum?: number
  quickAmounts?: number[]
  onAddDestination?: (methodId: string) => void
  /** Clears the pending add form when the add sheet is dismissed. */
  onCancelAddDestination?: () => void
  /** Rendered inside the add sheet, e.g. an "add a card" form. */
  addDestinationSlot?: ReactNode
  selectedDestinationId?: string | null
  onSelectDestination?: (id: string | null) => void
  onConfirm?: (details: WithdrawalConfirmation) => void
  onCancel?: () => void
  /** Leaves the cashier from the header's close button (embedded mode). */
  onExit?: () => void
  variant?: "full" | "embedded"
  /** Opens the flow on a given step. Used by the Storybook state fixtures. */
  initialScreen?: Screen
  initialAmount?: string
  initialDestinationId?: string
  balanceVisible?: boolean
  onToggleBalanceVisible?: () => void
  className?: string
}) {
  const [internalBalanceVisible, setInternalBalanceVisible] = useState(true)
  const isBalanceVisible = balanceVisible ?? internalBalanceVisible
  const toggleBalanceVisible = onToggleBalanceVisible ?? (() => setInternalBalanceVisible((v) => !v))
  const amountInputId = useId()
  const exponent = currencyExponent(currency)
  const [screen, setScreen] = useState<Screen>(
    initialScreen ?? (variant === "full" ? "hub" : "destination"),
  )
  const [rawAmount, setRawAmount] = useState(initialAmount ?? "")
  const [methodId, setMethodId] = useState(() => {
    if (initialDestinationId) {
      const matched = destinations.find((item) => item.id === initialDestinationId)
      if (matched) return matched.methodId
    }
    return methods[0]?.id ?? ""
  })
  const [internalDestinationId, setInternalDestinationId] = useState<string | null>(
    initialDestinationId ?? null,
  )
  const requestedDestinationId = onSelectDestination
    ? (selectedDestinationId ?? null)
    : internalDestinationId
  const [methodSheetOpen, setMethodSheetOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [internalBalance, setInternalBalance] = useState(initialBalance)
  // iGaming: when the host owns the ledger (onConfirm), the prop is the
  // source of truth. Internal balance is only for the standalone storybook flow.
  const isControlled = Boolean(onConfirm)
  const balance = isControlled ? initialBalance : internalBalance
  const headerBalance = (
    <HeaderBalanceSubtitle
      value={formatMoney(balance, currency, locale)}
      visible={isBalanceVisible}
      onToggleVisible={toggleBalanceVisible}
    />
  )
  const setBalance = useMemo(
    () => (isControlled ? () => {} : setInternalBalance),
    [isControlled],
  )
  const [activity, setActivity] = useState<ActivityRow[]>([])
  /** The last confirmed withdrawal, kept so the toast reports settled numbers. */
  const [settled, setSettled] = useState<{ total: number; fee: number } | null>(null)

  const method = methods.find((option) => option.id === methodId) ?? methods[0]
  const feeRate = method?.feeRate ?? 0
  // Same-method rule: the flow only knows about the deposit instrument, so a
  // destination saved for another rail is never offered — like a wallet email
  // being rejected for a bank payout.
  const methodDestinations = destinations.filter((item) => item.methodId === method?.id)
  const addDestinationLabel =
    method?.flow === "bank"
      ? "Add a new account"
      : method?.flow === "card"
        ? "Add a new card"
        : "Add a new wallet"
  const addDestinationHint =
    method?.flow === "wallet"
      ? "Must match the email you used to deposit"
      : "Must be in your name, same as your deposit"
  const addSheetTitle =
    method?.flow === "bank"
      ? "Add a payout account"
      : method?.flow === "card"
        ? "Add a payout card"
        : "Add a payout wallet"
  // The host shows the form (addDestinationSlot) only while adding, so the
  // sheet open state is derived from it — saving or canceling either clears
  // the slot and the sheet closes on its own, with no layout shift underneath.
  const addSheetOpen = Boolean(addDestinationSlot)
  const destinationId =
    requestedDestinationId && methodDestinations.some((item) => item.id === requestedDestinationId)
      ? requestedDestinationId
      : (methodDestinations[0]?.id ?? null)
  const destination = methodDestinations.find((item) => item.id === destinationId) ?? null

  const selectDestination = (id: string) => {
    setInternalDestinationId(id)
    onSelectDestination?.(id)
  }

  const amount = parseAmount(rawAmount, locale, exponent)
  const fee = roundToExponent(amount * feeRate, exponent)
  const total = roundToExponent(amount + fee, exponent)

  /** The largest amount whose amount + fee still fits in the balance. */
  const maxWithdrawable = Math.min(
    maximum,
    roundToExponent(feeRate >= 1 ? 0 : balance / (1 + feeRate), exponent),
  )

  const amountError =
    amount > maximum
      ? `The maximum is ${formatReceipt(maximum, currency, locale)}.`
      : rawAmount !== "" && rawAmount !== "0" && amount < minimum
        ? `The minimum is ${formatReceipt(minimum, currency, locale)}.`
        : total > balance + Number.EPSILON
          ? "You don't have enough balance for this withdrawal."
          : null
  const canReview =
    !amountError && amount >= minimum && amount <= maximum && total <= balance + Number.EPSILON
  const availableQuickAmounts = quickAmounts.filter(
    (value) => value >= minimum && value <= maxWithdrawable,
  )
  const quickValue = availableQuickAmounts.includes(amount) ? amount : null
  const reviewAmount = formatReceipt(amount, currency, locale)
  const feeAmount = formatReceipt(fee, currency, locale)
  const totalAmount = formatReceipt(total, currency, locale)
  const balanceAmount = formatReceipt(balance, currency, locale)
  const feePercent = method ? Math.round(method.feeRate * 100) : 0

  const closeFlow = () => {
    setScreen(variant === "full" ? "hub" : "destination")
    setRawAmount("")
    setProcessing(false)
    setMethodSheetOpen(false)
    onCancel?.()
  }

  /**
   * The X means "leave the cashier", not "go back one step". In the standalone
   * flow there is nowhere to leave to, so it returns to the hub instead.
   */
  const closeButton = variant === "embedded" ? onExit : closeFlow

  const confirm = () => {
    if (!canReview || !method || !destination) return

    const details: WithdrawalConfirmation = {
      methodId: method.id,
      methodName: method.name,
      destinationId: destination.id,
      destinationTitle: destination.title,
      amount,
      fee,
      total,
    }

    if (onConfirm) {
      onConfirm(details)
      return
    }

    setProcessing(true)
  }

  useEffect(() => {
    if (!processing) return

    const timer = window.setTimeout(() => {
      setBalance((current) => Math.max(0, current - total))
      setActivity((current) => [
        {
          id: `withdrawal-${current.length + 1}`,
          methodName: method?.name ?? "",
          destinationTitle: destination?.title ?? "",
          amount,
          fee,
          total,
        },
        ...current,
      ])
      setSettled({ total, fee })
      setProcessing(false)
      setScreen("hub")
      setToastOpen(true)
      setRawAmount("")
    }, 1100)

    return () => window.clearTimeout(timer)
  }, [processing, total, amount, fee, method?.name, destination?.title, setBalance])

  useEffect(() => {
    if (!toastOpen) return

    const timer = window.setTimeout(() => setToastOpen(false), 5000)
    return () => window.clearTimeout(timer)
  }, [toastOpen])

  const canContinueFromDestination = Boolean(destination)

  const destinationLabel =
    method?.flow === "bank"
      ? "your bank"
      : method?.flow === "card"
        ? "your card"
        : method?.name

  return (
    <div className={cn("relative flex h-full min-h-0 flex-col", className)}>
      {screen === "hub" ? (
        <>
          <CashierHeader title="Cash" />
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
            <div className="mt-4 grid gap-7">
              <div className="grid gap-3">
                <BalanceCard
                  label="Cash balance"
                  value={balanceAmount}
                  icon={<Wallet className="size-5" aria-hidden="true" />}
                />
                <ActionButton onClick={() => setScreen("destination")}>Withdraw cash</ActionButton>
              </div>

              <section aria-labelledby="activity-title" className="grid gap-3">
                <h2 id="activity-title" className="text-[17px] font-semibold">
                  Recent activity
                </h2>
                {activity.length > 0 ? (
                  <div className="grid gap-2">
                    {activity.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-card bg-surface-2 p-4"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-danger-surface text-danger">
                          <ArrowUpRight className="size-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] font-medium leading-5">Cash withdrawal</p>
                          <p className="mt-1 truncate text-[12px] leading-4 text-muted-foreground">
                            Today · {item.destinationTitle || item.methodName} · Fee{" "}
                            {formatReceipt(item.fee, currency, locale)}
                          </p>
                        </div>
                        <p className="shrink-0 text-[15px] font-semibold tabular-nums text-danger">
                          −{formatReceipt(item.total, currency, locale)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-card bg-surface-2/60 px-4 py-5 text-[14px] leading-5 text-muted-foreground ring-1 ring-hairline">
                    Your cash withdrawals will appear here.
                  </p>
                )}
              </section>
            </div>
          </div>
        </>
      ) : null}

      {screen === "destination" ? (
        <>
          <CashierHeader
            title={destinationLabel ? `Withdraw to ${destinationLabel}` : "Withdraw"}
            subtitle={headerBalance}
            onBack={() => (variant === "full" ? setScreen("hub") : closeFlow())}
            onClose={closeButton}
          />
          <div className="cashier-push min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-5">
            <div className="grid gap-5">
              {variant === "full" && methods.length > 1 ? (
                <div className="grid gap-1">
                  <p className="text-[12px] leading-4 text-muted-foreground">Withdrawal method</p>
                  <MethodTrigger
                    name={method?.name ?? ""}
                    onClick={() => setMethodSheetOpen(true)}
                  />
                </div>
              ) : null}

              <div className="grid gap-2">
                <h2 className="text-[15px] font-semibold leading-5">Where should the money go?</h2>
                {methodDestinations.length > 0 ? (
                  <MethodGroup label="Destination">
                    {methodDestinations.map((item) => (
                      <MethodRow
                        key={item.id}
                        icon={<DestinationIcon item={item} flow={method?.flow} />}
                        title={item.title}
                        description={item.subtitle}
                        selected={item.id === destinationId}
                        onClick={() => selectDestination(item.id)}
                      />
                    ))}
                  </MethodGroup>
                ) : null}

                {onAddDestination && method ? (
                  <button
                    type="button"
                    onClick={() => onAddDestination(method.id)}
                    className="flex w-full items-center gap-3 rounded-card border border-dashed border-hairline bg-surface-1/40 p-4 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-3 ring-1 ring-hairline">
                      <Plus className="size-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-medium leading-5">{addDestinationLabel}</span>
                      <span className="mt-1 block text-[12px] leading-4 text-muted-foreground">{addDestinationHint}</span>
                    </span>
                  </button>
                ) : null}
              </div>

              {destination ? (
                <div className="grid gap-2">
                  <SummaryList className="bg-surface-1/70">
                    {method?.eta ? <SummaryRow label="Estimated arrival" value={method.eta} /> : null}
                    <SummaryRow
                      label="Withdrawal fee"
                      value={method?.feeRate ? `${feePercent}%` : "No fee"}
                    />
                  </SummaryList>
                  <p className="px-1 text-[12px] leading-4 text-muted-foreground">
                    Withdrawals return to the same method used for your deposit.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
          <div className="shrink-0 border-t border-hairline bg-background/80 px-5 pb-6 pt-3 backdrop-blur-xl">
            <ActionButton
              disabled={!canContinueFromDestination}
              onClick={() => setScreen("amount")}
            >
              Continue
            </ActionButton>
          </div>
        </>
      ) : null}

      {screen === "amount" ? (
        <>
          <CashierHeader title="Amount" subtitle={headerBalance} onBack={() => setScreen("destination")} onClose={closeButton} />
          <div className="cashier-push min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-5">
            <div className="grid gap-4">
              <div className="grid gap-2.5 rounded-card bg-surface-2 p-3.5 ring-1 ring-hairline">
                <div className="grid gap-1.5">
                  <CurrencyAmountField
                    id={amountInputId}
                    label="Withdrawal amount"
                    value={rawAmount}
                    currency={currency}
                    locale={locale}
                    error={Boolean(amountError)}
                    describedBy={amountError ? `${amountInputId}-error` : `${amountInputId}-hint`}
                    onChange={(nextValue) =>
                      setRawAmount(normalizeAmountInput(nextValue, locale, exponent))
                    }
                  />
                  {amountError ? (
                    <p
                      id={`${amountInputId}-error`}
                      role="alert"
                      className="text-[12px] leading-4 text-danger"
                    >
                      {amountError}
                    </p>
                  ) : (
                    <p id={`${amountInputId}-hint`} className="text-[12px] leading-4 text-muted-foreground tabular-nums">
                      Available {formatMoney(balance, currency, locale)} · Minimum{" "}
                      {formatMoney(minimum, currency, locale)} · Maximum{" "}
                      {formatMoney(maximum, currency, locale)}
                    </p>
                  )}
                </div>

                {maxWithdrawable >= minimum ? (
                  <button
                    type="button"
                    onClick={() => setRawAmount(maxWithdrawable.toFixed(exponent))}
                    className="justify-self-start rounded text-[12px] font-medium leading-4 text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Use maximum {formatMoney(maxWithdrawable, currency, locale)}
                  </button>
                ) : (
                  <p className="text-[12px] leading-4 text-muted-foreground">
                    Your balance does not cover the minimum withdrawal and fee. Add funds to continue.
                  </p>
                )}

                {availableQuickAmounts.length > 0 ? (
                  <QuickAmounts
                    amounts={availableQuickAmounts}
                    format={(value) => formatNumber(value, locale)}
                    value={quickValue}
                    surface="card"
                    onSelect={(value) => setRawAmount(String(value))}
                  />
                ) : null}
              </div>

              <SummaryList variant="receipt">
                <SummaryRow label="Destination" value={destination?.title ?? "—"} />
                {method?.eta ? <SummaryRow label="Arrives" value={method.eta} /> : null}
                <SummaryRow
                  label="Fee"
                  value={formatReceipt(amount > 0 ? fee : 0, currency, locale)}
                  positive={fee === 0 && amount > 0}
                />
                <SummaryRow
                  label="Total deducted"
                  value={formatReceipt(amount > 0 ? total : 0, currency, locale)}
                  emphasis
                />
              </SummaryList>
            </div>
          </div>
          <div className="shrink-0 border-t border-hairline bg-background/80 px-5 pb-6 pt-3 backdrop-blur-xl">
            <ActionButton disabled={!canReview} onClick={() => setScreen("review")}>
              Review
            </ActionButton>
          </div>
        </>
      ) : null}

      {screen === "review" ? (
        <>
          <CashierHeader
            title="Review"
            subtitle={headerBalance}
            onBack={processing ? undefined : () => setScreen("amount")}
            onClose={processing ? undefined : closeButton}
          />
          <div className="cashier-push min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-5">
            <AmountDisplay value={reviewAmount} label="Withdrawal amount" />
            <SummaryList className="mt-6">
              <SummaryRow label="You withdraw" value={reviewAmount} />
              <SummaryRow
                label="Destination"
                value={destination?.title ?? "—"}
              />
              {method?.eta ? <SummaryRow label="Arrives" value={method.eta} /> : null}
              <SummaryRow label="Fee" value={feeAmount} />
              <SummaryRow label="Total deducted" value={totalAmount} emphasis />
            </SummaryList>
          </div>
          <div className="grid shrink-0 gap-2.5 border-t border-hairline bg-background/80 px-5 pb-5 pt-3 backdrop-blur-xl">
            <ActionButton
              loading={processing}
              loadingLabel="Processing…"
              onClick={confirm}
            >
              Withdraw {reviewAmount}
            </ActionButton>
            <SecureTransactionNote methodName={method?.flow === "card" ? "card" : method?.name} />
          </div>
        </>
      ) : null}

      <CashierSheet
        open={methodSheetOpen}
        title="Withdrawal methods"
        onClose={() => setMethodSheetOpen(false)}
      >
        <MethodGroup label="Withdrawal methods">
          {methods.map((option) => {
            const Icon = option.icon
            const percent = Math.round(option.feeRate * 100)
            const facts = [option.eta, percent ? `${percent}% fee` : "No fee"].filter(Boolean)
            return (
              <MethodRow
                key={option.id}
                icon={
                  option.brand === "blik" ? (
                    <PaymentChip>
                      <PaymentBlik variant="light" size={30} className="shrink-0" aria-hidden="true" />
                    </PaymentChip>
                  ) : option.brand === "paypal" ? (
                    <PaymentChip>
                      <PaymentPaypal variant="light" size={30} className="shrink-0" aria-hidden="true" />
                    </PaymentChip>
                  ) : (
                    <PaymentChip>
                      <Icon className="size-5 text-[#111111]" aria-hidden="true" />
                    </PaymentChip>
                  )
                }
                title={option.name}
                description={facts.join(" · ")}
                selected={option.id === methodId}
                onClick={() => {
                  setMethodId(option.id)
                  setMethodSheetOpen(false)
                }}
              />
            )
          })}
        </MethodGroup>
      </CashierSheet>

      <CashierSheet
        open={addSheetOpen}
        title={addSheetTitle}
        onClose={() => onCancelAddDestination?.()}
      >
        {addDestinationSlot}
      </CashierSheet>

      {toastOpen ? (
        <StatusToast
          title="Cash withdrawn"
          description={`${formatReceipt(settled?.total ?? total, currency, locale)} deducted. New balance ${balanceAmount}.`}
          className="absolute inset-x-4 top-4 z-30"
        />
      ) : null}
    </div>
  )
}
