import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react"
import {
  PaymentApplepay,
  PaymentBlik,
  PaymentGooglePay,
  PaymentMastercard,
  PaymentNeteller,
  PaymentPaypal,
  PaymentPaysafecard,
  PaymentPrzelewy24,
  PaymentSepa,
  PaymentSkrill,
  PaymentTrustly,
  PaymentVisa,
} from "@tabler/payments-react"
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bitcoin,
  Camera,
  Check,
  ChevronDown,
  CircleDollarSign,
  CircleX,
  Clock,
  Coins,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  History,
  Landmark,
  Wallet,
  type LucideProps,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger } from "@/components/ui/popover"
import { isCryptoCreditPending } from "@/lib/crypto-progress"
import { CryptoWithdrawal } from "@/components/crypto-withdrawal"
import { DepositTimeline, DepositTimelineStep } from "@/components/deposit-timeline"
import { blikCopy, type CashierLocale } from "@/blik-copy"
import { cn } from "@/lib/utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { CodeInput } from "@/components/ui/code-input"
import { FloatingInput } from "@/components/ui/floating-input"
import { toBankPickerOptions, toIdBankPickerOptions } from "@/lib/bank-options"
import {
  ActionButton,
  CashierComplianceFooter,
  CashierHeader,
  CashierSheet,
  CashierSurface,
  CurrencyAmountField,
  EmptyState,
  HeaderBalanceSubtitle,
  IconButton,
  InlineNotice,
  MethodGroup,
  MethodRow,
  PaymentChip,
  QuickAmounts,
  SecureTransactionNote,
  SelectionIndicator,
  SheetPickerField,
  StatusHeading,
  StatusToast,
  SummaryList,
  SummaryRow,
  SupportButton,
  Switch,
} from "@/components/cashier-ds/primitives"
import { currencyExponent, formatMoney, formatNumber, normalizeAmountInput, roundToExponent } from "@/components/cashier-ds/money"
import { BankTransferMark, CardBadgeMark, CvcHintMark, WalletBadgeMark } from "@/components/cashier-ds/payment-icons"
import { ModernQrCode } from "@/components/cashier-ds/qr-code"
import {
  WithdrawCashFlow,
  type WithdrawalConfirmation,
  type WithdrawalDestination,
  type WithdrawalMethodOption,
} from "@/components/cashier-ds/withdraw-cash-flow"
import {
  KycVerificationFlow,
  type KycStep,
  type KycSubmission,
} from "@/components/cashier-ds/kyc-verification-flow"
import { CASHIER_LOCALE, formatCurrency } from "@/lib/currency"
import { WelcomeBonusOffer, type ActiveBonus, type BonusOffer } from "@/components/bonus-offer"
import type { Currency, TransactionDirection, SavedCryptoAddress } from "@/types"

export type { Currency, TransactionDirection, SavedCryptoAddress }

type Category = "crypto" | "fiat"
type Region = "PL" | "DE"
export type LicenseMode = "pl-licensed" | "international"
export type KycStatus = "verified" | "unverified" | "pending"
type PaymentStatus = "idle" | "pending" | "success" | "failed" | "canceled" | "expired" | "unknown"
type Mode = TransactionDirection
type CryptoTransfer = { asset: string; network: string; amount: string; status: "detected" | "confirming" | "credited"; confirmations: number; requiredConfirmations: number; createdAt: string }
export type Transaction = { id: number; reference: string; createdAt: string; method: string; amount: number; fee: number | null; currency: Currency; status: Exclude<PaymentStatus, "idle">; direction?: TransactionDirection; destination?: string; asset?: string; network?: string; eta?: string; delayed?: boolean; cancelable?: boolean; chargeState?: "not_charged" | "charged" | "unknown"; declineReason?: "bank" | "funds" | "technical" | "provider" | "card"; expiresAt?: string }
export type SupportContext = { kind: "fiat"; transaction: Transaction } | { kind: "crypto"; asset: string; network: string; transfer?: CryptoTransfer }
type PaymentFlow = "card" | "wallet" | "bank" | "blik" | "crypto"
const sampleBlikCode = "123456"
type CardDetails = {
  number: string
  expiry: string
  cvc: string
  holder: string
}

type Method = {
  id: string
  name: string
  detail: string
  /** When the money is expected to reach the destination. Never a promise the
   *  provider contract does not back. */
  eta?: string
  /** Withdrawal fee rate. BLIK payouts are free for the player (Express Elixir
   *  cost is carried by the operator), so the withdrawal entry pins it to 0
   *  and it must not fall back to the deposit fee table. */
  feeRate?: number
  /** Per-method minimum and maximum transaction limits in PLN. */
  minAmount?: number
  maxAmount?: number
  Icon?: ComponentType<LucideProps>
  logo?: string
  logoWide?: boolean
  flow?: PaymentFlow
  regions?: Region[]
}

type MethodGroup = {
  id: "popular" | "regular"
  title: string
  methods: Method[]
}

const emptyCard: CardDetails = { number: "", expiry: "", cvc: "", holder: "" }

function CryptoProgressPanel({ transfer, onReturnToGame, onViewTransaction, onContactSupport }: { transfer: CryptoTransfer; onReturnToGame?: () => void; onViewTransaction?: () => void; onContactSupport?: () => void }) {
  const creditPending = isCryptoCreditPending(transfer)
  const title = creditPending ? "Confirmations complete" : transfer.status === "detected" ? "Deposit detected" : transfer.status === "confirming" ? "Confirming deposit" : "Deposit credited"
  const description = creditPending ? "Waiting for funds to be added to your balance." : transfer.status === "confirming" ? "You can leave this screen and check History later." : null

  return <section className="grid gap-4" aria-label="Crypto deposit progress">
    <div className="grid gap-1"><h3 className="text-[15px] font-semibold">{title}</h3>{description && <p className="text-[14px] leading-5 text-muted-foreground">{description}</p>}</div>
    <DepositTimeline kind="crypto" transfer={transfer} />
    <SummaryList>
        <SummaryRow label="You receive" value={`${transfer.amount} ${transfer.asset}`} />
        <SummaryRow label="Network" value={transfer.network} />
        <SummaryRow label="Confirmations" value={`${Math.min(transfer.confirmations, transfer.requiredConfirmations)} of ${transfer.requiredConfirmations}`} />
      </SummaryList>
    {transfer.status !== "credited" && <p className="text-[12px] leading-4 text-muted-foreground">A transfer sent on the network cannot be canceled here.</p>}
    {onViewTransaction && <ActionButton variant="secondary" onClick={onViewTransaction}>View transaction</ActionButton>}
    {onReturnToGame && <ActionButton onClick={onReturnToGame}>Back to game</ActionButton>}
    {transfer.status !== "credited" && onContactSupport && <SupportButton variant="ghost" size="sm" onClick={onContactSupport} />}
  </section>
}

const cryptoDepositAddresses: Record<string, { address: string; network: string }> = {
  USDT_Tron: { address: "TX7qY9wK3vR8mN2sL5pX1cD4eF6gH9jB0k", network: "Tron (TRC20)" },
  USDT_Ethereum: { address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", network: "Ethereum (ERC20)" },
  BTC: { address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq", network: "Bitcoin" },
  ETH: { address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", network: "Ethereum" },
  SOL: { address: "7EqQfM2VfZ7yQ8vJz9tY6pX1cD4eF6gH9jB0kLmN3qR", network: "Solana" },
}

const cryptoAddressFor = (asset: string, network: string) => {
  if (asset === "USDT" && network.startsWith("Tron")) return cryptoDepositAddresses.USDT_Tron
  if (asset === "USDT") return cryptoDepositAddresses.USDT_Ethereum
  return cryptoDepositAddresses[asset] ?? cryptoDepositAddresses.ETH
}

const addressCopy = {
  reference: "Address",
  copyReference: "Copy address",
  copiedReference: "Address copied",
  copyFailed: "Could not copy. Select the address to copy it.",
}

export function CryptoDeposit({ asset, network, preview = true, onReturnToGame, onContactSupport }: { asset: string; network: string; preview?: boolean; onReturnToGame?: () => void; onContactSupport?: () => void }) {
  const addressDetails = cryptoAddressFor(asset, network)
  const address = addressDetails.address
  const terms = asset === "BTC"
    ? { minimum: "0.0001 BTC", confirmations: "2", time: "About 20 minutes" }
    : asset === "SOL"
      ? { minimum: "0.05 SOL", confirmations: "Network confirmation", time: "Usually a few minutes" }
      : asset === "ETH"
        ? { minimum: "0.005 ETH", confirmations: "14", time: "About 20 minutes" }
        : network.startsWith("Tron")
          ? { minimum: "5 USDT", confirmations: "20", time: "Usually a few minutes" }
          : { minimum: "5 USDT", confirmations: "14", time: "About 20 minutes" }

  const [copied, setCopied] = useState(false)
  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }
  const assetIcon = `/crypto-icons/${asset.toLowerCase()}.svg`

  return (
    <div className="grid gap-4">
      <section aria-label="Deposit address" className="grid gap-4 rounded-card bg-surface-2 p-4 ring-1 ring-hairline">
        <div className="grid place-items-center gap-3 pt-1">
          <div className="relative rounded-[20px] bg-white p-3 shadow-[0_8px_24px_rgb(0_0_0/0.35)]">
            <ModernQrCode value={address} size={136} errorCorrectionLevel="Q" />
            <span className="absolute left-1/2 top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/10">
              <img src={assetIcon} alt="" aria-hidden="true" className="size-6 rounded-full" />
            </span>
          </div>
          <span className="flex items-center gap-2 rounded-full bg-surface-3 py-1 pl-2 pr-3 text-[12px] font-medium leading-4 text-foreground">
            <img src={assetIcon} alt="" aria-hidden="true" className="size-4 rounded-full" />
            {asset} · {addressDetails.network}
          </span>
        </div>
        <div className="grid gap-2 rounded-card bg-surface-1 px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px] leading-4 text-muted-foreground">Address</span>
            <button
              type="button"
              onClick={copyAddress}
              className="flex shrink-0 items-center gap-2 rounded-full text-[12px] font-medium leading-4 text-primary transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
            >
              {copied
                ? <><Check className="size-4 text-success" aria-hidden="true" /> Copied</>
                : <><Copy className="size-4" aria-hidden="true" /> Copy</>}
            </button>
          </div>
          <p className="break-all font-mono text-[12px] leading-4 text-foreground">{address}</p>
          <span role="status" className="sr-only">{copied ? addressCopy.copiedReference : ""}</span>
        </div>
      </section>
      <InlineNotice tone="warning" title={`Send only ${asset} on ${network}`}>
        Using another asset or network may result in loss of funds.
      </InlineNotice>
      {preview && <SummaryList>
        <SummaryRow label="Minimum deposit" value={<span className="tabular-nums">{terms.minimum}</span>} />
        <SummaryRow label="Confirmations" value={terms.confirmations} />
        <SummaryRow label="Processing time" value={terms.time} />
        <SummaryRow label="Fee" value="Set by your wallet" />
      </SummaryList>}
      {onReturnToGame && <ActionButton onClick={onReturnToGame}>Back to game</ActionButton>}
      {onContactSupport && <SupportButton variant="secondary" onClick={onContactSupport} />}
    </div>
  )
}
const BASE_AMOUNT_PRESETS = [50, 100, 250, 500, 1000, 2500, 5000]
function getValidAmountPresets(min: number, max: number, maxVisible = 4) {
  return BASE_AMOUNT_PRESETS.filter((value) => value >= min && value <= max).slice(0, maxVisible)
}
const demoMin = 100
const demoMax = 50000
const regionNames: Record<Region, string> = { PL: "Poland", DE: "Germany" }
const popularMethods = ["blik", "p24", "card", "bank-transfer"]
const plLicensedDepositIds = new Set(["blik", "p24", "card", "applepay", "googlepay", "paypal", "bank-transfer"])
const plLicensedDepositLimits: Record<string, { min: number; max: number }> = {
  blik: { min: 100, max: 10000 },
  p24: { min: 100, max: 50000 },
  card: { min: 100, max: 20000 },
  applepay: { min: 100, max: 10000 },
  googlepay: { min: 100, max: 10000 },
  paypal: { min: 100, max: 10000 },
  "bank-transfer": { min: 100, max: 50000 },
}
const plLicensedDepositDetails: Record<string, string> = {
  blik: "Instant · No fee",
  p24: "Pay by bank · No fee",
  card: "Instant · No fee",
  applepay: "One-tap · No fee",
  googlepay: "One-tap · No fee",
  paypal: "Digital wallet · No fee",
  "bank-transfer": "1–2 business days · No fee",
}
const demoFeeRates: Record<string, number> = {
  "bank-transfer": 0.02, sepa: 0.02, card: 0.03, blik: 0,
  p24: 0.02, trustly: 0.02, paysafecard: 0, applepay: 0, googlepay: 0,
  paypal: 0, skrill: 0.025, neteller: 0.025, "express-elixir": 0,
}

function getMethodLimits(method: Method | undefined, mode: Mode, licenseMode: LicenseMode) {
  if (!method) return { min: demoMin, max: demoMax }
  if (method.minAmount !== undefined && method.maxAmount !== undefined) {
    return { min: method.minAmount, max: method.maxAmount }
  }
  if (licenseMode === "pl-licensed") {
    if (mode === "deposit" && plLicensedDepositLimits[method.id]) {
      return plLicensedDepositLimits[method.id]
    }
    return { min: 100, max: method.id === "bank-transfer" ? 100000 : 50000 }
  }
  return { min: 100, max: 5000 }
}

function getMethodFeeRate(method: Method | undefined, mode: Mode, licenseMode: LicenseMode) {
  if (!method) return undefined
  if (licenseMode === "pl-licensed") return 0
  return mode === "withdrawal" && method.feeRate !== undefined ? method.feeRate : demoFeeRates[method.id]
}
const plOnlyMethods = ["blik", "bank-transfer", "p24", "trustly", "paysafecard"]
const depositBanks = ["PKO Bank Polski", "Bank Pekao", "mBank", "ING", "Santander", "Other bank"]
const p24Banks = [
  "PKO Bank Polski",
  "Bank Pekao",
  "mBank",
  "ING Bank Śląski",
  "Santander Bank Polska",
  "Millennium Bank",
  "Alior Bank",
  "BNP Paribas",
  "Credit Agricole",
  "Other bank",
]

/**
 * Same-method rule: a withdrawal can only go back to a method the player has
 * successfully deposited with.
 */
const withdrawalMethodIdByDepositName: Record<string, string> = {
  Card: "card",
  "Bank transfer": "bank-transfer",
  "SEPA transfer": "sepa",
  BLIK: "blik",
  Przelewy24: "bank-transfer",
  Trustly: "bank-transfer",
  Paysafecard: "bank-transfer",
  "Apple Pay": "card",
  "Google Pay": "card",
  PayPal: "paypal",
  Skrill: "skrill",
  Neteller: "neteller",
  USDT: "withdraw-crypto",
  BTC: "withdraw-crypto",
  ETH: "withdraw-crypto",
  SOL: "withdraw-crypto",
}

function demoAmounts(
  amount: string,
  method: Method,
  currency: Currency = "PLN",
  minAmount = demoMin,
  maxAmount = demoMax,
  feeRateOverride?: number,
) {
  const exponent = currencyExponent(currency)
  const factor = 10 ** exponent
  if (!new RegExp(`^\\d+(?:[.,]\\d{0,${exponent}})?$`).test(amount)) return null
  const minor = Math.round(Number(amount.replace(",", ".")) * factor)
  if (minor < minAmount * factor || minor > maxAmount * factor) return null
  const rate = feeRateOverride !== undefined ? feeRateOverride : demoFeeRates[method.id]
  return { deposit: minor / factor, fee: rate === undefined ? null : Math.round(minor * rate) / factor }
}

const onlyDigits = (value: string) => value.replace(/\D/g, "")
const formatCardNumber = (value: string) =>
  onlyDigits(value).slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ")
const formatExpiry = (value: string) => {
  const digits = onlyDigits(value).slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}
const formatTransactionDate = (value: string, locale: CashierLocale = "en-GB") => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" }).format(new Date(value))
const shortenAddress = (address: string) => address.length <= 16 ? address : `${address.slice(0, 8)}…${address.slice(-6)}`

type HistoryFilter = "all" | "pending" | "completed" | "failed"

type HistoryItem =
  | { kind: "fiat"; transaction: Transaction; createdAt: string }
  | { kind: "crypto"; transfer: CryptoTransfer; createdAt: string }

const historyGroup = (item: HistoryItem): Exclude<HistoryFilter, "all"> | null => {
  if (item.kind === "crypto") return item.transfer.status === "credited" ? "completed" : "pending"
  if (item.transaction.status === "success") return "completed"
  if (item.transaction.status === "pending" || item.transaction.status === "unknown") return "pending"
  const status = item.transaction.status
  return status === "failed" || status === "canceled" || status === "expired" ? "failed" : null
}

const historyWhen = (iso: string) => {
  const date = new Date(iso)
  const now = new Date()
  const sameDay = (left: Date, right: Date) => left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate()
  const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(date)
  if (sameDay(date, now)) return `Today, ${time}`
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (sameDay(date, yesterday)) return `Yesterday, ${time}`
  const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }
  if (date.getFullYear() !== now.getFullYear()) options.year = "numeric"
  return `${new Intl.DateTimeFormat("en-GB", options).format(date)}, ${time}`
}

const historyMonth = (iso: string) => new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(new Date(iso))

function renderHistoryTimeline(item: HistoryItem) {
  if (item.kind === "crypto") {
    return <DepositTimeline kind="crypto" transfer={item.transfer} />
  }
  const txn = item.transaction
  const flow = [...methods.fiat, ...plLicensedWithdrawalMethods, ...withdrawalMethods].find(
    (candidate) => candidate.name === txn.method,
  )?.flow as "card" | "wallet" | "bank" | "blik" | undefined
  if (txn.direction === "withdrawal") {
    return <WithdrawalTimeline status={txn.status} flow={flow} />
  }
  return (
    <DepositTimeline
      kind="fiat"
      status={txn.status}
      method={txn.method}
      flow={flow}
      declineReason={txn.declineReason}
      chargeState={txn.chargeState}
      delayed={txn.delayed}
    />
  )
}

function HistoryDetails({ item }: { item: HistoryItem }) {
  if (item.kind === "crypto") {
    const active = item.transfer.status !== "credited"
    return (
      <div className="grid gap-3">
        {renderHistoryTimeline(item)}
        <SummaryList className="bg-surface-1/70">
          <SummaryRow label="Asset" value={item.transfer.asset} />
          <SummaryRow label="Network" value={item.transfer.network} />
          <SummaryRow label="Amount" value={`${item.transfer.amount} ${item.transfer.asset}`} />
        </SummaryList>
        {active && <p className="px-1 text-[12px] leading-4 text-muted-foreground">A transfer sent on the network cannot be canceled here.</p>}
      </div>
    )
  }

  const transaction = item.transaction
  const isWithdrawal = transaction.direction === "withdrawal"
  const isFailedOrCanceled =
    transaction.status === "failed" || transaction.status === "canceled" || transaction.status === "expired"
  const settledWithoutCharge =
    !isWithdrawal && isFailedOrCanceled && transaction.chargeState === "not_charged"

  return (
    <div className="grid gap-3">
      {renderHistoryTimeline(item)}
      <SummaryList className="bg-surface-1/70">
        {settledWithoutCharge && <SummaryRow label="Charged" value={formatCurrency(0, transaction.currency)} />}
        {transaction.destination && (
          <SummaryRow label={isWithdrawal ? "Destination" : "Details"} value={transaction.destination} />
        )}
        {isWithdrawal && transaction.method === "Crypto" && transaction.network && (
          <SummaryRow label="Network" value={transaction.network} />
        )}
        {transaction.fee !== null && !isFailedOrCanceled && (
          <>
            <SummaryRow label="Fee" value={formatCurrency(transaction.fee, transaction.currency)} />
            <SummaryRow
              label={isWithdrawal ? "Total deducted" : "Total to pay"}
              value={formatCurrency(transaction.amount + transaction.fee, transaction.currency)}
              emphasis
            />
          </>
        )}
        <SummaryRow
          label="Transaction ID"
          value={<CopyReference inline reference={transaction.reference} copy={blikCopy["en-GB"]} />}
        />
      </SummaryList>
    </div>
  )
}

function HistoryRow({ item, expanded, onToggle, onViewStatus, onContactSupport, onCancel, onCheckCancel }: {
  item: HistoryItem
  expanded: boolean
  onToggle: (open: boolean) => void
  onViewStatus: (transaction: Transaction) => void
  onContactSupport?: (item: HistoryItem) => void
  onCancel?: (transaction: Transaction) => Promise<boolean>
  onCheckCancel?: (transaction: Transaction) => Promise<boolean>
}) {
  const crypto = item.kind === "crypto"
  const isWithdrawal = item.kind === "fiat" && item.transaction.direction === "withdrawal"
  const title = crypto
    ? item.transfer.asset
    : item.transaction.asset ?? item.transaction.method
  const rawAmount = crypto
    ? `${item.transfer.amount} ${item.transfer.asset}`
    : formatCurrency(item.transaction.amount, item.transaction.currency)
  const signedAmount = crypto
    ? rawAmount
    : isWithdrawal
      ? `-${rawAmount}`
      : `+${rawAmount}`
  const status = crypto ? isCryptoCreditPending(item.transfer) ? "credit_pending" : item.transfer.status : item.transaction.status
  const isPending = status === "pending" || status === "unknown" || status === "detected" || status === "confirming" || status === "credit_pending"
  const settledWithoutAmount = status === "failed" || status === "canceled" || status === "expired"
  const settled = status === "success" || status === "credited"
  const supportable = crypto ? item.transfer.status !== "credited" : item.transaction.status === "failed"
  const pendingFiat = item.kind === "fiat" && (item.transaction.status === "pending" || item.transaction.status === "unknown") ? item.transaction : null
  const canCancel = Boolean(pendingFiat && pendingFiat.status === "pending" && pendingFiat.cancelable && onCancel && onCheckCancel)
  const iconTone = isPending
    ? "bg-warning-surface text-warning"
    : settled
      ? "bg-success-surface text-success"
      : "bg-surface-2 text-muted-foreground"
  const destinationLine = item.kind === "fiat" ? item.transaction.destination : item.transfer.network
  const statusLabel = status === "failed"
    ? "Failed"
    : status === "canceled"
      ? "Canceled"
      : status === "expired"
        ? "Expired"
        : status === "unknown"
          ? "Checking"
          : isPending
            ? "Awaiting confirmation"
            : null

  if (isPending) {
    return (
      <li>
        <ExtendableStatusBar
          mode="home"
          title={`${crypto ? "Deposit" : isWithdrawal ? "Withdrawal" : "Deposit"} · ${rawAmount}`}
          ringTone="warning"
          expanded={expanded}
          onExpandChange={onToggle}
          reference={pendingFiat?.reference}
          cancelable={canCancel}
          direction={isWithdrawal ? "withdrawal" : "deposit"}
          amountLabel={rawAmount}
          destinationLabel={pendingFiat?.destination ?? (pendingFiat ? pendingFiat.method : item.kind === "crypto" ? item.transfer.asset : undefined)}
          onOpenFull={pendingFiat ? () => onViewStatus(pendingFiat) : undefined}
          onCheckCancel={pendingFiat && onCheckCancel ? () => onCheckCancel(pendingFiat) : undefined}
          onCancel={pendingFiat && onCancel ? () => onCancel(pendingFiat) : undefined}
          onContactSupport={supportable && onContactSupport ? () => onContactSupport(item) : undefined}
          timeline={renderHistoryTimeline(item)}
        />
      </li>
    )
  }

  return (
    <li>
      <Collapsible open={expanded} onOpenChange={onToggle}>
        <CollapsibleTrigger className="group flex w-full items-center gap-3 rounded-card px-2 py-2.5 text-left transition-colors hover:bg-surface-2/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", iconTone)} aria-hidden="true">
            {isWithdrawal ? <ArrowUpRight className="size-4" aria-hidden="true" /> : <ArrowDownLeft className="size-4" aria-hidden="true" />}
          </span>
          <span className="grid min-w-0 flex-1 gap-0.5">
            <span className="truncate text-[14px] font-semibold leading-5 text-foreground">{title}</span>
            {destinationLine && (
              <span className="truncate text-[12px] leading-4 text-muted-foreground">{destinationLine}</span>
            )}
            <span className="truncate text-[12px] leading-4 text-muted-foreground">
              {status === "failed" ? (
                <>
                  <span className="text-danger">{historyWhen(item.createdAt)} · Failed</span>
                  {item.kind === "fiat" && item.transaction.chargeState === "not_charged" ? " (nothing charged)" : ""}
                </>
              ) : (
                <>
                  {historyWhen(item.createdAt)}
                  {statusLabel ? ` · ${statusLabel}` : ""}
                </>
              )}
            </span>
          </span>
          <span className={cn(
            "shrink-0 text-right text-[14px] font-semibold leading-5 tabular-nums",
            settledWithoutAmount
              ? "text-muted-foreground line-through"
              : settled && !isWithdrawal
                ? "text-success"
                : "text-foreground",
          )}>
            {settledWithoutAmount ? rawAmount : signedAmount}
          </span>
          <span className="sr-only">{expanded ? "Hide details" : "Show details"}</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mb-1 mt-1 grid gap-3 rounded-card bg-surface-2/70 px-4 py-3.5 ring-1 ring-hairline">
            <HistoryDetails item={item} />
            {supportable && onContactSupport && <SupportButton variant="secondary" size="sm" onClick={() => onContactSupport(item)} />}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </li>
  )
}

function EmptyHistory({ onChoosePaymentMethod }: { onChoosePaymentMethod: () => void }) {
  return (
    <EmptyState
      icon={<History className="size-5" aria-hidden="true" />}
      title="No transactions yet"
      description="Your deposits and withdrawals will appear here."
      action="Choose a payment method"
      onAction={onChoosePaymentMethod}
    />
  )
}

function TransactionHistory({ transactions, cryptoTransfer, historyState, onRetry, expandedId, onExpand, cryptoExpanded, onCryptoExpand, onViewStatus, onContactSupport, onChoosePaymentMethod, onCancelTransaction, onCheckCancelTransaction }: {
  transactions: Transaction[]
  cryptoTransfer?: CryptoTransfer
  historyState: "ready" | "loading" | "error"
  onRetry: () => void
  expandedId: number | null
  onExpand: (id: number | null) => void
  cryptoExpanded: boolean
  onCryptoExpand: (open: boolean) => void
  onViewStatus: (transaction: Transaction) => void
  onContactSupport?: (item: HistoryItem) => void
  onChoosePaymentMethod: () => void
  onCancelTransaction?: (transaction: Transaction) => Promise<boolean>
  onCheckCancelTransaction?: (transaction: Transaction) => Promise<boolean>
}) {
  const [filter, setFilter] = useState<HistoryFilter>("all")
  const [visible, setVisible] = useState(10)
  const items: HistoryItem[] = [
    ...(cryptoTransfer ? [{ kind: "crypto" as const, transfer: cryptoTransfer, createdAt: cryptoTransfer.createdAt }] : []),
    ...transactions.map((transaction) => ({ kind: "fiat" as const, transaction, createdAt: transaction.createdAt })),
  ].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
  const filtered = items.filter((item) => filter === "all" || historyGroup(item) === filter)
  const shown = filtered.slice(0, visible)
  const pendingItems = shown.filter((item) => historyGroup(item) === "pending")
  const settledItems = shown.filter((item) => historyGroup(item) !== "pending")
  const groups: { label: string; items: HistoryItem[] }[] = []
  for (const item of settledItems) {
    const label = historyMonth(item.createdAt)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(item)
    else groups.push({ label, items: [item] })
  }
  const filters: { id: HistoryFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "completed", label: "Completed" },
    { id: "failed", label: "Unsuccessful" },
  ]

  if (historyState === "loading") return (
    <section className="grid gap-3" aria-label="Transaction history">
      <p role="status" className="sr-only">Loading transactions</p>
      {[0, 1, 2].map((row) => <div key={row} className="h-[60px] animate-pulse rounded-2xl bg-surface-2" aria-hidden="true" />)}
    </section>
  )

  if (historyState === "error") return (
    <section aria-label="Transaction history">
      <EmptyState
        icon={<CircleX className="size-5" aria-hidden="true" />}
        title="We couldn't load your transactions"
        description="Check your connection and try again."
        action="Try again"
        onAction={onRetry}
        tone="error"
      />
    </section>
  )

  if (items.length === 0) return <EmptyHistory onChoosePaymentMethod={onChoosePaymentMethod} />

  const renderItem = (item: HistoryItem) => item.kind === "crypto"
    ? <HistoryRow key="crypto" item={item} expanded={cryptoExpanded} onToggle={onCryptoExpand} onViewStatus={onViewStatus} onContactSupport={onContactSupport} onCancel={onCancelTransaction} onCheckCancel={onCheckCancelTransaction} />
    : <HistoryRow key={item.transaction.id} item={item} expanded={expandedId === item.transaction.id} onToggle={(open) => onExpand(open ? item.transaction.id : null)} onViewStatus={onViewStatus} onContactSupport={onContactSupport} onCancel={onCancelTransaction} onCheckCancel={onCheckCancelTransaction} />

  return (
    <section className="grid gap-5" aria-label="Transaction history">
      <div role="group" aria-label="Filter transactions" className="flex flex-wrap gap-2">
        {filters.map((option) => {
          const selected = filter === option.id
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => { setFilter(option.id); setVisible(10) }}
              className={selected ? "h-8 rounded-full bg-accent-soft px-3.5 text-[12px] font-medium leading-4 tabular-nums text-foreground ring-1 ring-primary/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" : "h-8 rounded-full bg-surface-2 px-3.5 text-[12px] font-medium leading-4 tabular-nums text-muted-foreground transition-colors hover:bg-surface-3 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          icon={<History className="size-5" aria-hidden="true" />}
          title={`No ${filters.find((option) => option.id === filter)?.label.toLowerCase() ?? ""} transactions`}
          description="Try a different filter to see more transactions."
          action="Show all transactions"
          onAction={() => setFilter("all")}
        />
      ) : (
        <div className="grid gap-5">
          {pendingItems.length > 0 && (
            <section className="grid gap-2" aria-label="Pending transactions">
              <h3 className="px-0.5 text-[13px] font-semibold leading-5 text-foreground">Pending</h3>
              <ul className="grid gap-2">
                {pendingItems.map(renderItem)}
              </ul>
            </section>
          )}
          {groups.map((group) => (
            <section key={group.label} className="grid gap-1" aria-label={group.label}>
              <h3 className="text-[17px] font-semibold leading-6 tracking-[-0.01em] text-foreground">{group.label}</h3>
              <ul className="grid">
                {group.items.map(renderItem)}
              </ul>
            </section>
          ))}
          {filtered.length > shown.length && <ActionButton variant="secondary" size="md" onClick={() => setVisible((count) => count + 10)}>Show more</ActionButton>}
        </div>
      )}
    </section>
  )
}

function passesLuhn(value: string) {
  const digits = onlyDigits(value)
  if (digits.length !== 16) return false

  let sum = 0
  let doubleDigit = false
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index])
    if (doubleDigit) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    doubleDigit = !doubleDigit
  }
  return sum % 10 === 0
}

function hasValidExpiry(value: string) {
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(value)
  if (!match) return false

  const month = Number(match[1])
  const year = 2000 + Number(match[2])
  const now = new Date()
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)
}

export const methods: Record<Category, Method[]> = {
  crypto: [
    { id: "usdt", name: "USDT", detail: "Tether · choose a network next", Icon: CircleDollarSign },
    { id: "btc", name: "BTC", detail: "Bitcoin", Icon: Bitcoin },
    { id: "eth", name: "ETH", detail: "Ethereum", Icon: Coins },
    { id: "sol", name: "SOL", detail: "Solana", Icon: Coins },
  ],
  fiat: [
    {
      id: "bank-transfer",
      name: "Bank transfer",
      detail: "Instant · 2% fee",
      Icon: Landmark,
      flow: "bank",
      regions: ["PL"],
    },
    {
      id: "sepa",
      name: "SEPA transfer",
      detail: "Timing varies by bank · 2% fee",
      Icon: Landmark,
      flow: "bank",
      regions: ["DE"],
    },
    {
      id: "card",
      name: "Card",
      detail: "Instant · 3% fee",
      Icon: CreditCard,
      flow: "card",
      regions: ["PL", "DE"],
    },
    {
      id: "blik",
      name: "BLIK",
      detail: "Instant · No fee",
      logo: "/payment-logos/blik.jpg",
      logoWide: true,
      flow: "blik",
      regions: ["PL"],
    },
    {
      id: "p24",
      name: "Przelewy24",
      detail: "Pay by bank · 2% fee",
      flow: "bank",
      regions: ["PL"],
    },
    {
      id: "trustly",
      name: "Trustly",
      detail: "Instant bank · 2% fee",
      flow: "bank",
      regions: ["PL"],
    },
    {
      id: "paysafecard",
      name: "Paysafecard",
      detail: "Cash voucher · no fee",
      logo: "/payment-logos/paysafecard.svg",
      logoWide: true,
      flow: "wallet",
      regions: ["PL"],
    },
    {
      id: "applepay",
      name: "Apple Pay",
      detail: "One-tap · no fee",
      flow: "wallet",
      regions: ["PL"],
    },
    {
      id: "googlepay",
      name: "Google Pay",
      detail: "One-tap · no fee",
      flow: "wallet",
      regions: ["PL"],
    },
    { id: "paypal", name: "PayPal", detail: "Digital wallet · no fee", logo: "/payment-logos/paypal.svg", flow: "wallet", regions: ["PL"] },
    {
      id: "skrill",
      name: "Skrill",
      detail: "Instant · 2.5% fee",
      logo: "/payment-logos/skrill.svg",
      logoWide: true,
      flow: "wallet",
      regions: ["PL", "DE"],
    },
    {
      id: "neteller",
      name: "Neteller",
      detail: "Instant · 2.5% fee",
      logo: "/payment-logos/neteller.svg",
      logoWide: true,
      flow: "wallet",
      regions: ["PL", "DE"],
    },
  ],
}

/**
 * Withdrawal methods.
 *
 * `eta` is provider data: the time the provider commits to for that rail. The
 * values below are conservative placeholders — production must replace them
 * with the provider's own settlement times, and a method without a committed
 * time must leave `eta` empty rather than show a promise.
 *
 * The copy is deliberately on the slow side. Over-promising arrival creates
 * support tickets; under-promising only disappoints mildly.
 */
export const withdrawalMethods: Method[] = [
  {
    id: "bank-transfer",
    name: "Bank transfer",
    detail: "1–2 business days · 2% fee",
    eta: "1–2 business days",
    Icon: Landmark,
    flow: "bank",
    regions: ["PL"],
  },
  {
    id: "sepa",
    name: "SEPA transfer",
    detail: "1–3 business days · 2% fee",
    eta: "1–3 business days",
    Icon: Landmark,
    flow: "bank",
    regions: ["DE"],
  },
  {
    id: "card",
    name: "Card",
    detail: "1–2 business days · 3% fee",
    eta: "1–2 business days",
    Icon: CreditCard,
    flow: "card",
    regions: ["PL", "DE"],
  },
  {
    id: "blik",
    name: "BLIK",
    detail: "To your linked bank account · No fee",
    eta: "Minutes, up to 24 hours",
    logo: "/payment-logos/blik.jpg",
    logoWide: true,
    flow: "bank",
    regions: ["PL"],
    feeRate: 0,
  },
  { id: "paypal", name: "PayPal", detail: "1–2 business days · No fee", eta: "1–2 business days", logo: "/payment-logos/paypal.svg", flow: "wallet", regions: ["PL"] },
  {
    id: "skrill",
    name: "Skrill",
    detail: "1–2 business days · 2.5% fee",
    eta: "1–2 business days",
    logo: "/payment-logos/skrill.svg",
    logoWide: true,
    flow: "wallet",
    regions: ["PL", "DE"],
  },
  {
    id: "neteller",
    name: "Neteller",
    detail: "1–2 business days · 2.5% fee",
    eta: "1–2 business days",
    logo: "/payment-logos/neteller.svg",
    logoWide: true,
    flow: "wallet",
    regions: ["PL", "DE"],
  },
  {
    id: "withdraw-crypto",
    name: "Crypto",
    detail: "After network confirmation · network fee",
    eta: "After network confirmation",
    Icon: Bitcoin,
    flow: "crypto",
    regions: ["PL", "DE"],
  },
]

export const plLicensedWithdrawalMethods: Method[] = [
  {
    id: "express-elixir",
    name: "Express Elixir",
    detail: "Minutes, up to 1 hour · No fee",
    eta: "Minutes, up to 1 hour",
    feeRate: 0,
    minAmount: 100,
    maxAmount: 50000,
    Icon: Landmark,
    flow: "bank",
    regions: ["PL"],
  },
  {
    id: "bank-transfer",
    name: "Standard Elixir",
    detail: "1–2 business days · No fee",
    eta: "1–2 business days",
    feeRate: 0,
    minAmount: 100,
    maxAmount: 100000,
    Icon: Landmark,
    flow: "bank",
    regions: ["PL"],
  },
]

function getFiatGroups(region: Region, licenseMode: LicenseMode = "pl-licensed"): MethodGroup[] {
  const available = methods.fiat
    .filter((method) => method.regions?.includes(region))
    .filter((method) => licenseMode !== "pl-licensed" || plLicensedDepositIds.has(method.id))
    .map((method) =>
      licenseMode === "pl-licensed" && plLicensedDepositDetails[method.id]
        ? { ...method, detail: plLicensedDepositDetails[method.id], feeRate: 0 }
        : method,
    )
  const popularIds = region === "PL" ? (licenseMode === "pl-licensed" ? ["blik", "p24", "card"] : popularMethods) : ["sepa", "card"]

  const groups: MethodGroup[] = [
    {
      id: "popular",
      title: "Popular methods",
      methods: popularIds.map((id) => available.find((method) => method.id === id)).filter((method): method is Method => Boolean(method)),
    },
    {
      id: "regular",
      title: "Other methods",
      methods: available.filter((method) => !popularIds.includes(method.id)),
    },
  ]
  return groups.filter((group) => group.methods.length > 0)
}

function GenericMark({ Icon }: { Icon: ComponentType<LucideProps> }) {
  return (
    <PaymentChip>
      <Icon className="size-5 text-[#111111]" aria-hidden="true" />
    </PaymentChip>
  )
}

function MethodMark({ method }: { method: Method }) {
  // Brand marks sit centered inside the shared 53×32 8px-rounded PaymentChip
  // so Tabler wordmarks never shrink inside flex slots or clip at the corners.
  switch (method.id) {
    case "blik":
      return (
        <PaymentChip>
          <PaymentBlik variant="light" size={30} className="shrink-0" aria-hidden="true" />
        </PaymentChip>
      )
    case "p24":
      return (
        <PaymentChip>
          <PaymentPrzelewy24 variant="light" size={26} className="shrink-0" aria-hidden="true" />
        </PaymentChip>
      )
    case "trustly":
      return (
        <PaymentChip>
          <PaymentTrustly variant="light" size={30} className="shrink-0" aria-hidden="true" />
        </PaymentChip>
      )
    case "paysafecard":
      return (
        <PaymentChip>
          <PaymentPaysafecard variant="light" size={30} className="shrink-0" aria-hidden="true" />
        </PaymentChip>
      )
    case "applepay":
      return (
        <PaymentChip>
          <PaymentApplepay variant="light" size={30} className="shrink-0" aria-hidden="true" />
        </PaymentChip>
      )
    case "googlepay":
      return (
        <PaymentChip>
          <PaymentGooglePay variant="light" size={30} className="shrink-0" aria-hidden="true" />
        </PaymentChip>
      )
    case "paypal":
      return (
        <PaymentChip>
          <PaymentPaypal variant="light" size={30} className="shrink-0" aria-hidden="true" />
        </PaymentChip>
      )
    case "skrill":
      return (
        <PaymentChip>
          <PaymentSkrill variant="light" size={30} className="shrink-0" aria-hidden="true" />
        </PaymentChip>
      )
    case "neteller":
      return (
        <PaymentChip>
          <PaymentNeteller variant="light" size={30} className="shrink-0" aria-hidden="true" />
        </PaymentChip>
      )
    case "usdt":
      return <img src="/crypto-icons/usdt.svg" alt="" className="size-8 rounded-full" aria-hidden="true" />
    case "btc":
      return <img src="/crypto-icons/btc.svg" alt="" className="size-8 rounded-full" aria-hidden="true" />
    case "eth":
      return <img src="/crypto-icons/eth.svg" alt="" className="size-8 rounded-full" aria-hidden="true" />
    case "sol":
      return <img src="/crypto-icons/sol.svg" alt="" className="size-8 rounded-full" aria-hidden="true" />
    case "card":
      return (
        <PaymentChip>
          <CardBadgeMark />
        </PaymentChip>
      )
    case "bank-transfer":
      return (
        <PaymentChip>
          <BankTransferMark />
        </PaymentChip>
      )
    case "express-elixir":
      return (
        <PaymentChip>
          <BankTransferMark instant />
        </PaymentChip>
      )
    case "sepa":
      return (
        <PaymentChip>
          <PaymentSepa variant="light" size={30} className="shrink-0" aria-hidden="true" />
        </PaymentChip>
      )
    default:
      if (method.flow === "wallet") {
        return (
          <PaymentChip>
            <WalletBadgeMark />
          </PaymentChip>
        )
      }
      {
        const Icon = method.Icon ?? Wallet
        return <GenericMark Icon={Icon} />
      }
  }
}

export function CardFields({
  details,
  attempted,
  onChange,
  saveCard,
  onSaveCardChange,
}: {
  details: CardDetails
  attempted: boolean
  onChange: (field: keyof CardDetails, value: string) => void
  saveCard?: boolean
  onSaveCardChange?: (save: boolean) => void
}) {
  const [internalSaveCard, setInternalSaveCard] = useState(false)
  const isSaveCard = saveCard ?? internalSaveCard
  const handleSaveCardChange = (next: boolean) => {
    if (onSaveCardChange) onSaveCardChange(next)
    else setInternalSaveCard(next)
  }

  const cardDigits = onlyDigits(details.number)
  const cardBrand = detectCardBrand(cardDigits)
  const numberValid = passesLuhn(details.number)
  const expiryValid = hasValidExpiry(details.expiry)
  const cvcValid = details.cvc.length === 3
  const holderValid = details.holder.trim().length >= 2

  return (
    <form
      className="grid gap-2.5"
      aria-label="Card details"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[13px] font-semibold leading-5 text-foreground">Card details</h3>
      </div>
      <div className="overflow-hidden rounded-card bg-surface-2 ring-1 ring-hairline">
        <div className="relative border-b border-hairline">
          <FloatingInput
            id="card-number"
            label="Card number"
            inputMode="numeric"
            autoComplete="off"
            maxLength={19}
            error={attempted && !numberValid}
            aria-invalid={attempted && !numberValid}
            aria-describedby={attempted && !numberValid ? "card-number-error" : undefined}
            value={details.number}
            onChange={(event) => onChange("number", formatCardNumber(event.target.value))}
            inputClassName="h-[54px] rounded-t-card rounded-b-none bg-transparent pl-3 pr-14 ring-0 focus:ring-2 focus:ring-inset"
          />
          {cardBrand ? (
            <span
              className="pointer-events-none absolute right-3 top-1/2 inline-flex h-[22px] -translate-y-1/2 items-center justify-center rounded-[5px] border border-black/10 bg-white px-1.5"
              aria-hidden="true"
            >
              {cardBrand === "Visa" ? (
                <PaymentVisa variant="light" size={16} />
              ) : (
                <PaymentMastercard variant="light" size={16} />
              )}
            </span>
          ) : (
            <button
              type="button"
              aria-label="Scan card"
              title="Scan card"
              onClick={() => {
                onChange("number", "4242 4242 4242 4242")
                onChange("expiry", "08/29")
                onChange("holder", "Anna Kowalska")
                window.requestAnimationFrame(() => document.getElementById("card-cvc")?.focus())
              }}
              className="absolute right-2.5 top-1/2 flex h-7 w-10 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Camera className="size-[18px]" aria-hidden="true" />
            </button>
          )}
          <span className="sr-only" aria-live="polite">{cardBrand ? `${cardBrand} card detected` : ""}</span>
        </div>
        <div className="grid grid-cols-2 border-b border-hairline">
          <div className="border-r border-hairline">
            <FloatingInput
              id="card-expiry"
              label="Expiry date"
              inputMode="numeric"
              autoComplete="off"
              maxLength={5}
              error={attempted && !expiryValid}
              aria-invalid={attempted && !expiryValid}
              aria-describedby={attempted && !expiryValid ? "card-expiry-error" : undefined}
              value={details.expiry}
              onChange={(event) => onChange("expiry", formatExpiry(event.target.value))}
              inputClassName="h-[54px] rounded-none bg-transparent ring-0 focus:ring-2 focus:ring-inset"
            />
          </div>
          <div className="relative">
            <FloatingInput
              id="card-cvc"
              label="CVC"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={3}
              error={attempted && !cvcValid}
              aria-invalid={attempted && !cvcValid}
              aria-describedby={attempted && !cvcValid ? "card-cvc-error" : undefined}
              value={details.cvc}
              onChange={(event) => onChange("cvc", onlyDigits(event.target.value).slice(0, 3))}
              inputClassName="h-[54px] rounded-none bg-transparent pr-13 ring-0 focus:ring-2 focus:ring-inset"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <Popover><PopoverTrigger render={<button type="button" aria-label="What is CVC?" className="flex h-7 w-10 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />}><CvcHintMark /></PopoverTrigger><PopoverContent side="top" className="w-56"><PopoverTitle>What is CVC?</PopoverTitle><PopoverDescription>The 3-digit security code on the back of your card.</PopoverDescription></PopoverContent></Popover>
            </span>
          </div>
        </div>
        <div>
          <FloatingInput
            id="card-holder"
            label="Name on card"
            autoComplete="off"
            error={attempted && !holderValid}
            aria-invalid={attempted && !holderValid}
            aria-describedby={attempted && !holderValid ? "card-holder-error" : undefined}
            value={details.holder}
            onChange={(event) => onChange("holder", event.target.value)}
            inputClassName="h-[54px] rounded-t-none rounded-b-card bg-transparent ring-0 focus:ring-2 focus:ring-inset"
          />
        </div>
      </div>
      {((attempted && !numberValid) || (attempted && !expiryValid) || (attempted && !cvcValid) || (attempted && !holderValid)) && (
        <div className="grid gap-1 px-1">
          {attempted && !numberValid && (
            <p id="card-number-error" className="text-xs text-danger" role="alert">Check your card number.</p>
          )}
          {attempted && !expiryValid && (
            <p id="card-expiry-error" className="text-xs text-danger" role="alert">Enter a valid date (MM/YY).</p>
          )}
          {attempted && !cvcValid && (
            <p id="card-cvc-error" className="text-xs text-danger" role="alert">Enter the 3-digit code.</p>
          )}
          {attempted && !holderValid && (
            <p id="card-holder-error" className="text-xs text-danger" role="alert">Enter the name on your card.</p>
          )}
        </div>
      )}
      <div className="mt-0.5 flex items-center justify-between gap-3 rounded-card bg-surface-2 px-4 py-3.5 ring-1 ring-hairline transition-colors hover:bg-surface-3/40">
        <label
          id="save-card-label"
          htmlFor="save-card-toggle"
          className="flex-1 cursor-pointer select-none text-[14px] font-medium leading-5 text-foreground"
        >
          Save card for later
        </label>
        <Switch
          id="save-card-toggle"
          checked={isSaveCard}
          onCheckedChange={handleSaveCardChange}
          aria-labelledby="save-card-label"
        />
      </div>
    </form>
  )
}

function AmountPicker({
  amount,
  currency,
  error,
  onChange,
  direction = "deposit",
  minAmount = demoMin,
  maxAmount = demoMax,
  feeAwareMax,
  subline,
}: {
  amount: string
  currency: Currency
  error: string | null
  onChange: (value: string) => void
  direction?: TransactionDirection
  minAmount?: number
  maxAmount?: number
  feeAwareMax?: number
  subline?: ReactNode
}) {
  const numeric = Number(normalizeAmountInput(amount, CASHIER_LOCALE, currencyExponent(currency)) || "0")
  const amountId = direction === "withdrawal" ? "withdrawal-amount" : "deposit-amount"
  const label = direction === "withdrawal" ? "Withdrawal amount" : "Deposit amount"
  const effectiveMax = direction === "withdrawal" && feeAwareMax !== undefined ? Math.min(maxAmount, feeAwareMax) : maxAmount
  const presets = getValidAmountPresets(minAmount, effectiveMax)
  const hintText =
    subline ??
    (direction === "withdrawal"
      ? maxAmount > 0
        ? `Available ${formatMoney(maxAmount, currency, CASHIER_LOCALE)} · Minimum ${formatMoney(minAmount, currency, CASHIER_LOCALE)}`
        : "No balance available to withdraw"
      : `Min ${formatMoney(minAmount, currency, CASHIER_LOCALE)} · Max ${formatMoney(maxAmount, currency, CASHIER_LOCALE)}`)

  return (
    <div className="grid gap-2.5 rounded-card bg-surface-2 p-3.5 ring-1 ring-hairline">
      <div className="grid gap-1.5">
        <CurrencyAmountField
          id={amountId}
          label={label}
          value={amount}
          currency={currency}
          error={Boolean(error)}
          describedBy={error ? `${amountId}-error` : `${amountId}-hint`}
          onChange={onChange}
        />
        {error ? (
          <p id={`${amountId}-error`} className="text-[12px] leading-4 text-danger" role="alert">
            {error}
          </p>
        ) : (
          <p id={`${amountId}-hint`} className="text-[12px] leading-4 text-muted-foreground tabular-nums">
            {hintText}
          </p>
        )}
      </div>
      {direction === "withdrawal" && feeAwareMax !== undefined && (feeAwareMax >= minAmount ? <button type="button" onClick={() => onChange(feeAwareMax.toFixed(currencyExponent(currency)))} className="justify-self-start rounded text-[12px] font-medium leading-4 text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Use maximum {formatMoney(feeAwareMax, currency, CASHIER_LOCALE)}</button> : <p className="text-[12px] leading-4 text-muted-foreground">Your balance does not cover the minimum withdrawal and fee. Add funds to continue.</p>)}
      {presets.length > 0 && (
        <QuickAmounts
          amounts={presets}
          format={(value) => formatNumber(value, CASHIER_LOCALE)}
          value={presets.includes(numeric) ? numeric : null}
          surface="card"
          onSelect={(value) => onChange(String(value))}
        />
      )}
    </div>
  )
}

const withdrawalBanks = [
  { id: "mbank", name: "mBank" },
  { id: "ing", name: "ING Bank Śląski" },
  { id: "pkobp", name: "PKO Bank Polski" },
]

function detectCardBrand(digits: string) {
  if (digits.startsWith("4")) return "Visa"
  if (/^5[1-5]/.test(digits)) return "Mastercard"
  if (digits.length >= 4) {
    const prefix = Number(digits.slice(0, 4))
    if (prefix >= 2221 && prefix <= 2720) return "Mastercard"
  }
  return null
}

function maskIban(iban: string) {
  const clean = iban.replace(/\s/g, "").toUpperCase()
  if (clean.length < 8) return clean
  return `${clean.slice(0, 4)} •••• •••• ${clean.slice(-4)}`
}

function isValidIban(iban: string, plOnly = false) {
  const clean = iban.replace(/\s/g, "").toUpperCase()
  // PL: 28 chars PL+26d, DE: 22 chars DE+18d; then MOD-97 checksum
  const pattern = plOnly ? /^PL\d{26}$/ : /^(PL\d{26}|DE\d{18})$/
  if (!pattern.test(clean)) return false
  const rearranged = clean.slice(4) + clean.slice(0, 4)
  let remainder = 0n
  for (const ch of rearranged) {
    const code = /[0-9]/.test(ch) ? ch : String(ch.charCodeAt(0) - 55)
    for (const d of code) remainder = (remainder * 10n + BigInt(d)) % 97n
  }
  return remainder === 1n
}

/**
 * Payout card capture — only the number is needed to tokenize a destination.
 * CVC, expiry as auth and holder are deposit-only and are never collected
 * for an outgoing payout in iGaming.
 */
function PayoutCardFields({
  details,
  attempted,
  onChange,
}: {
  details: CardDetails
  attempted: boolean
  onChange: (field: keyof CardDetails, value: string) => void
}) {
  const numberValid = passesLuhn(details.number)
  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        <FloatingInput
          id="payout-card-number"
          label="Card number"
          inputMode="numeric"
          autoComplete="off"
          maxLength={19}
          error={attempted && !numberValid}
          aria-invalid={attempted && !numberValid}
          aria-describedby={attempted && !numberValid ? "payout-card-number-error" : "payout-card-hint"}
          value={details.number}
          onChange={(event) => onChange("number", formatCardNumber(event.target.value))}
        />
        <p id="payout-card-hint" className="text-xs leading-5 text-muted-foreground">The card must be in your name and verified. We store only the last 4 digits.</p>
        {attempted && !numberValid && (
          <p id="payout-card-number-error" className="text-xs text-danger" role="alert">Check your card number.</p>
        )}
      </div>
    </div>
  )
}

/**
 * Adds a payout destination. A withdrawal must name the account the money
 * leaves, so a saved card or account is picked first and the full details are
 * only typed once.
 */
function AddWithdrawalDestination({
  kind,
  cardDetails,
  onCardChange,
  attempted,
  bank,
  onBankChange,
  iban,
  onIbanChange,
  walletEmail,
  onWalletEmailChange,
  error,
  onSave,
  onCancel,
}: {
  kind: "card" | "bank" | "wallet"
  cardDetails: CardDetails
  onCardChange: (field: keyof CardDetails, value: string) => void
  attempted: boolean
  bank: string
  onBankChange: (value: string) => void
  iban: string
  onIbanChange: (value: string) => void
  walletEmail: string
  onWalletEmailChange: (value: string) => void
  error: string | null
  onSave: () => void
  onCancel: () => void
}) {
  const canSave =
    kind === "bank"
      ? Boolean(bank) && iban.trim().length > 0
      : kind === "wallet"
        ? walletEmail.trim().length > 0
        : cardDetails.number.replace(/\D/g, "").length >= 12

  return (
    <div className="grid gap-3">
      <p className="text-[14px] leading-5 text-muted-foreground">
        {kind === "card"
          ? "Withdrawals go to this card. It must be in your name and verified."
          : kind === "wallet"
            ? "Withdrawals go to this wallet. It must match the email you used to deposit."
            : "Withdrawals go to this account. It must be in your name."}
      </p>
      {kind === "card" ? (
        <PayoutCardFields details={cardDetails} attempted={attempted} onChange={onCardChange} />
      ) : kind === "wallet" ? (
        <>
          <div className="grid gap-2">
            <FloatingInput
              id="withdrawal-wallet"
              label="Wallet email"
              type="email"
              autoComplete="off"
              value={walletEmail}
              onChange={(event) => onWalletEmailChange(event.target.value)}
            />
            <p className="text-xs leading-5 text-muted-foreground">Must match the email you used to deposit.</p>
          </div>
        </>
      ) : (
        <>
          <SheetPickerField
            id="withdrawal-bank"
            label="Bank"
            sheetTitle="Choose your bank"
            placeholder="Choose your bank"
            value={bank}
            options={toIdBankPickerOptions(withdrawalBanks)}
            onChange={onBankChange}
          />
          <div className="grid gap-2">
            <FloatingInput
              id="withdrawal-iban"
              label="Account number (IBAN)"
              autoComplete="off"
              value={iban}
              onChange={(event) => onIbanChange(event.target.value)}
              inputClassName="font-mono text-[15px] uppercase"
            />
          </div>
        </>
      )}
      {error ? (
        <p className="text-[12px] leading-4 text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <div className="grid gap-2">
        <ActionButton disabled={!canSave} onClick={onSave}>Save {kind === "card" ? "card" : kind === "wallet" ? "wallet" : "account"}</ActionButton>
        <ActionButton variant="secondary" onClick={onCancel}>
          Cancel
        </ActionButton>
      </div>
    </div>
  )
}

export function MethodList({ methods: options, label, onSelect }: { methods: Method[]; label: string; onSelect: (id: string) => void }) {  return (
    <MethodGroup label={label}>
      {options.map((method) => (
        <MethodRow
          key={method.id}
          icon={<MethodMark method={method} />}
          title={method.name}
          description={method.detail}
          variant="navigate"
          onClick={() => onSelect(method.id)}
        />
      ))}
    </MethodGroup>
  )
}

function formatDepositCta(method: Method, formattedTotal: string | null) {
  if (method.flow === "wallet") {
    return `Continue to ${method.name}`
  }
  if (method.flow === "bank") {
    return "Continue"
  }
  return formattedTotal ? `Deposit ${formattedTotal}` : "Deposit"
}

function BlikOneClickActiveCard({
  surface = "bg-surface-2",
  onUseCodeInstead,
}: {
  surface?: string
  onUseCodeInstead?: () => void
}) {
  return (
    <div className={cn("flex items-start gap-3 rounded-card px-4 py-3.5 ring-1 ring-primary/50", surface)}>
      <SelectionIndicator selected className="mt-0.5" />
      <div className="grid min-w-0 flex-1 gap-1">
        <p className="text-[14px] font-medium leading-5 text-foreground">BLIK 1-Click active</p>
        <p className="text-[12px] leading-4 text-muted-foreground">Approve the push notification in your bank app — no 6-digit code needed.</p>
        {onUseCodeInstead && (
          <button
            type="button"
            onClick={onUseCodeInstead}
            className="mt-1.5 justify-self-start rounded text-[12px] font-medium leading-4 text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Use a 6-digit code instead
          </button>
        )}
      </div>
    </div>
  )
}

export function MethodDetails({
  method,
  amount,
  currency,
  amountError,
  cardDetails,
  cardAttempted,
  saveCard,
  onSaveCardChange,
  onAmountChange,
  onCardChange,
  blikCode, setBlikCode, bank, setBank,
  blikOneClick = false,
  onBlikOneClickChange,
  blikOneClickActive = false,
  onUseBlikCodeInstead,
  direction = "deposit",
  minAmount = demoMin,
  maxAmount = demoMax,
  methodMaxAmount = demoMax,
  feeRate,
  feeAwareMax,
}: {
  method: Method
  amount: string
  currency: Currency
  amountError: string | null
  cardDetails: CardDetails
  cardAttempted: boolean
  saveCard?: boolean
  onSaveCardChange?: (save: boolean) => void
  onAmountChange: (value: string) => void
  onCardChange: (field: keyof CardDetails, value: string) => void
  blikCode: string
  setBlikCode: (value: string) => void
  bank: string
  setBank: (value: string) => void
  blikOneClick?: boolean
  onBlikOneClickChange?: (value: boolean) => void
  blikOneClickActive?: boolean
  onUseBlikCodeInstead?: () => void
  direction?: TransactionDirection
  minAmount?: number
  maxAmount?: number
  methodMaxAmount?: number
  feeRate?: number
  feeAwareMax?: number
}) {
  const amounts = demoAmounts(amount, method, currency, minAmount, methodMaxAmount, feeRate)
  const isWithdrawal = direction === "withdrawal"
  const totalLine = amounts && amounts.fee !== null
    ? `Total deducted ${formatCurrency(amounts.deposit + amounts.fee, currency)}`
    : undefined
  const limitLine = `Limit: ${formatMoney(minAmount, currency, CASHIER_LOCALE)}–${formatMoney(methodMaxAmount, currency, CASHIER_LOCALE)}`
  return (
    <div className="grid gap-3">
      <AmountPicker
        amount={amount}
        currency={currency}
        error={amountError}
        onChange={onAmountChange}
        direction={direction}
        minAmount={minAmount}
        maxAmount={isWithdrawal ? maxAmount : Math.min(methodMaxAmount, maxAmount)}
        feeAwareMax={feeAwareMax}
        subline={isWithdrawal ? totalLine : limitLine}
      />
      {method.flow === "card" && (
        <CardFields details={cardDetails} attempted={cardAttempted} onChange={onCardChange} saveCard={saveCard} onSaveCardChange={onSaveCardChange} />
      )}
      {method.flow === "wallet" && (
        <div className="rounded-card bg-surface-2 p-3.5 ring-1 ring-hairline">
          <p className="text-[12px] leading-4 text-muted-foreground">
            You’ll continue to {method.name} to complete your {isWithdrawal ? "withdrawal" : "payment"}.
          </p>
        </div>
      )}
      {method.flow === "bank" && (
        <div className="grid gap-2.5 rounded-card bg-surface-2 p-3.5 ring-1 ring-hairline">
          <SheetPickerField
            id="bank-choice"
            label="Bank"
            sheetTitle="Choose your bank"
            placeholder="Choose your bank"
            value={bank}
            options={toBankPickerOptions(method.id === "p24" ? p24Banks : depositBanks)}
            onChange={setBank}
          />
          <p className="text-[12px] leading-4 text-muted-foreground">
            {method.id === "p24" ? `You’ll continue to Przelewy24${bank ? ` with ${bank}` : ""} to confirm your ${isWithdrawal ? "withdrawal" : "payment"}.` : `Continue to your bank to confirm your ${isWithdrawal ? "withdrawal" : "payment"}.`}
          </p>
        </div>
      )}
      {method.flow === "blik" && (
        blikOneClickActive ? (
          <BlikOneClickActiveCard onUseCodeInstead={onUseBlikCodeInstead} />
        ) : (
          <div className="grid gap-3">
            <div className="grid gap-2 rounded-card bg-surface-2 p-3.5 ring-1 ring-hairline">
              <CodeInput id="blik-code" label="6-digit BLIK code" aria-describedby="blik-code-hint" value={blikCode} onChange={setBlikCode} />
              <p id="blik-code-hint" className="text-[12px] leading-4 text-muted-foreground">Find the code in your banking app (valid for 2 minutes), then confirm the payment there.</p>
            </div>
            {amounts && amounts.deposit > 3000 && (
              <InlineNotice tone="neutral" title="Bank BLIK daily limit">
                Most Polish banks default to 1 000–3 000 PLN per day for BLIK. Raise your limit in your banking app or use Przelewy24 for larger amounts.
              </InlineNotice>
            )}
            {onBlikOneClickChange && (
              <div className="flex items-start justify-between gap-3 rounded-card bg-surface-2 px-4 py-3.5 ring-1 ring-hairline transition-colors hover:bg-surface-3/40">
                <label
                  id="blik-one-click-label"
                  htmlFor="blik-one-click-toggle"
                  className="grid flex-1 cursor-pointer select-none gap-0.5"
                >
                  <span className="text-[14px] font-medium leading-5 text-foreground">Remember for BLIK 1-Click</span>
                  <span className="text-[12px] leading-4 text-muted-foreground">Next time, just approve the push notification in your bank app — no 6-digit code needed.</span>
                </label>
                <Switch
                  id="blik-one-click-toggle"
                  checked={blikOneClick}
                  onCheckedChange={onBlikOneClickChange}
                  aria-labelledby="blik-one-click-label"
                  className="mt-0.5 shrink-0"
                />
              </div>
            )}
          </div>
        )
      )}
      {amounts && (
        <SummaryList variant="receipt">
          <SummaryRow label={isWithdrawal ? "You withdraw" : "You receive"} value={formatCurrency(amounts.deposit, currency)} />
          {isWithdrawal && <SummaryRow label="Destination" value={method.name} />}
          <SummaryRow
            label="Fee"
            value={amounts.fee === null ? "Determined by provider" : formatCurrency(amounts.fee, currency)}
            positive={amounts.fee === 0}
          />
          <SummaryRow label={isWithdrawal ? "Total deducted" : "Total to pay"} value={amounts.fee === null ? "Determined by provider" : formatCurrency(amounts.deposit + amounts.fee, currency)} emphasis />
        </SummaryList>
      )}
    </div>
  )
}

export function DirectionTabs({ mode, onChange, className }: { mode: Mode; onChange: (mode: Mode) => void; className?: string }) {
  const options = ["deposit", "withdrawal"] as const
  const onKey = (e: React.KeyboardEvent) => {
    const idx = options.indexOf(mode)
    if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); onChange(options[(idx + 1) % 2]) }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); onChange(options[(idx + 1) % 2]) }
  }
  return (
    <div role="radiogroup" aria-label="Cashier direction" onKeyDown={onKey} className={cn("relative grid w-full grid-cols-2 rounded-full bg-surface-2 p-1 ring-1 ring-hairline", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute bottom-1 left-1 top-1 w-[calc(50%-4px)] rounded-full bg-primary shadow-[var(--shadow-soft)] transition-transform duration-200 ease-out",
          mode === "withdrawal" ? "translate-x-full" : "translate-x-0",
        )}
      />
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={mode === option}
          tabIndex={mode === option ? 0 : -1}
          onClick={() => onChange(option)}
          className={cn(
            "relative z-10 h-9 min-w-0 truncate rounded-full px-4 text-[14px] font-semibold leading-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            mode === option ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option === "deposit" ? "Deposit" : "Withdraw"}
        </button>
      ))}
    </div>
  )
}

export function CategoryTabs({ category, onChange }: { category: Category; onChange: (category: Category) => void }) {
  const options = ["fiat", "crypto"] as const
  const onKey = (e: React.KeyboardEvent) => {
    const idx = options.indexOf(category)
    if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); onChange(options[(idx + 1) % 2]) }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); onChange(options[(idx + 1) % 2]) }
  }
  return (
    <div role="radiogroup" aria-label="Deposit type" onKeyDown={onKey} className="relative grid w-full grid-cols-2 rounded-full bg-surface-2 p-1 ring-1 ring-hairline">
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute bottom-1 left-1 top-1 w-[calc(50%-4px)] rounded-full bg-primary shadow-[var(--shadow-soft)] transition-transform duration-200 ease-out",
          category === "crypto" ? "translate-x-full" : "translate-x-0",
        )}
      />
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={category === option}
          tabIndex={category === option ? 0 : -1}
          onClick={() => onChange(option)}
          className={cn(
            "relative z-10 h-9 rounded-full px-4 text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            category === option ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option === "fiat" ? "Cash" : "Crypto"}
        </button>
      ))}
    </div>
  )
}

function CancelDepositAction({
  onCheck,
  onConfirm,
  locale = "en-GB",
  visible = true,
  direction = "deposit",
  amountLabel,
  destinationLabel,
  compact = false,
}: {
  onCheck: () => Promise<boolean>
  onConfirm: () => Promise<boolean>
  locale?: CashierLocale
  visible?: boolean
  direction?: TransactionDirection
  amountLabel?: string
  destinationLabel?: string
  compact?: boolean
}) {
  const copy = blikCopy[locale]
  const isWithdrawal = direction === "withdrawal"
  const [open, setOpen] = useState(false)
  const [checking, setChecking] = useState(false)
  const [canCancel, setCanCancel] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [error, setError] = useState(false)
  const start = async () => {
    setChecking(true)
    setCanCancel(false)
    setError(false)
    setOpen(true)
    try { setCanCancel(await onCheck()) } catch { setCanCancel(false) }
    finally { setChecking(false) }
  }
  const close = () => {
    if (canceling) return
    setOpen(false)
  }
  const confirm = async () => {
    setCanceling(true)
    setError(false)
    try {
      if (await onConfirm()) setOpen(false)
      else setError(true)
    } catch { setError(true) }
    finally { setCanceling(false) }
  }
  const openLabel = isWithdrawal ? "Cancel withdrawal" : copy.cancelOpen
  const title = checking
    ? copy.cancelChecking
    : canCancel
      ? isWithdrawal
        ? "Cancel this withdrawal?"
        : copy.cancelTitle
      : isWithdrawal
        ? "Already sent to your bank"
        : copy.cancelBlocked
  const body = checking
    ? copy.cancelCheckingBody
    : canCancel
      ? isWithdrawal
        ? `${amountLabel ?? "The withdrawal"} has not been dispatched to ${destinationLabel ?? "your bank"} yet. Canceling returns the full amount immediately to your balance.`
        : copy.cancelBody
      : isWithdrawal
        ? "The bank transfer is already in transit and can no longer be canceled here."
        : copy.cancelBlockedBody
  const confirmLabel = isWithdrawal ? "Yes, cancel & return funds" : copy.cancelOpen
  const keepLabel = isWithdrawal ? "Keep waiting" : copy.cancelKeep

  return <>
    {visible && (
      <ActionButton
        variant="secondary"
        size="md"
        className={compact ? "px-3 text-[13px]" : undefined}
        onClick={start}
      >
        {openLabel}
      </ActionButton>
    )}
    <CashierSheet open={open} title={title} onClose={close}>
      <p className="text-[14px] leading-5 text-muted-foreground">{body}</p>
      {error && <InlineNotice tone="danger" title={copy.cancelError} className="mt-3" />}
      <div className="mt-5 grid gap-2">
        <ActionButton loading={checking} loadingLabel={copy.cancelChecking} disabled={checking || canceling} onClick={close}>{checking || canCancel ? keepLabel : copy.cancelGotIt}</ActionButton>
        {canCancel && <ActionButton variant="danger" loading={canceling} loadingLabel={copy.cancelProgress} disabled={checking || canceling} onClick={confirm}>{confirmLabel}</ActionButton>}
      </div>
    </CashierSheet>
  </>
}

function ExtendableStatusBar({
  title,
  ringTone,
  timeline,
  reference,
  cancelable,
  direction = "deposit",
  amountLabel,
  destinationLabel,
  expanded: controlledExpanded,
  onExpandChange,
  onOpenFull,
  onCancel,
  onCheckCancel,
  onContactSupport,
  mode = "status",
  className,
}: {
  title: string
  ringTone: "warning" | "success" | "error" | "neutral"
  timeline: ReactNode
  reference?: string
  cancelable?: boolean
  direction?: TransactionDirection
  amountLabel?: string
  destinationLabel?: string
  expanded?: boolean
  onExpandChange?: (open: boolean) => void
  onOpenFull?: () => void
  onCancel?: () => Promise<boolean>
  onCheckCancel?: () => Promise<boolean>
  onContactSupport?: () => void
  mode?: "home" | "status"
  className?: string
}) {
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState(false)
  const expanded = controlledExpanded ?? uncontrolledExpanded
  const toggleExpanded = () => {
    const next = !expanded
    if (controlledExpanded === undefined) setUncontrolledExpanded(next)
    onExpandChange?.(next)
  }
  const ringClass =
    ringTone === "success"
      ? "border-success"
      : ringTone === "error"
        ? "border-danger"
        : ringTone === "warning"
          ? "border-warning"
          : "border-muted-foreground"

  return (
    <div
      className={cn(
        "overflow-hidden rounded-card bg-surface-2 ring-1 ring-hairline transition-colors",
        className,
      )}
    >
      <button
        type="button"
        aria-expanded={expanded}
        onClick={toggleExpanded}
        className="w-full px-4 py-3.5 text-left transition-colors hover:bg-surface-3/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-3">
            <span
              className={cn("size-4 shrink-0 rounded-full border-[3px]", ringClass)}
              aria-hidden="true"
            />
            <span className="truncate text-[14px] font-semibold leading-5 text-foreground">{title}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-primary">
            <span>{expanded ? "Hide" : "Details"}</span>
            <ChevronDown
              className={cn("size-4 transition-transform duration-150", expanded && "rotate-180")}
              aria-hidden="true"
            />
          </span>
        </div>
      </button>

      {expanded ? (
        <div className="space-y-3 border-t border-hairline px-4 pb-4 pt-3">
          {timeline}
          {mode === "home" && (
            <>
              {(reference || onOpenFull) && (
                <div className="flex items-center justify-between gap-3 border-t border-hairline pt-2.5 text-[12px]">
                  {reference ? (
                    <span className="truncate text-muted-foreground">
                      Ref <span className="font-mono text-foreground">{reference}</span>
                    </span>
                  ) : (
                    <span />
                  )}
                  {onOpenFull ? (
                    <button
                      type="button"
                      onClick={onOpenFull}
                      className="inline-flex shrink-0 items-center gap-1 font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span>Full receipt</span>
                      <ArrowUpRight className="size-3.5" aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
              )}
              {(cancelable && onCancel && onCheckCancel) || onContactSupport ? (
                <div className={cn("grid gap-2", cancelable && onCancel && onCheckCancel && onContactSupport ? "grid-cols-2" : "grid-cols-1")}>
                  {cancelable && onCancel && onCheckCancel && (
                    <CancelDepositAction
                      visible
                      compact
                      direction={direction}
                      amountLabel={amountLabel}
                      destinationLabel={destinationLabel}
                      onCheck={onCheckCancel}
                      onConfirm={onCancel}
                    />
                  )}
                  {onContactSupport && (
                    <SupportButton label="Support" variant="secondary" size="sm" onClick={onContactSupport} />
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}

type CopyReferenceCopy = {
  reference: string
  copyReference: string
  copiedReference: string
  copyFailed: string
}

function CopyReference({ reference, copy, className, inline = false }: { reference: string; copy: CopyReferenceCopy; className?: string; inline?: boolean }) {
  const [copyStatus, setCopyStatus] = useState("")
  const copied = copyStatus === copy.copiedReference
  const button = <button type="button" aria-label={copy.copyReference} onClick={async () => {
    try {
      await navigator.clipboard.writeText(reference)
      setCopyStatus(copy.copiedReference)
      window.setTimeout(() => setCopyStatus(""), 2000)
    } catch { setCopyStatus(copy.copyFailed) }
  }} className={cn("flex shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-3 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95", inline ? "size-8" : "size-11")}>
    {copied ? <Check className="size-4 text-success" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
  </button>
  if (inline) return <span className={cn("flex min-w-0 items-center gap-1", className)}>
    <span className="font-mono text-[12px] leading-4 text-foreground">{reference}</span>
    {button}
    <span role="status" className="sr-only">{copyStatus}</span>
  </span>
  return <div className={cn("grid gap-1", className)}>
    <span className="text-[12px] leading-4 text-muted-foreground">{copy.reference}</span>
    <span className="flex min-w-0 items-center gap-2">
      <span className="min-w-0 flex-1 break-all font-mono text-[12px] leading-4 text-foreground">{reference}</span>
      {button}
    </span>
    <span role="status" className="sr-only">{copyStatus}</span>
  </div>
}

type WithdrawalStepState = "complete" | "current" | "failed" | "canceled" | "expired" | "unreached" | "upcoming"

function WithdrawalTimeline({ status, flow }: { status: Exclude<PaymentStatus, "idle">; flow?: PaymentFlow }) {
  const completed = status === "success"
  const failed = status === "failed"
  const canceled = status === "canceled"
  const expired = status === "expired"
  const terminal = failed || canceled || expired
  const currentIndex = completed ? 2 : 1
  const startedDetail = flow === "crypto" ? "We sent the withdrawal request to the network." : flow === "card" ? "We sent the withdrawal to your card provider." : "We sent the transfer request to your bank."
  const confirmedDetail = flow === "crypto" ? "The network confirmed the transfer." : flow === "card" ? "Confirmed by your card provider." : "The transfer arrived."
  const pendingDetail = flow === "crypto" ? "Waiting for network confirmation." : flow === "card" ? "Waiting for your card provider to confirm." : "Waiting for the transfer to arrive."
  const deductionDetail = "Released automatically if the transfer fails."
  const steps = [
    { title: "Withdrawal started", detail: startedDetail },
    {
      title: completed ? "Confirmed" : canceled ? "Canceled" : failed ? "Failed" : expired ? "Expired" : status === "unknown" ? "Checking" : "Awaiting confirmation",
      detail: completed ? confirmedDetail : canceled ? "Before the provider confirmed it." : failed ? "Something went wrong on our side." : expired ? "No confirmation before the request expired." : status === "unknown" ? "Waiting for the provider's answer." : pendingDetail,
    },
    { title: completed ? "Deducted from balance" : terminal ? "Not deducted" : "Reserved from balance", detail: completed ? "Your withdrawal is complete." : terminal ? undefined : deductionDetail },
  ]
  return <ol className="grid" aria-label="Withdrawal status">{steps.map((step, index) => {
    const state: WithdrawalStepState = completed
      ? "complete"
      : index < currentIndex
        ? "complete"
        : index === currentIndex
          ? failed
            ? "failed"
            : canceled
              ? "canceled"
              : expired
                ? "expired"
                : "current"
          : terminal
            ? "unreached"
            : "upcoming"
    return <DepositTimelineStep key={step.title} title={step.title} detail={step.detail} state={state} current={state === "current"} connector={index < steps.length - 1} connectorComplete={completed || (!terminal && index < currentIndex)} mutedComplete={terminal && index < currentIndex} />
  })}</ol>
}

export function PaymentStatusPanel({
  status,
  method,
  amount,
  currency,
  onChooseAnother,
  delayed = false,
  onViewTransactions,
  onContactSupport,
  transaction,
  onCancel,
  onCheckCancel,
  locale = "en-GB",
  showActions = true,
  direction = "deposit",
}: {
  status: Exclude<PaymentStatus, "idle">
  method: Method | undefined
  amount: number
  currency: Currency
  onChooseAnother: () => void
  delayed?: boolean
  onViewTransactions?: () => void
  onContactSupport?: () => void
  transaction?: Transaction
  onCancel?: () => Promise<boolean>
  onCheckCancel?: () => Promise<boolean>
  locale?: CashierLocale
  showActions?: boolean
  direction?: TransactionDirection
}) {
  const copy = blikCopy[locale]
  const isWithdrawal = direction === "withdrawal"
  const headingRef = useRef<HTMLHeadingElement>(null)
  const charged = transaction?.chargeState === "charged"
  const settledWithoutCharge = status === "canceled" || status === "expired" || status === "failed"
  const reassurance = isWithdrawal
    ? undefined
    : settledWithoutCharge && transaction?.chargeState === "not_charged"
      ? "Nothing was charged."
      : undefined
  const failedBody = charged
    ? "This payment may have been charged. Check your banking app or contact support."
    : transaction?.declineReason === "bank"
      ? copy.declinedBankBody
      : transaction?.declineReason === "funds"
        ? copy.declinedFundsBody
        : copy.failedGenericBody
  const content = isWithdrawal
    ? {
        pending: {
          title: "Withdrawal pending",
          emphasis: "We're sending your money.",
          description:
            method?.flow === "crypto"
              ? "The transfer is on its way. You can leave this screen and check History later."
              : method?.flow === "card"
                ? "Waiting for your card provider to confirm. You can leave this screen and check History later."
                : "Waiting for your bank to confirm. You can leave this screen and check History later.",
        },
        success: {
          title: "Withdrawal successful",
          emphasis: undefined,
          description: transaction?.eta ? `Arrives in ${transaction.eta.toLowerCase()}.` : undefined,
        },
        failed: {
          title: "Withdrawal failed",
          emphasis: reassurance,
          description:
            transaction?.declineReason === "provider"
              ? "Our provider couldn't complete this payout. Contact support so we can help."
              : transaction?.declineReason === "card"
                ? "This card can't receive payouts. Withdraw with another method."
                : "Your funds are back in your balance. Choose another withdrawal method.",
        },
        canceled: {
          title: "Withdrawal canceled",
          emphasis: reassurance,
          description: "You can start a new withdrawal anytime.",
        },
        expired: {
          title: "Withdrawal expired",
          emphasis: reassurance,
          description: "The provider didn't confirm in time. Try again or choose another method.",
        },
        unknown: {
          title: "Checking withdrawal",
          emphasis: undefined,
          description: "Waiting for the provider's answer.",
        },
      }[status]
    : {
        pending: {
          title: delayed ? copy.delayedTitle : copy.pendingTitle,
          emphasis: !delayed && transaction?.chargeState === "not_charged" ? copy.pendingBody : undefined,
          description: delayed ? (method?.flow === "blik" ? copy.delayedBody : "Still waiting on your provider. Don't pay again — check History later.") : method?.flow === "card" ? "Approve 3D Secure in your banking app." : method?.flow === "bank" || method?.flow === "wallet" ? "Complete confirmation in your provider's app." : undefined,
        },
        success: {
          title: copy.successTitle,
          emphasis: undefined,
          description: undefined,
        },
        failed: {
          title: copy.failedTitle,
          emphasis: reassurance,
          description: failedBody,
        },
        canceled: {
          title: copy.canceledTitle,
          emphasis: reassurance,
          description: copy.canceledBody,
        },
        expired: {
          title: copy.expiredTitle,
          emphasis: reassurance,
          description: method?.flow === "blik" ? copy.expiredBody : "The provider didn't confirm in time. Try again or choose another method.",
        },
        unknown: {
          title: copy.checkingTitle,
          emphasis: undefined,
          description: method?.flow === "blik" ? copy.checkingBody : "Waiting for your provider. Don't pay again — we'll update this automatically.",
        },
      }[status]
  const headingTone = status === "success" ? "success" : status === "failed" ? "error" : status === "canceled" || status === "expired" ? "neutral" : "warning"
  // The fee row is always shown when the transaction is known: the fee was
  // quoted before commit, so hiding it afterwards reads as if the fee
  // disappeared. Label and value only — no detail line, so the receipt
  // stays compact and every state renders the same shape.


  const isBlikCountdown = !isWithdrawal && method?.flow === "blik" && status === "pending" && !delayed
  const [blikSecondsLeft, setBlikSecondsLeft] = useState(120)
  const blikDeadlineRef = useRef<{ id: number | undefined; deadline: number }>({ id: undefined, deadline: 0 })

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [status])

  useEffect(() => {
    if (!isBlikCountdown) return
    if (blikDeadlineRef.current.id !== transaction?.id) {
      blikDeadlineRef.current = { id: transaction?.id, deadline: Date.now() + 120_000 }
    }
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((blikDeadlineRef.current.deadline - Date.now()) / 1000))
      setBlikSecondsLeft(remaining)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [isBlikCountdown, transaction?.id])

  const blikCountdownFormatted = `${String(Math.floor(blikSecondsLeft / 60)).padStart(2, "0")}:${String(blikSecondsLeft % 60).padStart(2, "0")}`
  const showHeroAmount = status === "pending" || status === "success" || status === "unknown"
  const formattedHero = formatCurrency(amount, currency)
  const heroSplit = /^([\d\s.,\u00a0\u202f]+)\s*([A-Z]{2,5})$/.exec(formattedHero)
  const heroNumber = heroSplit ? heroSplit[1].trim() : formattedHero
  const heroCurrency = heroSplit ? heroSplit[2] : currency
  const destinationDisplay = isWithdrawal
    ? method?.flow === "crypto"
      ? transaction?.destination
        ? shortenAddress(transaction.destination)
        : "—"
      : transaction?.destination ?? method?.name ?? "—"
    : method?.name ?? "—"

  const accordionTitle = isWithdrawal
    ? {
        pending: transaction?.cancelable ? "Reviewing · cancelable" : "Awaiting confirmation",
        success: transaction?.destination ? `Sent to ${transaction.destination}` : "Payout completed",
        failed: "Payout not completed",
        canceled: "Canceled before payout",
        expired: "Confirmation timed out",
        unknown: "Waiting for provider",
      }[status]
    : {
        pending: delayed ? "Checking with provider" : method?.flow === "blik" ? "Waiting for bank approval" : "Awaiting confirmation",
        success: "Added to your balance",
        failed: transaction?.declineReason === "bank" ? "Declined by your bank" : transaction?.declineReason === "funds" ? "Not enough funds" : "Payment not completed",
        canceled: "Canceled before confirmation",
        expired: "Confirmation timed out",
        unknown: "Waiting for provider",
      }[status]

  const isFailedOrCanceled = status === "failed" || status === "canceled" || status === "expired"
  const headingEmphasis =
    content.emphasis ??
    (isWithdrawal && isFailedOrCanceled ? `${formattedHero} returned to your balance.` : undefined)

  return (
    <div className="grid gap-4">
      <div className="flex flex-col items-center pt-1 text-center">
        {showHeroAmount ? (
          <>
            <StatusHeading
              headingRef={headingRef}
              tone={headingTone}
              title={content.title}
              icon={status === "pending" || status === "unknown" ? Clock : undefined}
            />
            <p className="mt-2 font-display text-[32px] font-bold leading-10 tracking-[-0.02em] tabular-nums text-foreground">
              {!isWithdrawal && status === "success" ? "+" : ""}
              {heroNumber}{" "}
              <span className="text-[22px] font-semibold text-muted-foreground">{heroCurrency}</span>
            </p>
            {isBlikCountdown ? (
              <p className="mt-1.5 text-[13px] leading-5 text-muted-foreground">
                Open your banking app to approve ·{" "}
                <span className="font-semibold text-foreground tabular-nums">{blikCountdownFormatted}</span>
              </p>
            ) : isWithdrawal && status === "pending" && transaction?.eta ? (
              <p className="mt-1.5 text-[13px] leading-5 text-muted-foreground">
                Arrives in {transaction.eta.toLowerCase()}
              </p>
            ) : status === "success" ? (
              <p className="mt-1.5 text-[13px] font-medium leading-5 text-success">
                {isWithdrawal ? `Sent to ${destinationDisplay}` : "Added to your balance"}
              </p>
            ) : content.description ? (
              <p className="mt-1.5 max-w-[30ch] text-[13px] leading-5 text-muted-foreground">{content.description}</p>
            ) : null}
          </>
        ) : (
          <StatusHeading
            headingRef={headingRef}
            tone={headingTone}
            title={content.title}
            emphasis={headingEmphasis}
            description={content.description ?? undefined}
            icon={status === "canceled" ? CircleX : status === "expired" ? Clock : undefined}
            className="gap-3"
          />
        )}
      </div>

      {!isWithdrawal && charged && <InlineNotice tone="warning" title={copy.chargedWarningTitle}>{copy.chargedWarningBody}</InlineNotice>}

      <ExtendableStatusBar
        mode="status"
        title={accordionTitle}
        ringTone={headingTone}
        timeline={
          isWithdrawal ? (
            <WithdrawalTimeline status={status} flow={method?.flow} />
          ) : (
            <DepositTimeline kind="fiat" status={status} method={method?.name} flow={method?.flow as "card" | "wallet" | "bank" | "blik" | undefined} declineReason={transaction?.declineReason} chargeState={transaction?.chargeState} locale={locale} delayed={delayed} />
          )
        }
      />

      <SummaryList>
        {isFailedOrCanceled && (
          <>
            <SummaryRow
              label="Attempted"
              value={formattedHero}
              valueClassName="text-muted-foreground line-through"
            />
            <SummaryRow
              label={isWithdrawal ? "Balance" : "Charged"}
              value={
                isWithdrawal
                  ? "Returned to balance"
                  : charged
                    ? formattedHero
                    : formatCurrency(0, currency)
              }
              emphasis
            />
          </>
        )}
        <SummaryRow
          label={isWithdrawal ? "Destination" : copy.method}
          value={destinationDisplay}
        />
        {isWithdrawal && !isFailedOrCanceled && transaction?.eta && <SummaryRow label="Arrives" value={transaction.eta} />}
        {isWithdrawal && method?.flow === "crypto" && transaction?.network && <SummaryRow label="Network" value={transaction.network} />}
        {isWithdrawal && method?.flow === "crypto" && transaction?.asset && <SummaryRow label="Asset" value={transaction.asset} />}
        {transaction && !isFailedOrCanceled && (
          <SummaryRow
            label="Fee"
            value={transaction.fee === null || transaction.fee === undefined ? "Determined by provider" : formatCurrency(transaction.fee, currency)}
          />
        )}
        {transaction && <SummaryRow label={copy.date} value={formatTransactionDate(transaction.createdAt, locale)} />}
        {!isWithdrawal && status === "pending" && transaction?.expiresAt && <SummaryRow label="Expires" value={formatTransactionDate(transaction.expiresAt, locale)} />}
        {transaction && <SummaryRow label={copy.reference} value={<CopyReference inline reference={transaction.reference} copy={copy} />} />}
      </SummaryList>

      {showActions && status === "pending" && (
        <div className="grid gap-2">
          {(transaction?.cancelable && onCancel && onCheckCancel) || onContactSupport ? (
            <div className={cn("grid gap-2", transaction?.cancelable && onCancel && onCheckCancel && onContactSupport ? "grid-cols-2" : "grid-cols-1")}>
              {transaction?.cancelable && onCancel && onCheckCancel && (
                <CancelDepositAction
                  visible
                  compact
                  direction={direction}
                  amountLabel={formattedHero}
                  destinationLabel={destinationDisplay}
                  onCheck={onCheckCancel}
                  onConfirm={onCancel}
                  locale={locale}
                />
              )}
              {onContactSupport && (
                <SupportButton
                  label={copy.contactSupport}
                  variant="secondary"
                  size="md"
                  className={transaction?.cancelable && onCancel && onCheckCancel ? "gap-1.5 px-3 text-[13px]" : undefined}
                  onClick={onContactSupport}
                />
              )}
            </div>
          ) : null}
          {status === "pending" && delayed && transaction && onViewTransactions && (
            <ActionButton variant="secondary" onClick={onViewTransactions}>{copy.viewTransaction}</ActionButton>
          )}
        </div>
      )}
      {showActions && (status === "success" || status === "unknown") && transaction && onViewTransactions && <ActionButton variant="secondary" onClick={onViewTransactions}>{copy.viewTransaction}</ActionButton>}
      {showActions && status === "success" && <ActionButton variant="ghost" onClick={onChooseAnother}>{isWithdrawal ? "Make another withdrawal" : copy.anotherDeposit}</ActionButton>}
      {showActions && isFailedOrCanceled && <ActionButton variant="secondary" onClick={onChooseAnother}>{copy.chooseMethod}</ActionButton>}
      {showActions && (status === "failed" || status === "expired") && onContactSupport && <SupportButton label={copy.contactSupport} variant="ghost" size="sm" onClick={onContactSupport} />}
    </div>
  )
}

export default function App({ initialCategory = "fiat", initialMethod = null, initialStatus = "idle", initialDelayed = false, initialChargeState, initialDeclineReason, initialTransactions, initialView = "deposit", initialHistoryState = "ready", initialDetailTransaction = null, initialCryptoExpanded = false, cryptoPreview = true, initialCryptoTransfer, initialCryptoBalance, initialMode = "deposit", bonusOffer, initialBonusOptedIn = true, activeBonus, licenseMode, kycStatus = "verified", initialKycStep, dailyDepositLimit, onBonusOptInChange, onBonusTerms, onReturnToGame, onContactSupport, onCancelDeposit, onCheckCancelDeposit }: { initialCategory?: Category; initialMethod?: string | null; initialStatus?: PaymentStatus; initialDelayed?: boolean; initialChargeState?: Transaction["chargeState"]; initialDeclineReason?: Transaction["declineReason"]; initialTransactions?: Transaction[]; initialView?: "deposit" | "transactions"; initialHistoryState?: "ready" | "loading" | "error"; initialDetailTransaction?: number | null; initialCryptoExpanded?: boolean; cryptoPreview?: boolean; initialCryptoTransfer?: CryptoTransfer; initialCryptoBalance?: string; initialMode?: Mode; bonusOffer?: BonusOffer | null; initialBonusOptedIn?: boolean; activeBonus?: ActiveBonus; licenseMode?: LicenseMode; kycStatus?: KycStatus; initialKycStep?: KycStep; dailyDepositLimit?: number; onBonusOptInChange?: (optedIn: boolean) => void; onBonusTerms?: () => void; onReturnToGame?: () => void; onContactSupport?: (context: SupportContext) => void; onCancelDeposit?: (transaction: Transaction) => Promise<boolean>; onCheckCancelDeposit?: (transaction: Transaction) => Promise<Transaction> } = {}) {
  void initialCryptoBalance
  const effectiveLicenseMode: LicenseMode = licenseMode ?? (
    initialCategory === "crypto" ||
    initialMethod === "withdraw-crypto" ||
    initialMethod === "paysafecard" ||
    initialMethod === "trustly" ||
    initialMethod === "skrill" ||
    initialMethod === "neteller" ||
    ((initialMode === "withdrawal" || initialStatus !== "idle") && initialMethod === "card")
      ? "international"
      : "pl-licensed"
  )
  const [kycState, setKycState] = useState<KycStatus>(kycStatus)
  const [kycFlowOpen, setKycFlowOpen] = useState(Boolean(initialKycStep))
  const [responsiblePlayOpen, setResponsiblePlayOpen] = useState(false)
  const [kycSubmission, setKycSubmission] = useState<KycSubmission | null>(null)
  const [blikOneClick, setBlikOneClick] = useState(false)
  const [blikOneClickSaved, setBlikOneClickSaved] = useState(false)
  const [useBlikCodeOnce, setUseBlikCodeOnce] = useState(false)
  const blikOneClickReady = blikOneClickSaved && !useBlikCodeOnce
  const [category, setCategory] = useState<Category>(effectiveLicenseMode === "pl-licensed" ? "fiat" : initialCategory)
  const [mode, setMode] = useState<Mode>(initialMethod?.startsWith("withdraw-") ? "withdrawal" : initialMode)
  const [headerScrolled, setHeaderScrolled] = useState(false)
  const [heroBalanceScrolled, setHeroBalanceScrolled] = useState(false)
  const resetScrollFlags = () => {
    setHeaderScrolled(false)
    setHeroBalanceScrolled(false)
  }
  const onContentScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const top = event.currentTarget.scrollTop
    setHeaderScrolled(top > 4)
    setHeroBalanceScrolled(top > 40)
  }
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [savedCryptoAddresses, setSavedCryptoAddresses] = useState<SavedCryptoAddress[]>([
    { id: "addr-1", name: "Personal", asset: "USDT", network: "Tron (TRC20)", address: "TX7qY9wK3vR8mN2sL5pX1cD4eF6gH9jB0k" },
  ])
  const [savedDestinations, setSavedDestinations] = useState<WithdrawalDestination[]>([
    { id: "dest-card-1", methodId: "card", title: "Visa •••• 4242", subtitle: "Anna Kowalska" },
    { id: "dest-elixir-1", methodId: "express-elixir", title: "mBank", subtitle: "PL61 •••• •••• 2874" },
    { id: "dest-bank-1", methodId: "bank-transfer", title: "mBank", subtitle: "PL61 •••• •••• 2874" },
  ])
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(null)
  const [addingDestination, setAddingDestination] = useState(false)
  const [destinationError, setDestinationError] = useState<string | null>(null)
  const [iban, setIban] = useState("")
  const [walletEmail, setWalletEmail] = useState("")
  const [failingCard, setFailingCard] = useState(false)
  const region: Region = "PL"
  const [currency, setCurrency] = useState<Currency>("PLN")
  const [blikCode, setBlikCode] = useState(initialMethod === "blik" ? sampleBlikCode : "")
  const [bank, setBank] = useState("")
  const [network, setNetwork] = useState("Tron (TRC20)")
  const [selected, setSelected] = useState<string | null>(initialMethod)
  const [isOpen, setIsOpen] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(initialStatus)
  const [view, setView] = useState<"deposit" | "transactions">(initialView)
  const [historyState, setHistoryState] = useState<"ready" | "loading" | "error">(initialHistoryState)
  const hasInitialTransaction = initialStatus !== "idle"
  const [transactions, setTransactions] = useState<Transaction[]>(() => initialTransactions ?? (hasInitialTransaction ? [{ id: 1, reference: "TXN-4F82B1C9", createdAt: "2026-11-07T18:00:00Z", method: initialMethod === "card" ? "Card" : "BLIK", amount: 50, fee: 0, currency: "PLN", status: initialStatus as Exclude<PaymentStatus, "idle">, delayed: initialDelayed, chargeState: initialChargeState, declineReason: initialDeclineReason, cancelable: initialStatus === "pending" && Boolean(onCancelDeposit && onCheckCancelDeposit) }] : []))
  const transactionsRef = useRef(transactions)
  useEffect(() => { transactionsRef.current = transactions }, [transactions])
  const balance = transactions
    .filter((transaction) => transaction.currency === currency)
    .reduce((total, transaction) => {
      // iGaming: pending withdrawals lock the funds immediately.
      const locked = transaction.direction === "withdrawal" && (transaction.status === "pending" || transaction.status === "unknown")
      const settled = transaction.status === "success"
      if (transaction.direction === "withdrawal") {
        if (settled || locked) return total - transaction.amount - (transaction.fee ?? 0)
        return total
      }
      return settled ? total + transaction.amount : total
    }, 0)
  const [activeTransaction, setActiveTransaction] = useState<number | null>(hasInitialTransaction ? 1 : null)
  const [detailTransaction, setDetailTransaction] = useState<number | null>(initialDetailTransaction)
  const [cryptoExpanded, setCryptoExpanded] = useState(initialCryptoExpanded)
  const activeTransactionRef = useRef<number | null>(hasInitialTransaction ? 1 : null)
  // The ref mirrors the state so the provider callbacks always read the
  // transaction that is actually running, never a stale closure.
  useEffect(() => { activeTransactionRef.current = activeTransaction }, [activeTransaction])
  const nextTransactionId = useRef(Math.max(hasInitialTransaction ? 1 : 0, ...(initialTransactions ?? []).map((transaction) => transaction.id)))
  const paymentTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())
  useEffect(() => {
    const timers = paymentTimers.current
    return () => {
      timers.forEach((timer) => clearTimeout(timer))
      timers.clear()
    }
  }, [])
  const [supportContext, setSupportContext] = useState<SupportContext | null>(null)
  const [supportSent, setSupportSent] = useState(false)
  const [homeToast, setHomeToast] = useState<string | null>(null)
  const showToast = (message: string) => {
    setHomeToast(message)
    window.setTimeout(() => {
      setHomeToast((current) => (current === message ? null : current))
    }, 3000)
  }
  const triggerSupport = (context: SupportContext) => {
    if (onContactSupport) {
      onContactSupport(context)
      return
    }
    setSupportSent(false)
    setSupportContext(context)
  }
  // Provider deadlines: pending deposits with `expiresAt` flip to "expired"
  // on their own when the deadline passes; the live countdown UI lives in PaymentStatusPanel.
  const hasExpiring = transactions.some((transaction) => transaction.status === "pending" && transaction.expiresAt)
  useEffect(() => {
    if (!hasExpiring) return
    const interval = window.setInterval(() => {
      const now = Date.now()
      const due = transactionsRef.current.filter((transaction) => transaction.status === "pending" && transaction.expiresAt && Date.parse(transaction.expiresAt) <= now)
      if (due.length === 0) return
      const dueIds = due.map((transaction) => transaction.id)
      setTransactions((current) => current.map((transaction) => dueIds.includes(transaction.id) && transaction.status === "pending" ? { ...transaction, status: "expired", cancelable: false } : transaction))
      if (activeTransactionRef.current !== null && dueIds.includes(activeTransactionRef.current)) setPaymentStatus("expired")
    }, 1000)
    return () => window.clearInterval(interval)
  }, [hasExpiring])
  const [amount, setAmount] = useState(initialMode === "withdrawal" || initialMethod?.startsWith("withdraw-") ? "" : "100")
  const [cardDetails, setCardDetails] = useState<CardDetails>(emptyCard)
  const [cardAttempted, setCardAttempted] = useState(false)
  const [saveCard, setSaveCard] = useState(false)
  // Repeat deposit: one recent card expands inline with its secret
  // field (CVC / BLIK code / bank) and the deposit button.
  const [repeatForm, setRepeatForm] = useState<{ id: number; cvc: string; code: string; bank: string; amount: string; attempted: boolean } | null>(null)
  const successfulDeposits = transactions.filter(
    (transaction) => transaction.direction !== "withdrawal" && transaction.status === "success",
  )
  /** Same-method rule: only methods the player actually deposited with are eligible. */
  const usedWithdrawalMethods = new Set(
    successfulDeposits
      .map((transaction) => withdrawalMethodIdByDepositName[transaction.method])
      .filter((id): id is string => Boolean(id)),
  )
  if (initialCryptoTransfer?.status === "credited") usedWithdrawalMethods.add("withdraw-crypto")
  const hasSuccessfulDeposit =
    successfulDeposits.length > 0 || initialCryptoTransfer?.status === "credited"
  const availableMethods =
    mode === "withdrawal"
      ? effectiveLicenseMode === "pl-licensed"
        ? plLicensedWithdrawalMethods
        : withdrawalMethods.filter(
            (method) =>
              method.regions?.includes(region) && usedWithdrawalMethods.has(method.id),
          )
      : category === "crypto" && effectiveLicenseMode !== "pl-licensed"
        ? methods.crypto
        : methods.fiat
            .filter((method) => method.regions?.includes(region))
            .filter((method) => effectiveLicenseMode !== "pl-licensed" || plLicensedDepositIds.has(method.id))
            .map((method) =>
              effectiveLicenseMode === "pl-licensed" && plLicensedDepositDetails[method.id]
                ? { ...method, detail: plLicensedDepositDetails[method.id], feeRate: 0 }
                : method,
            )
  const selectedMethod = availableMethods.find((method) => method.id === selected)
  const selectedCryptoNetwork = initialCryptoTransfer && selectedMethod?.name === initialCryptoTransfer.asset ? initialCryptoTransfer.network : selectedMethod?.id === "usdt" ? network : selectedMethod?.id === "btc" ? "Bitcoin" : selectedMethod?.id === "sol" ? "Solana" : "Ethereum"
  const fiatGroups = getFiatGroups(region, effectiveLicenseMode)
  // Repeat deposit candidates: the 3 most recent settled fiat deposits
  // whose method is still offered in this region.
  const recentDeposits = transactions
    .filter((transaction) => transaction.direction !== "withdrawal" && transaction.status !== "pending" && transaction.status !== "unknown" && methods.fiat.some((candidate) => candidate.name === transaction.method && (candidate.regions?.includes(region) ?? true) && (effectiveLicenseMode !== "pl-licensed" || plLicensedDepositIds.has(candidate.id))))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 10)
  const openRepeatTransaction = recentDeposits.find((transaction) => transaction.id === repeatForm?.id)
  const openRepeatMethod = openRepeatTransaction ? methods.fiat.find((candidate) => candidate.name === openRepeatTransaction.method && (candidate.regions?.includes(region) ?? true)) : undefined
  const openRepeatLimits = getMethodLimits(openRepeatMethod, "deposit", effectiveLicenseMode)
  const openRepeatParsed = repeatForm && openRepeatTransaction
    ? Number(normalizeAmountInput(repeatForm.amount, CASHIER_LOCALE, currencyExponent(openRepeatTransaction.currency)) || "0")
    : 0
  const openRepeatOutOfRange = openRepeatParsed < openRepeatLimits.min || openRepeatParsed > openRepeatLimits.max
  const openRepeatFeeRate = getMethodFeeRate(openRepeatMethod, "deposit", effectiveLicenseMode)
  const openRepeatFormattedTotal =
    openRepeatTransaction && openRepeatMethod && !openRepeatOutOfRange && openRepeatParsed > 0 && openRepeatFeeRate !== undefined
      ? formatCurrency(openRepeatParsed + roundToExponent(openRepeatParsed * openRepeatFeeRate, currencyExponent(openRepeatTransaction.currency)), openRepeatTransaction.currency)
      : null
  const openRepeatCtaLabel = openRepeatMethod ? formatDepositCta(openRepeatMethod, openRepeatFormattedTotal) : "Continue"
  const canonicalAmount = normalizeAmountInput(amount, CASHIER_LOCALE, currencyExponent(currency))
  const parsedAmount = Number(canonicalAmount || "0")
  const amountSyntaxValid = new RegExp(`^\\d+(?:\\.\\d{0,${currencyExponent(currency)}})?$`).test(canonicalAmount)
  const isPlTempAccount = effectiveLicenseMode === "pl-licensed" && kycState !== "verified"
  const { min: methodMin, max: rawMethodMax } = getMethodLimits(selectedMethod, mode, effectiveLicenseMode)
  const methodMax = mode === "deposit" && isPlTempAccount ? Math.min(rawMethodMax, 5000) : rawMethodMax
  const feeRate = getMethodFeeRate(selectedMethod, mode, effectiveLicenseMode)
  const estimatedFee = selectedMethod && feeRate !== undefined ? roundToExponent(parsedAmount * feeRate, currencyExponent(currency)) : 0
  const withdrawalTotal = parsedAmount + estimatedFee
  const feeAwareMax = Math.min(
    methodMax,
    roundToExponent(feeRate === undefined || feeRate >= 1 ? 0 : Math.max(0, balance) / (1 + feeRate), currencyExponent(currency)),
  )
  const activeBonusRequired = activeBonus
    ? activeBonus.offer.wageringBasis === "bonus"
      ? activeBonus.bonusAmount * activeBonus.offer.wageringMultiplier
      : (activeBonus.bonusAmount + activeBonus.depositAmount) * activeBonus.offer.wageringMultiplier
    : 0
  const activeBonusRemaining = activeBonus ? Math.max(0, activeBonusRequired - activeBonus.contributed) : 0
  const todayKey = new Date().toISOString().slice(0, 10)
  const todayDeposited = transactions
    .filter((transaction) => transaction.direction !== "withdrawal" && transaction.status === "success" && transaction.currency === currency && transaction.createdAt.slice(0, 10) === todayKey)
    .reduce((sum, transaction) => sum + transaction.amount, 0)
  const remainingDailyLimit = dailyDepositLimit !== undefined ? Math.max(0, dailyDepositLimit - todayDeposited) : undefined
  const openRepeatPresets = getValidAmountPresets(
    openRepeatLimits.min,
    remainingDailyLimit !== undefined ? Math.min(openRepeatLimits.max, remainingDailyLimit) : openRepeatLimits.max,
  )
  const emptyWithdrawal =
    mode === "withdrawal" &&
    paymentStatus === "idle" &&
    (!hasSuccessfulDeposit || balance <= 0)
  const amountValid =
    amountSyntaxValid &&
    parsedAmount >= methodMin &&
    parsedAmount <= methodMax &&
    (mode !== "deposit" || remainingDailyLimit === undefined || parsedAmount <= remainingDailyLimit + 0.0001) &&
    (mode !== "withdrawal" || withdrawalTotal <= balance + 0.0001)
  const amountError = (() => {
    if (amount.length === 0) return null
    if (!amountSyntaxValid) return `Enter an amount with up to ${currencyExponent(currency)} decimal places.`
    if (parsedAmount < methodMin) return `The minimum is ${formatMoney(methodMin, currency, CASHIER_LOCALE)}.`
    if (parsedAmount > methodMax) return `The maximum is ${formatMoney(methodMax, currency, CASHIER_LOCALE)}.`
    if (mode === "deposit" && remainingDailyLimit !== undefined && parsedAmount > remainingDailyLimit + 0.0001) {
      return `Exceeds your daily deposit limit (${formatMoney(remainingDailyLimit, currency, CASHIER_LOCALE)} remaining today).`
    }
    if (mode === "withdrawal" && withdrawalTotal > balance + 0.0001) {
      return "Amount and fee exceed your available balance."
    }
    return null
  })()
  const cardReady =
    passesLuhn(cardDetails.number) &&
    hasValidExpiry(cardDetails.expiry) &&
    cardDetails.cvc.length === 3 &&
    cardDetails.holder.trim().length >= 2

  const payoutCardReady = passesLuhn(cardDetails.number)

  const resetSelection = () => {
    resetScrollFlags()
    setSelected(null)
    setPaymentStatus("idle")
    setCardDetails(emptyCard)
    setCardAttempted(false)
    setRepeatForm(null)
    setBlikCode("")
    setUseBlikCodeOnce(false)
    setBank("")
    setActiveTransaction(null)
  }

  const selectMethod = (id: string) => {
    resetScrollFlags()
    setSelected(id)
    if (mode === "withdrawal") {
      setAmount("")
      setAddingDestination(false)
      setDestinationError(null)
      setSelectedDestinationId(null)
      setIban("")
    }
    if (id === "blik" || id === "bank-transfer" || id === "p24" || id === "trustly" || id === "paysafecard") setCurrency("PLN")
    setBlikCode("")
    setUseBlikCodeOnce(false)
    setBank("")
    setPaymentStatus("idle")
    setCardAttempted(false)
    setCardDetails(emptyCard)
    setRepeatForm(null)
  }

  const startPayment = () => {
    if (category === "crypto") return
    if (!selectedMethod || !amountValid) return

    // Withdrawals are committed from the withdrawal flow, which owns the
    // destination, the amount and the review step.
    if (mode === "withdrawal") return

    if (selectedMethod.flow === "blik" && !blikOneClickReady && blikCode.length !== 6) return
    if (selectedMethod.flow === "bank" && !bank) return
    if (selectedMethod.flow === "card" && !cardReady) {
      setCardAttempted(true)
      const firstInvalid = !passesLuhn(cardDetails.number) ? "card-number" : !hasValidExpiry(cardDetails.expiry) ? "card-expiry" : cardDetails.cvc.length !== 3 ? "card-cvc" : "card-holder"
      document.getElementById(firstInvalid)?.focus()
      return
    }
    setPaymentStatus("pending")
    const id = ++nextTransactionId.current
    const amounts = demoAmounts(amount, selectedMethod, currency, methodMin, methodMax, feeRate)
    setTransactions((current) => [{ id, reference: `TXN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, createdAt: new Date().toISOString(), method: selectedMethod.name, amount: parsedAmount, fee: amounts?.fee ?? null, currency, status: "pending", chargeState: "unknown", cancelable: true }, ...current])
    setActiveTransaction(id)
    activeTransactionRef.current = id
    const shouldSaveOneClick = selectedMethod.flow === "blik" && !blikOneClickReady && blikOneClick
    if (selectedMethod.flow === "blik" || selectedMethod.flow === "card" || selectedMethod.flow === "bank" || selectedMethod.flow === "wallet") {
      const delayed = selectedMethod.flow === "blik" && !blikOneClickReady && blikCode === "111111"
      const result: "success" | "failed" = selectedMethod.flow === "blik"
        ? (!blikOneClickReady && blikCode === "000000" ? "failed" : "success")
        : selectedMethod.flow === "card"
          ? (onlyDigits(cardDetails.number) === "4000000000000002" ? "failed" : "success")
          : "success"
      const timer = setTimeout(() => {
        if (!delayed && activeTransactionRef.current === id) setPaymentStatus(result)
        if (!delayed && result === "success" && shouldSaveOneClick) setBlikOneClickSaved(true)
        setTransactions((current) => current.map((transaction) => transaction.id === id && transaction.status === "pending" ? delayed ? { ...transaction, delayed: true } : { ...transaction, status: result, cancelable: false } : transaction))
        paymentTimers.current.delete(id)
      }, delayed ? 5000 : 4000)
      paymentTimers.current.set(id, timer)
    }
    setBlikCode("")
    setCardDetails(emptyCard)
    setCardAttempted(false)
  }

  const withdrawalFlowMethods: WithdrawalMethodOption[] =
    selectedMethod && mode === "withdrawal"
      ? [
          {
            id: selectedMethod.id,
            name: selectedMethod.name,
            description: selectedMethod.detail,
            eta: selectedMethod.eta ?? "",
            feeRate: effectiveLicenseMode === "pl-licensed" ? 0 : (selectedMethod.feeRate ?? demoFeeRates[selectedMethod.id] ?? 0),
            icon: (selectedMethod.Icon ?? Wallet) as typeof Wallet,
            brand:
              selectedMethod.id === "blik"
                ? ("blik" as const)
                : selectedMethod.id === "paypal"
                  ? ("paypal" as const)
                  : selectedMethod.flow === "card"
                    ? ("card" as const)
                    : undefined,
            flow:
              selectedMethod.flow === "card"
                ? "card"
                : selectedMethod.flow === "wallet"
                  ? "wallet"
                  : "bank",
          },
        ]
      : []

  const saveWithdrawalDestination = () => {
    if (!selectedMethod) return

    if (selectedMethod.flow === "card") {
      if (!payoutCardReady) {
        setCardAttempted(true)
        setDestinationError("Check the card number before saving.")
        return
      }
      const digits = onlyDigits(cardDetails.number)
      const brand = detectCardBrand(digits) ?? "Card"
      const id = `dest-card-${crypto.randomUUID().slice(0, 8)}`
      setSavedDestinations((current) => [
        ...current,
        {
          id,
          methodId: selectedMethod.id,
          title: `${brand} •••• ${digits.slice(-4)}`,
          subtitle: "Verified payout card",
        },
      ])
      setSelectedDestinationId(id)
      setFailingCard(false)
    } else if (selectedMethod.flow === "wallet") {
      const email = walletEmail.trim()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setDestinationError("Enter the wallet email you used to deposit.")
        return
      }
      const id = `dest-wallet-${crypto.randomUUID().slice(0, 8)}`
      setSavedDestinations((current) => [
        ...current,
        { id, methodId: selectedMethod.id, title: selectedMethod.name, subtitle: email },
      ])
      setSelectedDestinationId(id)
    } else {
      if (!bank) {
        setDestinationError("Choose your bank.")
        return
      }
      if (!isValidIban(iban, effectiveLicenseMode === "pl-licensed")) {
        setDestinationError(
          effectiveLicenseMode === "pl-licensed"
            ? "Enter a valid Polish IBAN (PL followed by 26 digits)."
            : "Enter a valid IBAN (PL 28 chars or DE 22 chars).",
        )
        return
      }
      const id = `dest-bank-${crypto.randomUUID().slice(0, 8)}`
      const bankName = withdrawalBanks.find((option) => option.id === bank)?.name ?? "Bank account"
      setSavedDestinations((current) => [
        ...current,
        { id, methodId: selectedMethod.id, title: bankName, subtitle: maskIban(iban) },
      ])
      setSelectedDestinationId(id)
    }

    setAddingDestination(false)
    setDestinationError(null)
    setCardAttempted(false)
    setCardDetails(emptyCard)
    setIban("")
    setWalletEmail("")
  }

  const openAddingDestination = () => {
    setDestinationError(null)
    setCardAttempted(false)
    setCardDetails(emptyCard)
    setIban("")
    setWalletEmail("")
    setBank("")
    // The sheet derives open from the slot, so the form must be reset before it mounts.
    setAddingDestination(true)
  }

  const cancelAddingDestination = () => {
    setAddingDestination(false)
    setDestinationError(null)
    setCardAttempted(false)
    setCardDetails(emptyCard)
    setIban("")
    setWalletEmail("")
    setBank("")
  }

  const startWithdrawal = (details: WithdrawalConfirmation) => {
    setPaymentStatus("pending")
    const id = ++nextTransactionId.current
    const pendingMs = selectedMethod?.id === "bank-transfer" ? 18000 : 8000
    setTransactions((current) => [
      {
        id,
        reference: `TXN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        createdAt: new Date().toISOString(),
        method: details.methodName,
        amount: details.amount,
        fee: details.fee,
        currency,
        status: "pending",
        direction: "withdrawal",
        destination: details.destinationTitle,
        eta: selectedMethod?.eta,
        chargeState: "not_charged",
        cancelable: true,
      },
      ...current,
    ])
    setActiveTransaction(id)
    activeTransactionRef.current = id
    const timer = setTimeout(() => {
      const result = failingCard ? "failed" : "success"
      if (activeTransactionRef.current === id) setPaymentStatus(result)
      setTransactions((current) =>
        current.map((transaction) =>
          transaction.id === id && transaction.status === "pending"
            ? {
                ...transaction,
                status: result,
                declineReason: result === "failed" ? (failingCard ? "card" : "provider") : undefined,
                cancelable: false,
              }
            : transaction,
        ),
      )
      paymentTimers.current.delete(id)
    }, pendingMs)
    paymentTimers.current.set(id, timer)
  }

  const startCryptoWithdrawal = (details: { asset: string; network: string; address: string; amount: number; fee: number }) => {    setPaymentStatus("pending")
    const id = ++nextTransactionId.current
    setTransactions((current) => [{ id, reference: `TXN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, createdAt: new Date().toISOString(), method: "Crypto", amount: details.amount, fee: details.fee, currency, status: "pending", direction: "withdrawal", destination: details.address, asset: details.asset, network: details.network, eta: selectedMethod?.eta, chargeState: "not_charged", cancelable: false }, ...current])
    setActiveTransaction(id)
    activeTransactionRef.current = id
    const timer = setTimeout(() => {
      const result = "success"
      if (activeTransactionRef.current === id) setPaymentStatus(result)
      setTransactions((current) => current.map((transaction) => transaction.id === id && transaction.status === "pending" ? { ...transaction, status: result, cancelable: false } : transaction))
      paymentTimers.current.delete(id)
    }, 3000)
    paymentTimers.current.set(id, timer)
  }

  const cancelPayment = async (id: number): Promise<boolean> => {
    const transaction = transactionsRef.current.find((item) => item.id === id)
    if (transaction?.status !== "pending" || !transaction.cancelable) return false
    if (onCancelDeposit) {
      const canceled = await onCancelDeposit(transaction)
      if (!canceled || transactionsRef.current.find((item) => item.id === id)?.status !== "pending") return false
    }
    const existingTimer = paymentTimers.current.get(id)
    if (existingTimer) {
      clearTimeout(existingTimer)
      paymentTimers.current.delete(id)
    }
    if (activeTransactionRef.current === id) {
      setPaymentStatus("canceled")
    }
    setTransactions((current) => current.map((item) => item.id === id && item.status === "pending" ? { ...item, status: "canceled", cancelable: false } : item))
    showToast(
      transaction.direction === "withdrawal"
        ? `${formatCurrency(transaction.amount + (transaction.fee ?? 0), transaction.currency)} returned to your balance.`
        : "Payment request canceled. Nothing was charged.",
    )
    return true
  }

  const checkCancellation = async (id: number): Promise<boolean> => {
    const transaction = transactionsRef.current.find((item) => item.id === id)
    if (!transaction) return false
    if (onCheckCancelDeposit) {
      const refreshed = await onCheckCancelDeposit(transaction)
      if (refreshed.id !== id) return false
      transactionsRef.current = transactionsRef.current.map((item) => item.id === id ? refreshed : item)
      setTransactions(transactionsRef.current)
      if (activeTransactionRef.current === id && refreshed.status !== "pending") setPaymentStatus(refreshed.status)
      return refreshed.status === "pending" && refreshed.cancelable === true && refreshed.chargeState === "not_charged"
    }
    return transaction.status === "pending" && transaction.cancelable === true
  }

  const returnToGame = () => { onReturnToGame?.(); setIsOpen(false) }

  const openStatus = (transaction: Transaction) => {
    const method = [...methods.fiat, ...plLicensedWithdrawalMethods, ...withdrawalMethods, ...methods.crypto].find((candidate) => candidate.name === transaction.method && (candidate.regions?.includes(region) ?? true))
    if (!method) return
    setCategory(method.flow === "crypto" ? "crypto" : "fiat")
    setMode(transaction.direction === "withdrawal" ? "withdrawal" : "deposit")
    setSelected(method.id)
    setPaymentStatus(transaction.status)
    setActiveTransaction(transaction.id)
    activeTransactionRef.current = transaction.id
    setAmount(String(transaction.amount))
    setCurrency(transaction.currency)
    setDetailTransaction(null)
    setView("deposit")
  }

  const toggleRepeat = (transaction: Transaction) => {
    setUseBlikCodeOnce(false)
    setRepeatForm((current) => current?.id === transaction.id ? null : { id: transaction.id, cvc: "", code: "", bank: "", amount: String(transaction.amount), attempted: false })
  }

  // Repeat deposit, committed from the expanded card: the past method
  // is reused with a user-editable amount (so 75 can become 500),
  // secrets are always entered fresh unless BLIK 1-Click is saved.
  const commitRepeat = (transaction: Transaction, method: Method) => {
    if (!repeatForm) return
    const repeatUsesBlik1Click = method.flow === "blik" && blikOneClickReady
    const repeatValid = method.flow === "card"
      ? repeatForm.cvc.length === 3
      : method.flow === "blik"
        ? repeatUsesBlik1Click || repeatForm.code.length === 6
        : method.flow === "bank"
          ? Boolean(repeatForm.bank)
          : true
    const repeatLimits = getMethodLimits(method, "deposit", effectiveLicenseMode)
    const repeatFeeRate = getMethodFeeRate(method, "deposit", effectiveLicenseMode)
    const repeatAmount = Number(normalizeAmountInput(repeatForm.amount, CASHIER_LOCALE, currencyExponent(transaction.currency)) || "0")
    const repeatAmountSyntaxValid = new RegExp(`^\\d+(?:\\.\\d{0,${currencyExponent(transaction.currency)}})?$`).test(normalizeAmountInput(repeatForm.amount, CASHIER_LOCALE, currencyExponent(transaction.currency)))
    const repeatAmountValid =
      repeatAmountSyntaxValid &&
      repeatAmount >= repeatLimits.min &&
      repeatAmount <= repeatLimits.max &&
      (remainingDailyLimit === undefined || repeatAmount <= remainingDailyLimit + 0.0001)
    if (!repeatValid || !repeatAmountValid) {
      setRepeatForm({ ...repeatForm, attempted: true })
      document.getElementById(!repeatAmountValid ? `repeat-amount-${transaction.id}` : method.flow === "card" ? `repeat-cvc-${transaction.id}` : method.flow === "blik" ? `repeat-code-${transaction.id}` : `repeat-bank-${transaction.id}`)?.focus()
      return
    }
    setCategory("fiat")
    setMode("deposit")
    setSelected(method.id)
    setAmount(String(repeatAmount))
    setCurrency(transaction.currency)
    setBlikCode(repeatUsesBlik1Click ? "" : repeatForm.code)
    setBank(repeatForm.bank)
    setPaymentStatus("pending")
    const id = ++nextTransactionId.current
    const amounts = demoAmounts(String(repeatAmount), method, transaction.currency, repeatLimits.min, repeatLimits.max, repeatFeeRate)
    setTransactions((current) => [{ id, reference: `TXN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, createdAt: new Date().toISOString(), method: method.name, amount: repeatAmount, fee: amounts?.fee ?? null, currency: transaction.currency, status: "pending", chargeState: "unknown", cancelable: true }, ...current])
    setActiveTransaction(id)
    activeTransactionRef.current = id
    const delayed = method.flow === "blik" && !repeatUsesBlik1Click && repeatForm.code === "111111"
    const result: "success" | "failed" = method.flow === "blik" && !repeatUsesBlik1Click && repeatForm.code === "000000" ? "failed" : "success"
    const timer = setTimeout(() => {
      if (!delayed && activeTransactionRef.current === id) setPaymentStatus(result)
      setTransactions((current) => current.map((item) => item.id === id && item.status === "pending" ? delayed ? { ...item, delayed: true } : { ...item, status: result, cancelable: false } : item))
      paymentTimers.current.delete(id)
    }, delayed ? 5000 : 4000)
    paymentTimers.current.set(id, timer)
    setRepeatForm(null)
    setDetailTransaction(null)
    setView("deposit")
  }

  const retryHistory = () => {
    setHistoryState("loading")
    window.setTimeout(() => setHistoryState("ready"), 900)
  }
  const activeTxn = transactions.find((transaction) => transaction.id === activeTransaction)
  const isDelayedPending = paymentStatus === "pending" && Boolean(activeTxn?.delayed)
  const copy = blikCopy["en-GB"]

  const retryPayment = () => {
    setPaymentStatus("idle")
    setCardAttempted(false)
    if (selectedMethod?.flow === "blik") {
      setBlikCode("")
      window.requestAnimationFrame(() => document.getElementById("blik-code")?.focus())
    }
  }

  const retryMethodLabel =
    selectedMethod?.flow === "blik"
      ? copy.retry
      : selectedMethod?.name
        ? `Try ${selectedMethod.name} again`
        : "Try again"

  const resolveAction: { label: string; support?: boolean; run: () => void } | null = (() => {
    if (paymentStatus === "pending" || paymentStatus === "unknown" || paymentStatus === "success") {
      // iGaming: never trap the player on a pending or completed flow.
      return { label: copy.backToGame, run: returnToGame }
    }
    if (paymentStatus === "canceled") {
      return { label: copy.chooseMethod, run: resetSelection }
    }
    if (paymentStatus === "expired") {
      return { label: mode === "withdrawal" ? "Try again" : retryMethodLabel, run: retryPayment }
    }
    if (paymentStatus === "failed") {
      if (mode === "withdrawal") {
        if (activeTxn?.declineReason === "provider" && activeTxn) {
          return { label: copy.contactSupport, support: true, run: () => triggerSupport({ kind: "fiat", transaction: activeTxn }) }
        }
        return { label: copy.chooseMethod, run: resetSelection }
      }
      if (activeTxn?.chargeState === "charged" && activeTxn) {
        return { label: copy.contactSupport, support: true, run: () => triggerSupport({ kind: "fiat", transaction: activeTxn }) }
      }
      // iGaming: after a failed deposit, route to another method first rather than looping on the failing rail.
      return { label: copy.chooseMethod, run: resetSelection }
    }
    return null
  })()

  const statusScreen = Boolean(selectedMethod) && paymentStatus !== "idle"
  const pendingWithdrawals = transactions.filter(
    (transaction) =>
      transaction.direction === "withdrawal" &&
      (transaction.status === "pending" || transaction.status === "unknown"),
  )
  /** The fiat withdrawal flow owns its own action buttons. */
  const embeddedWithdrawal =
    mode === "withdrawal" &&
    paymentStatus === "idle" &&
    Boolean(selectedMethod) &&
    selectedMethod?.flow !== "crypto"
  const activeKycFlow =
    view === "deposit" &&
    mode === "withdrawal" &&
    effectiveLicenseMode === "pl-licensed" &&
    kycState !== "verified" &&
    kycFlowOpen
  const headerTitle =
    view === "transactions"
      ? "History"
      : statusScreen
        ? mode === "withdrawal"
          ? "Withdrawal"
          : "Deposit"
        : selectedMethod && paymentStatus === "idle"
          ? mode === "withdrawal"
            ? selectedMethod.flow === "crypto"
              ? "Withdraw crypto"
              : `Withdraw to ${selectedMethod.name}`
            : selectedMethod.name
          : mode === "withdrawal"
            ? "Withdraw cash"
            : "Payment methods"
  const statusSecondary: { label: string; support?: boolean; run: () => void } | null = (() => {
    if (!statusScreen) return null
    if (paymentStatus === "success") return { label: mode === "withdrawal" ? "Make another withdrawal" : copy.anotherDeposit, run: resetSelection }
    if (paymentStatus === "unknown") {
      return activeTxn ? { label: copy.contactSupport, support: true, run: () => triggerSupport({ kind: "fiat", transaction: activeTxn }) } : null
    }
    if (paymentStatus === "canceled") {
      return mode === "withdrawal"
        ? { label: copy.backToGame, run: returnToGame }
        : { label: retryMethodLabel, run: retryPayment }
    }
    if (paymentStatus === "expired") return { label: copy.chooseMethod, run: resetSelection }
    if (paymentStatus === "failed") {
      if (mode === "withdrawal") {
        if (activeTxn?.declineReason === "provider") return { label: copy.chooseMethod, run: resetSelection }
        return activeTxn ? { label: copy.contactSupport, support: true, run: () => triggerSupport({ kind: "fiat", transaction: activeTxn }) } : null
      }
      if (activeTxn?.chargeState === "charged") return { label: copy.chooseMethod, run: resetSelection }
      if (activeTxn?.declineReason === "bank") {
        return activeTxn ? { label: copy.contactSupport, support: true, run: () => triggerSupport({ kind: "fiat", transaction: activeTxn }) } : null
      }
      return { label: retryMethodLabel, run: retryPayment }
    }
    return null
  })()

  const statusTertiary: { label: string; support?: boolean; run: () => void } | null = (() => {
    if (!statusScreen) return null
    if (
      (paymentStatus === "failed" || paymentStatus === "expired") &&
      mode === "deposit" &&
      activeTxn?.chargeState !== "charged" &&
      activeTxn?.declineReason !== "bank" &&
      activeTxn
    ) {
      return { label: copy.contactSupport, support: true, run: () => triggerSupport({ kind: "fiat", transaction: activeTxn }) }
    }
    if (paymentStatus === "expired" && mode === "withdrawal") {
      return { label: copy.backToGame, run: returnToGame }
    }
    return null
  })()

  const inProgressSection = pendingWithdrawals.length > 0 ? (
    <section aria-label="In progress" className="grid gap-2">
      <h2 className="px-0.5 text-[13px] font-semibold leading-5 text-foreground">In progress</h2>
      {pendingWithdrawals.map((txn) => {
        const amt = formatCurrency(txn.amount, txn.currency)
        const flow = [...methods.fiat, ...plLicensedWithdrawalMethods, ...withdrawalMethods].find((c) => c.name === txn.method)?.flow as "card" | "wallet" | "bank" | "blik" | undefined
        return (
          <ExtendableStatusBar
            key={txn.id}
            mode="home"
            title={`Withdrawal · ${amt}`}
            ringTone="warning"
            reference={txn.reference}
            cancelable={Boolean(txn.cancelable)}
            direction="withdrawal"
            amountLabel={amt}
            destinationLabel={txn.destination ?? txn.method}
            onOpenFull={() => openStatus(txn)}
            onCheckCancel={() => checkCancellation(txn.id)}
            onCancel={() => cancelPayment(txn.id)}
            onContactSupport={() => triggerSupport({ kind: "fiat", transaction: txn })}
            timeline={<WithdrawalTimeline status={txn.status} flow={flow} />}
          />
        )
      })}
    </section>
  ) : null

  const formattedPayTotal = selectedMethod && amountValid && feeRate !== undefined ? formatCurrency(parsedAmount + estimatedFee, currency) : null

  const idleLabel =
    mode === "withdrawal"
      ? !selectedMethod
        ? "Choose a withdrawal method"
        : "Withdraw"
      : !selectedMethod
        ? "Choose a payment method"
        : formatDepositCta(selectedMethod, formattedPayTotal)

  const primaryDisabled =
    mode === "withdrawal"
      ? !selectedMethod || !amountValid || (selectedMethod.flow === "card" && !payoutCardReady) || (selectedMethod.flow === "bank" && !bank)
      : category === "crypto"
        ? !selected
        : (paymentStatus === "pending" && !isDelayedPending) || (paymentStatus === "idle" && (!selectedMethod || !amountValid || (selectedMethod.flow === "card" && !cardReady) || (selectedMethod.flow === "blik" && !blikOneClickReady && blikCode.length !== 6) || (selectedMethod.flow === "bank" && !bank)))

  if (!isOpen) {
    return (
      <main lang="en-GB" className="flex min-h-svh flex-col items-center justify-center gap-4 bg-muted/40 px-4 text-foreground">
        <h1 className="text-lg font-semibold">Game</h1>
        <Button type="button" onClick={() => setIsOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">Open payment methods</Button>
      </main>
    )
  }

  const isHomeHub = view === "deposit" && !embeddedWithdrawal && !activeKycFlow && !selectedMethod && paymentStatus === "idle"
  const heroSection = isHomeHub ? (
    <div aria-label="Cashier sections" className="flex flex-col items-center gap-3.5 pb-3.5 pt-1">
      <div
        aria-hidden={heroBalanceScrolled || undefined}
        className={cn(
          "flex w-full min-w-0 flex-col items-center gap-1 text-center transition-opacity duration-150",
          heroBalanceScrolled ? "pointer-events-none opacity-0" : "opacity-100",
        )}
      >
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-[12px] leading-4 text-muted-foreground">Balance</span>
          <button
            type="button"
            tabIndex={heroBalanceScrolled ? -1 : undefined}
            aria-label={balanceVisible ? "Hide balance" : "Show balance"}
            onClick={() => setBalanceVisible((visible) => !visible)}
            className="flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {balanceVisible ? <Eye className="size-4" aria-hidden="true" /> : <EyeOff className="size-4" aria-hidden="true" />}
          </button>
        </div>
        <span className="max-w-full truncate text-[28px] font-semibold leading-8 tracking-[-0.02em] tabular-nums text-foreground">
          {balanceVisible ? formatCurrency(balance, currency) : "••••"}
        </span>
      </div>
      <DirectionTabs mode={mode} onChange={(next) => { setMode(next); setCategory("fiat"); setAmount(next === "withdrawal" ? "" : "100"); resetSelection() }} />
    </div>
  ) : null

  return (
    <main lang="en-GB" className="flex min-h-svh items-center justify-center bg-background p-0 text-foreground sm:p-6">
      <CashierSurface showGlow={isHomeHub} className="h-svh rounded-none border-0 sm:h-[780px] sm:max-h-[calc(100svh-48px)] sm:rounded-[24px] sm:border">
        {!embeddedWithdrawal && !activeKycFlow && (
        <CashierHeader
          title={headerTitle}
          seamless={isHomeHub && !headerScrolled}
          subtitle={
            !isHomeHub || heroBalanceScrolled ? (
              <HeaderBalanceSubtitle
                value={formatCurrency(balance, currency)}
                visible={balanceVisible}
                onToggleVisible={() => setBalanceVisible((visible) => !visible)}
              />
            ) : undefined
          }
          onBack={view === "transactions" ? () => { resetScrollFlags(); setView("deposit") } : selectedMethod ? resetSelection : undefined}
          onClose={returnToGame}
          className={headerScrolled ? "shadow-[var(--shadow-medium)]" : undefined}
          leading={
            view === "deposit" && !selectedMethod && paymentStatus === "idle" ? (
              <IconButton label="Transaction history" onClick={() => { resetScrollFlags(); setDetailTransaction(null); setView("transactions") }}>
                <History className="size-4" aria-hidden="true" />
              </IconButton>
            ) : undefined
          }
        />
        )}

        {homeToast && (
          <div className="pointer-events-none absolute inset-x-4 top-16 z-30 flex justify-center">
            <StatusToast tone="success" title={homeToast} className="pointer-events-auto w-full ring-1 ring-hairline" />
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col">
          {view === "transactions" ? (
            <div onScroll={onContentScroll} className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <TransactionHistory
                transactions={transactions}
                cryptoTransfer={initialCryptoTransfer}
                historyState={historyState}
                onRetry={retryHistory}
                expandedId={detailTransaction}
                onExpand={setDetailTransaction}
                cryptoExpanded={cryptoExpanded}
                onCryptoExpand={setCryptoExpanded}
                onCancelTransaction={(transaction) => cancelPayment(transaction.id)}
                onCheckCancelTransaction={(transaction) => checkCancellation(transaction.id)}
                onViewStatus={openStatus}
                onContactSupport={(item) => {
                  if (item.kind === "fiat") triggerSupport({ kind: "fiat", transaction: item.transaction })
                  else triggerSupport({ kind: "crypto", asset: item.transfer.asset, network: item.transfer.network, transfer: item.transfer })
                }}
                onChoosePaymentMethod={() => { resetScrollFlags(); setView("deposit") }}
              />
            </div>
          ) : emptyWithdrawal ? (
            <div onScroll={onContentScroll} className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <div className="grid gap-4">
                {heroSection}
                {inProgressSection}
                <EmptyState
                  icon={<Wallet className="size-5" aria-hidden="true" />}
                  title="Nothing to withdraw yet"
                  description={`Your available balance is ${balanceVisible ? formatCurrency(Math.max(0, balance), currency) : "hidden"}. Once funds are available, you can withdraw them.`}
                  action="Deposit"
                  actionVariant="primary"
                  onAction={() => { setMode("deposit"); setCategory("fiat"); setAmount("100"); resetSelection() }}
                />
              </div>
            </div>
          ) : selectedMethod ? (
            paymentStatus !== "idle" ? (
              <div onScroll={onContentScroll} className="cashier-push min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-5">
                <PaymentStatusPanel status={paymentStatus} method={selectedMethod} amount={activeTxn?.amount ?? parsedAmount} currency={currency} onChooseAnother={resetSelection} transaction={transactions.find((transaction) => transaction.id === activeTransaction)} delayed={transactions.find((transaction) => transaction.id === activeTransaction)?.delayed} onViewTransactions={() => { setDetailTransaction(activeTransaction); setView("transactions") }} onContactSupport={activeTransaction !== null ? () => { const transaction = transactions.find((item) => item.id === activeTransaction); if (transaction) triggerSupport({ kind: "fiat", transaction }) } : undefined} onCancel={activeTransaction !== null ? () => cancelPayment(activeTransaction) : undefined} onCheckCancel={activeTransaction !== null ? () => checkCancellation(activeTransaction) : undefined} showActions={false} direction={mode} />
              </div>
            ) : mode === "withdrawal" && selectedMethod.flow === "crypto" ? (
              <div className="flex min-h-0 flex-1 flex-col">
                <CryptoWithdrawal
                  balance={balance}
                  currency={currency}
                  savedAddresses={savedCryptoAddresses}
                  onSaveAddress={(address) => setSavedCryptoAddresses((current) => [...current, { ...address, id: `addr-${Date.now()}` }])}
                  onConfirm={startCryptoWithdrawal}
                  onCancel={resetSelection}
                />
              </div>
            ) : mode === "withdrawal" ? (
              <div className="flex min-h-0 flex-1 flex-col">
                <WithdrawCashFlow
                  variant="embedded"
                  currency={currency}
                  locale={CASHIER_LOCALE}
                  balance={balance}
                  balanceVisible={balanceVisible}
                  onToggleBalanceVisible={() => setBalanceVisible((visible) => !visible)}
                  methods={withdrawalFlowMethods}
                  destinations={savedDestinations}
                  minimum={methodMin}
                  maximum={methodMax}
                  selectedDestinationId={selectedDestinationId}
                  onSelectDestination={setSelectedDestinationId}
                  onAddDestination={openAddingDestination}
                  onCancelAddDestination={cancelAddingDestination}
                  addDestinationSlot={addingDestination ? (
                    <AddWithdrawalDestination
                      kind={selectedMethod.flow === "wallet" ? "wallet" : selectedMethod.flow === "bank" ? "bank" : "card"}
                      cardDetails={cardDetails}
                      onCardChange={(field, value) => setCardDetails((current) => ({ ...current, [field]: value }))}
                      attempted={cardAttempted}
                      bank={bank}
                      onBankChange={setBank}
                      iban={iban}
                      onIbanChange={setIban}
                      walletEmail={walletEmail}
                      onWalletEmailChange={setWalletEmail}
                      error={destinationError}
                      onSave={saveWithdrawalDestination}
                      onCancel={cancelAddingDestination}
                    />
                  ) : null}
                  onConfirm={startWithdrawal}
                  onCancel={resetSelection}
                  onExit={returnToGame}
                />
              </div>
            ) : (
              <div onScroll={onContentScroll} className="cashier-push min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-5">
                <div className="grid gap-4">
                  {category === "crypto" ? (
                    <div className="grid gap-2">
                      {selectedMethod.id === "usdt" && !initialCryptoTransfer && (
                        <div className="grid gap-2">
                          <SheetPickerField
                            id="crypto-network"
                            label="Network"
                            sheetTitle="Choose network"
                            value={network}
                            options={[
                              { value: "Tron (TRC20)", label: "Tron (TRC20)", subtitle: "Faster & lower fees", badgeText: "TRC", badgeColor: "#ef4444" },
                              { value: "Ethereum (ERC20)", label: "Ethereum (ERC20)", subtitle: "Mainnet ETH network", badgeText: "ERC", badgeColor: "#6366f1" },
                            ]}
                            onChange={setNetwork}
                            describedBy="network-hint"
                          />
                          <span id="network-hint" className="sr-only">Select the same network in your wallet or exchange.</span>
                        </div>
                      )}
                      {initialCryptoTransfer && selectedMethod.name === initialCryptoTransfer.asset ? <div><CryptoProgressPanel transfer={initialCryptoTransfer} onReturnToGame={returnToGame} onViewTransaction={() => { setCryptoExpanded(true); setView("transactions") }} onContactSupport={initialCryptoTransfer.status !== "credited" ? () => triggerSupport({ kind: "crypto", asset: initialCryptoTransfer.asset, network: initialCryptoTransfer.network, transfer: initialCryptoTransfer }) : undefined} /></div> : <CryptoDeposit key={`${selectedMethod.id}-${selectedCryptoNetwork}`} asset={selectedMethod.name} network={selectedCryptoNetwork} preview={cryptoPreview} onReturnToGame={returnToGame} onContactSupport={() => triggerSupport({ kind: "crypto", asset: selectedMethod.name, network: selectedCryptoNetwork })} />}
                    </div>
                  ) : (
                    <>
                      {isPlTempAccount && (
                        <InlineNotice tone="neutral" title="Temporary account limit">
                          Unverified accounts can deposit up to {formatMoney(5000, currency, CASHIER_LOCALE)} total. Verify your ID to unlock higher limits and withdrawals.
                        </InlineNotice>
                      )}
                      <MethodDetails
                      method={selectedMethod}
                      amount={amount}
                      currency={currency}
                      amountError={amountError}
                      cardDetails={cardDetails}
                      cardAttempted={cardAttempted}
                      saveCard={saveCard}
                      onSaveCardChange={setSaveCard}
                      blikCode={blikCode}
                      setBlikCode={setBlikCode}
                      bank={bank}
                      setBank={setBank}
                      blikOneClick={blikOneClick}
                      onBlikOneClickChange={setBlikOneClick}
                      blikOneClickActive={blikOneClickReady}
                      onUseBlikCodeInstead={() => {
                        setUseBlikCodeOnce(true)
                        window.requestAnimationFrame(() => document.getElementById("blik-code")?.focus())
                      }}
                      onAmountChange={setAmount}
                      onCardChange={(field, value) => setCardDetails((current) => ({ ...current, [field]: value }))}
                      direction="deposit"
                      minAmount={methodMin}
                      maxAmount={remainingDailyLimit !== undefined ? Math.min(methodMax, remainingDailyLimit) : methodMax}
                      methodMaxAmount={methodMax}
                      feeRate={feeRate}
                      feeAwareMax={feeAwareMax}
                    />
                    </>
                  )}
                </div>
              </div>
            )
          ) : activeKycFlow ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <KycVerificationFlow
                initialStep={initialKycStep ?? (kycState === "pending" ? "submitted" : "checklist")}
                initialData={kycSubmission ?? undefined}
                onBack={() => setKycFlowOpen(false)}
                onClose={returnToGame}
                onSubmit={(submission) => {
                  setKycSubmission(submission)
                  setKycState("pending")
                  const masked = `${submission.iban.slice(0, 4)} •••• •••• ${submission.iban.slice(-4)}`
                  setSavedDestinations((current) => [
                    {
                      id: `dest-kyc-${Date.now()}`,
                      methodId: "bank-transfer",
                      title: submission.bankName,
                      subtitle: masked,
                    },
                    ...current,
                  ])
                }}
                onComplete={() => {
                  setKycState("verified")
                  setKycFlowOpen(false)
                  setHomeToast("Identity verified. Withdrawals unlocked.")
                }}
              />
            </div>
          ) : (
            <div onScroll={onContentScroll} className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <div className="grid gap-2">
                {heroSection}
                {mode === "withdrawal" ? (
                  effectiveLicenseMode === "pl-licensed" && kycState !== "verified" ? (
                    activeKycFlow ? null : (
                      <div className="mt-2 grid gap-4">
                        <EmptyState
                          icon={kycState === "pending" ? <Clock className="size-6" aria-hidden="true" /> : <Landmark className="size-6" aria-hidden="true" />}
                          tone={kycState === "pending" ? "pending" : "empty"}
                          title={kycState === "pending" ? "Identity verification in progress" : "Verify your identity to withdraw"}
                          description={
                            kycState === "pending"
                              ? "We are reviewing your ID, PESEL, and Polish bank account (PL IBAN). Withdrawals will unlock as soon as verification completes."
                              : "Polish gambling regulations require a verified photo ID, PESEL, and your own Polish bank account (PL IBAN) before your first withdrawal."
                          }
                          action={kycState === "pending" ? "Check verification status" : "Complete verification"}
                          onAction={() => setKycFlowOpen(true)}
                        />
                      </div>
                    )
                  ) : (
                    <div className="mt-1 grid gap-4">
                      {inProgressSection}
                      {activeBonus && activeBonusRemaining > 0 && (
                        <InlineNotice tone="warning" title="Active bonus wagering in progress">
                          You have {formatCurrency(activeBonusRemaining, currency)} left to wager. Withdrawing your real balance now will forfeit your active bonus ({formatCurrency(activeBonus.bonusAmount, currency)}) and bonus winnings.
                        </InlineNotice>
                      )}
                      <section aria-labelledby="withdrawal-methods-title" className="grid gap-2">
                        <h2 id="withdrawal-methods-title" className="px-1 text-[13px] font-semibold leading-5 text-foreground">
                          Withdrawal methods
                        </h2>
                        <MethodList
                          methods={availableMethods.map((method) => {
                            const destination = savedDestinations.find((item) => item.methodId === method.id)
                            return destination
                              ? { ...method, detail: `${method.detail} · to ${destination.title}` }
                              : method
                          })}
                          label="Withdrawal methods"
                          onSelect={selectMethod}
                        />
                        <p className="px-1 text-[12px] leading-4 text-muted-foreground">
                          {effectiveLicenseMode === "pl-licensed"
                            ? `Paid out only to your own verified Polish bank account (PL IBAN). Minimum ${formatMoney(demoMin, currency, CASHIER_LOCALE)} · 0% fee · no 12% gaming tax on withdrawals.`
                            : `Withdrawals return to the method you used to deposit. Minimum ${formatMoney(demoMin, currency, CASHIER_LOCALE)} · Maximum ${formatMoney(demoMax, currency, CASHIER_LOCALE)}.`}
                        </p>
                      </section>
                    </div>
                  )
                ) : (
                  <>
                    {effectiveLicenseMode !== "pl-licensed" && (
                      <div className="mt-1">
                        <CategoryTabs category={category} onChange={(next) => { setCategory(next); resetSelection() }} />
                      </div>
                    )}
                    {category === "crypto" ? (
                      <div className="mt-1 grid gap-3">
                        {inProgressSection}
                        <h2 className="px-0.5 text-[13px] font-semibold leading-5 text-foreground">Choose a cryptocurrency</h2>
                        <MethodList methods={methods.crypto} label="Cryptocurrency" onSelect={selectMethod} />
                      </div>
                    ) : (
                      <div className="mt-0.5 grid gap-4">
                        {inProgressSection}
                        {bonusOffer !== null && bonusOffer !== undefined && (
                          <WelcomeBonusOffer
                            offer={bonusOffer ?? undefined}
                            initialOptedIn={initialBonusOptedIn}
                            active={activeBonus}
                            onOptInChange={onBonusOptInChange}
                            onTerms={onBonusTerms}
                          />
                        )}
                        {recentDeposits.length > 0 && (
                          <section aria-labelledby="recent-deposits-title" className="grid gap-1">
                            <h2 id="recent-deposits-title" className="px-0.5 text-[13px] font-semibold leading-5 text-foreground">Recent deposits</h2>
                            <div className="-mx-5 flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-px-5 px-5 py-1">
                              {recentDeposits.map((transaction) => {
                                const method = methods.fiat.find((candidate) => candidate.name === transaction.method && (candidate.regions?.includes(region) ?? true))!
                                const selected = repeatForm?.id === transaction.id
                                return (
                                  <button
                                    key={transaction.id}
                                    type="button"
                                    aria-pressed={selected}
                                    onClick={() => toggleRepeat(transaction)}
                                    className={cn("grid w-36 shrink-0 snap-start gap-2 rounded-card bg-surface-2 p-3 text-left ring-1 ring-hairline transition-colors hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", selected && "ring-1 ring-primary/50")}
                                  >
                                    <MethodMark method={method} />
                                    <span className="min-w-0">
                                      <span className="block truncate text-[15px] font-semibold leading-5 tabular-nums">{formatCurrency(transaction.amount, transaction.currency)}</span>
                                    </span>
                                  </button>
                                )
                              })}
                            </div>
                            {openRepeatTransaction && openRepeatMethod && repeatForm && (
                              <div className="rounded-card bg-surface-2 p-4 ring-1 ring-hairline">
                                <div className="grid gap-3">
                                  <div className="grid gap-2">
                                    <CurrencyAmountField
                                      id={`repeat-amount-${openRepeatTransaction.id}`}
                                      label="Deposit amount"
                                      value={repeatForm.amount}
                                      currency={openRepeatTransaction.currency}
                                      error={repeatForm.attempted && openRepeatOutOfRange}
                                      describedBy={`repeat-amount-hint-${openRepeatTransaction.id}`}
                                      onChange={(nextAmount) => setRepeatForm({ ...repeatForm, amount: nextAmount })}
                                    />
                                    <p id={`repeat-amount-hint-${openRepeatTransaction.id}`} className="text-[12px] leading-4 text-muted-foreground tabular-nums">{`Limit: ${formatMoney(openRepeatLimits.min, openRepeatTransaction.currency, CASHIER_LOCALE)}–${formatMoney(openRepeatLimits.max, openRepeatTransaction.currency, CASHIER_LOCALE)}`}</p>
                                    {openRepeatPresets.length > 0 && (
                                      <QuickAmounts
                                        amounts={openRepeatPresets}
                                        format={(value) => formatNumber(value, CASHIER_LOCALE)}
                                        value={openRepeatPresets.includes(openRepeatParsed) ? openRepeatParsed : null}
                                        surface="card"
                                        onSelect={(value) => setRepeatForm({ ...repeatForm, amount: String(value) })}
                                      />
                                    )}
                                    {repeatForm.attempted && openRepeatOutOfRange && (
                                      <p className="text-xs text-danger" role="alert">Enter an amount between {formatMoney(openRepeatLimits.min, openRepeatTransaction.currency, CASHIER_LOCALE)} and {formatMoney(openRepeatLimits.max, openRepeatTransaction.currency, CASHIER_LOCALE)}.</p>
                                    )}
                                  </div>
                                  {openRepeatMethod.flow === "card" && (
                                          <div className="grid gap-2">
                                            <div className="relative">
                                              <FloatingInput id={`repeat-cvc-${openRepeatTransaction.id}`} label="CVV" type="password" inputMode="numeric" autoComplete="off" maxLength={3} error={repeatForm.attempted && repeatForm.cvc.length !== 3} aria-invalid={repeatForm.attempted && repeatForm.cvc.length !== 3} aria-describedby={repeatForm.attempted && repeatForm.cvc.length !== 3 ? `repeat-cvc-error-${openRepeatTransaction.id}` : undefined} value={repeatForm.cvc} onChange={(event) => setRepeatForm({ ...repeatForm, cvc: onlyDigits(event.target.value).slice(0, 3) })} inputClassName="pr-13" />
                                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                                <Popover><PopoverTrigger render={<button type="button" aria-label="What is CVC?" className="flex h-7 w-10 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />}><CvcHintMark /></PopoverTrigger><PopoverContent side="top" className="w-56"><PopoverTitle>What is CVC?</PopoverTitle><PopoverDescription>The 3-digit security code on the back of your card.</PopoverDescription></PopoverContent></Popover>
                                              </span>
                                            </div>
                                            {repeatForm.attempted && repeatForm.cvc.length !== 3 && (
                                              <p id={`repeat-cvc-error-${openRepeatTransaction.id}`} className="text-xs text-danger" role="alert">Enter the 3-digit code.</p>
                                            )}
                                          </div>
                                        )}
                                        {openRepeatMethod.flow === "blik" && (
                                          blikOneClickReady ? (
                                            <BlikOneClickActiveCard
                                              surface="bg-surface-1"
                                              onUseCodeInstead={() => {
                                                setUseBlikCodeOnce(true)
                                                window.requestAnimationFrame(() => document.getElementById(`repeat-code-${openRepeatTransaction.id}`)?.focus())
                                              }}
                                            />
                                          ) : (
                                            <div className="grid gap-2">
                                              <CodeInput
                                                id={`repeat-code-${openRepeatTransaction.id}`}
                                                label="6-digit BLIK code"
                                                size="sm"
                                                error={repeatForm.attempted && repeatForm.code.length !== 6}
                                                aria-describedby={repeatForm.attempted && repeatForm.code.length !== 6 ? `repeat-code-error-${openRepeatTransaction.id}` : undefined}
                                                value={repeatForm.code}
                                                onChange={(code) => setRepeatForm({ ...repeatForm, code })}
                                              />
                                              {repeatForm.attempted && repeatForm.code.length !== 6 && (
                                                <p id={`repeat-code-error-${openRepeatTransaction.id}`} className="text-[12px] leading-4 text-danger" role="alert">Enter the 6-digit code.</p>
                                              )}
                                            </div>
                                          )
                                        )}
                                        {openRepeatMethod.flow === "bank" && (
                                          <div className="grid gap-1.5">
                                            <SheetPickerField
                                              id={`repeat-bank-${openRepeatTransaction.id}`}
                                              label="Bank"
                                              sheetTitle="Choose your bank"
                                              placeholder="Choose your bank"
                                              value={repeatForm.bank}
                                              options={toBankPickerOptions(openRepeatMethod.id === "p24" ? p24Banks : depositBanks)}
                                              onChange={(nextBank) => setRepeatForm({ ...repeatForm, bank: nextBank })}
                                              error={repeatForm.attempted && !repeatForm.bank}
                                            />
                                            {repeatForm.attempted && !repeatForm.bank && (
                                              <p className="text-xs text-danger" role="alert">Choose your bank.</p>
                                            )}
                                          </div>
                                        )}
                                        <div className="grid gap-2.5 pt-0.5">
                                          <ActionButton onClick={() => commitRepeat(openRepeatTransaction, openRepeatMethod)}>{openRepeatCtaLabel}</ActionButton>
                                          <SecureTransactionNote methodName={openRepeatMethod.id === "card" ? "card" : openRepeatMethod.name} />
                                        </div>
                                    </div>
                                  </div>
                            )}
                          </section>
                        )}
                        {remainingDailyLimit !== undefined && (
                          <InlineNotice tone={remainingDailyLimit === 0 ? "warning" : "neutral"} title="Daily deposit limit">
                            Remaining today: {formatCurrency(remainingDailyLimit, currency)} of {formatCurrency(dailyDepositLimit!, currency)}.
                          </InlineNotice>
                        )}
                        {fiatGroups.map((group) => ({ ...group, methods: group.methods.filter((method) => currency === "PLN" || !plOnlyMethods.includes(method.id)) })).filter((group) => group.methods.length > 0).map((group) => (
                          <section key={group.id} aria-labelledby={`fiat-group-${group.id}`} className="grid gap-2">
                            <h2 id={`fiat-group-${group.id}`} className="px-0.5 text-[13px] font-semibold leading-5 text-foreground">
                              {group.id === "popular" ? `Popular in ${regionNames[region]}` : group.title}
                            </h2>
                            <MethodList methods={group.methods} label={`${group.title} · ${regionNames[region]}`} onSelect={selectMethod} />
                          </section>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {isHomeHub && (
          <CashierComplianceFooter
            plLicensed={effectiveLicenseMode === "pl-licensed"}
            onResponsiblePlay={() => setResponsiblePlayOpen(true)}
          />
        )}

        {view === "deposit" && !emptyWithdrawal && !embeddedWithdrawal && category === "fiat" && (paymentStatus !== "idle" || selectedMethod?.flow !== "crypto") && (paymentStatus === "idle" || resolveAction !== null) && (selected !== null || paymentStatus !== "idle") && (
          <div className={cn("shrink-0 border-t border-hairline bg-background/80 px-5 pt-3 backdrop-blur-xl", paymentStatus === "idle" && selectedMethod ? "pb-5" : "pb-6")}>
            <div className="grid gap-2.5">
              {paymentStatus !== "idle" && resolveAction?.support ? (
                <SupportButton variant="primary" label={resolveAction.label} onClick={resolveAction.run} />
              ) : (
                <ActionButton
                  disabled={paymentStatus === "idle" ? primaryDisabled : false}
                  onClick={() => {
                    if (paymentStatus === "idle") startPayment()
                    else resolveAction?.run()
                  }}
                >
                  {paymentStatus === "idle" ? idleLabel : resolveAction?.label}
                </ActionButton>
              )}
              {paymentStatus === "idle" && selectedMethod && (
                <SecureTransactionNote methodName={selectedMethod.id === "card" ? "card" : selectedMethod.name} />
              )}
              {statusScreen && paymentStatus === "pending" && activeTxn ? (
                activeTxn.cancelable ? (
                  <div className="grid grid-cols-2 gap-2">
                    <CancelDepositAction
                      visible
                      compact
                      direction={mode}
                      amountLabel={formatCurrency(activeTxn.amount, activeTxn.currency)}
                      destinationLabel={activeTxn.destination ?? selectedMethod?.name}
                      onCheck={() => checkCancellation(activeTxn.id)}
                      onConfirm={() => cancelPayment(activeTxn.id)}
                    />
                    <SupportButton
                      label={copy.contactSupport}
                      variant="secondary"
                      size="md"
                      className="gap-1.5 px-3 text-[13px]"
                      onClick={() => triggerSupport({ kind: "fiat", transaction: activeTxn })}
                    />
                  </div>
                ) : (
                  <SupportButton
                    label={copy.contactSupport}
                    variant="secondary"
                    onClick={() => triggerSupport({ kind: "fiat", transaction: activeTxn })}
                  />
                )
              ) : (
                statusScreen && (statusSecondary || statusTertiary) && (
                  <>
                    {statusSecondary && (
                      statusSecondary.support ? (
                        <SupportButton variant="secondary" label={statusSecondary.label} onClick={statusSecondary.run} />
                      ) : (
                        <ActionButton variant="secondary" onClick={statusSecondary.run}>
                          {statusSecondary.label}
                        </ActionButton>
                      )
                    )}
                    {statusTertiary && (
                      statusTertiary.support ? (
                        <SupportButton variant="ghost" size="sm" label={statusTertiary.label} onClick={statusTertiary.run} />
                      ) : (
                        <ActionButton variant="ghost" size="sm" onClick={statusTertiary.run}>
                          {statusTertiary.label}
                        </ActionButton>
                      )
                    )}
                  </>
                )
              )}
            </div>
          </div>
        )}

        <CashierSheet
          open={Boolean(supportContext)}
          title="Contact support"
          onClose={() => setSupportContext(null)}
        >
          {supportSent ? (
            <div className="grid gap-4">
              <div className="grid place-items-center gap-2 rounded-card bg-surface-2 p-5 text-center ring-1 ring-hairline">
                <span className="flex size-10 items-center justify-center rounded-full bg-success-surface text-success">
                  <Check className="size-5" aria-hidden="true" />
                </span>
                <p className="text-[15px] font-semibold text-foreground">Support ticket opened</p>
                {supportContext?.kind === "fiat" && (
                  <p className="text-[12px] leading-4 text-muted-foreground">
                    Reference <span className="font-mono text-foreground">{supportContext.transaction.reference}</span> attached for our team.
                  </p>
                )}
              </div>
              <ActionButton onClick={() => setSupportContext(null)}>Done</ActionButton>
            </div>
          ) : (
            <div className="grid gap-4">
              <p className="text-[14px] leading-5 text-muted-foreground">
                We will attach these transaction details automatically so you don&apos;t have to copy them:
              </p>
              {supportContext?.kind === "fiat" ? (
                <SummaryList>
                  <SummaryRow label="Reference" value={<span className="font-mono text-[12px]">{supportContext.transaction.reference}</span>} />
                  <SummaryRow label="Amount" value={formatCurrency(supportContext.transaction.amount, supportContext.transaction.currency)} />
                  <SummaryRow label="Method" value={supportContext.transaction.method} />
                  <SummaryRow label="Status" value={supportContext.transaction.status} />
                </SummaryList>
              ) : supportContext?.kind === "crypto" ? (
                <SummaryList>
                  <SummaryRow label="Asset" value={supportContext.asset} />
                  <SummaryRow label="Network" value={supportContext.network} />
                </SummaryList>
              ) : null}
              <ActionButton onClick={() => setSupportSent(true)}>Open live chat</ActionButton>
            </div>
          )}
        </CashierSheet>

        <CashierSheet
          open={responsiblePlayOpen}
          title="Responsible play"
          onClose={() => setResponsiblePlayOpen(false)}
        >
          <div className="grid gap-4">
            <p className="text-[14px] leading-5 text-muted-foreground">
              Gambling involves risk and is strictly for players aged 18 and over. Only deposit with payment methods registered in your own name.
            </p>
            <SummaryList>
              <SummaryRow
                label="Account status"
                value={kycState === "verified" ? "Verified" : `Temporary (max ${formatMoney(5000, currency, CASHIER_LOCALE)})`}
              />
              <SummaryRow
                label="Daily deposit limit"
                value={dailyDepositLimit ? formatMoney(dailyDepositLimit, currency, CASHIER_LOCALE) : "Not set"}
              />
              <SummaryRow
                label="License"
                value={effectiveLicenseMode === "pl-licensed" ? "Polish Ministry of Finance (MF)" : "Licensed & regulated"}
              />
            </SummaryList>
            <ActionButton onClick={() => setResponsiblePlayOpen(false)}>Got it</ActionButton>
          </div>
        </CashierSheet>
      </CashierSurface>
    </main>
  )
}
