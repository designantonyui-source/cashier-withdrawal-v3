import { Clock, Wallet } from "lucide-react"
import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

import type { Currency, SavedCryptoAddress } from "@/types"

import { CASHIER_LOCALE, formatCurrency } from "@/lib/currency"
import {
  currencyExponent,
  formatMoney,
  formatReceipt,
  normalizeAmountInput,
  roundToExponent,
} from "@/components/cashier-ds/money"
import {
  ActionButton,
  CurrencyAmountField,
  InlineNotice,
  QuickAmounts,
  SecureTransactionNote,
  SelectionIndicator,
  SummaryList,
  SummaryRow,
} from "@/components/cashier-ds/primitives"
import { FloatingInput } from "@/components/ui/floating-input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"

const ASSET_NETWORKS: Record<string, string[]> = {
  USDT: ["Tron (TRC20)", "Ethereum (ERC20)"],
  BTC: ["Bitcoin"],
  ETH: ["Ethereum"],
  SOL: ["Solana"],
}

/** Fiat per one unit of the asset. Production quotes come from the provider. */
const ASSET_RATES: Record<string, number> = {
  USDT: 4,
  BTC: 150000,
  ETH: 8000,
  SOL: 500,
}

/** Network fee in the account currency. */
const ASSET_FEES: Record<string, number> = {
  USDT: 5,
  BTC: 15,
  ETH: 8,
  SOL: 5,
}

/** The decimals each asset is actually quoted with. */
const ASSET_DECIMALS: Record<string, number> = {
  USDT: 6,
  BTC: 8,
  ETH: 6,
  SOL: 9,
}

/** How long a quote stays valid before the user must refresh it. */
const RATE_TTL_MS = 60_000
const RATE_WARNING_MS = 15_000

type QuoteState = "active" | "expiring" | "expired"

function isValidAddress(network: string, address: string) {
  if (!address) return false
  if (network.startsWith("Tron")) return /^T[a-zA-Z0-9]{33}$/.test(address)
  if (network.startsWith("Ethereum")) return /^0x[a-fA-F0-9]{40}$/.test(address)
  if (network === "Bitcoin") return /^(bc1[a-z0-9]{25,62}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(address)
  if (network === "Solana") return /^[A-HJ-NP-Za-km-z1-9]{32,44}$/.test(address)
  return address.length >= 20
}

function shortenAddress(address: string) {
  if (address.length <= 16) return address
  return `${address.slice(0, 8)}…${address.slice(-6)}`
}

/** Asset amounts keep their own precision and drop trailing zeros. */
function formatAssetAmount(value: number, decimals: number) {
  const trimmed = value
    .toFixed(decimals)
    .replace(/(\.\d*?[1-9])0+$/, "$1")
    .replace(/\.0+$/, "")
  const [whole, fraction = ""] = trimmed.split(".")
  return `${whole}.${fraction.padEnd(2, "0")}`
}

function formatCountdown(milliseconds: number) {
  const total = Math.max(0, Math.floor(milliseconds / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

function CryptoAmountPicker({ amount, currency, error, onChange, maxAmount, feeAwareMax }: { amount: string; currency: Currency; error: string | null; onChange: (value: string) => void; maxAmount: number; feeAwareMax: number }) {
  const numeric = Number(amount || "0")
  const quickValues = [20, 50, 100, 250].filter((value) => value <= feeAwareMax)
  return (
    <div className="grid gap-2.5 rounded-card bg-surface-2 p-3.5 ring-1 ring-hairline">
      <div className="grid gap-1.5">
        <CurrencyAmountField
          id="crypto-withdraw-amount"
          label="Withdrawal amount"
          value={amount}
          currency={currency}
          locale={CASHIER_LOCALE}
          error={Boolean(error)}
          describedBy={error ? "crypto-withdraw-amount-error" : "crypto-withdraw-amount-hint"}
          onChange={onChange}
        />
        {error ? (
          <p id="crypto-withdraw-amount-error" className="text-[12px] leading-4 text-danger" role="alert">{error}</p>
        ) : (
          <p id="crypto-withdraw-amount-hint" className="text-[12px] leading-4 text-muted-foreground tabular-nums">
            Available {formatMoney(maxAmount, currency, CASHIER_LOCALE)}
          </p>
        )}
      </div>
      {feeAwareMax > 0 ? <button type="button" onClick={() => onChange(feeAwareMax.toFixed(currencyExponent(currency)))} className="justify-self-start rounded text-[12px] font-medium leading-4 text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Use maximum {formatMoney(feeAwareMax, currency, CASHIER_LOCALE)}</button> : <p className="text-[12px] leading-4 text-muted-foreground">Your balance does not cover the network fee. Add funds to continue.</p>}
      {quickValues.length > 1 && (
        <QuickAmounts
          amounts={quickValues}
          format={(value) => value.toLocaleString(CASHIER_LOCALE)}
          value={quickValues.includes(numeric) ? numeric : null}
          surface="card"
          onSelect={(value) => onChange(String(value))}
        />
      )}
    </div>
  )
}

type CryptoWithdrawalProps = {
  balance: number
  currency: Currency
  savedAddresses: SavedCryptoAddress[]
  onSaveAddress: (address: Omit<SavedCryptoAddress, "id">) => void
  onConfirm: (details: { asset: string; network: string; address: string; amount: number; fee: number }) => void
  onCancel: () => void
}

export function CryptoWithdrawal({ balance, currency, savedAddresses, onSaveAddress, onConfirm, onCancel }: CryptoWithdrawalProps) {
  const [step, setStep] = useState<"address" | "amount" | "review">("address")
  const [asset, setAsset] = useState("USDT")
  const [network, setNetwork] = useState(ASSET_NETWORKS.USDT[0])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [address, setAddress] = useState("")
  const [addressName, setAddressName] = useState("")
  const [amount, setAmount] = useState("")
  const [addingAddress, setAddingAddress] = useState(false)
  const [addressError, setAddressError] = useState<string | null>(null)
  const [rate, setRate] = useState(ASSET_RATES.USDT ?? 1)
  const [rateAt, setRateAt] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())

  const exponent = currencyExponent(currency)
  const fee = ASSET_FEES[asset] ?? 5
  const parsedAmount = Number(normalizeAmountInput(amount, CASHIER_LOCALE, exponent) || "0")
  const cryptoAmount = parsedAmount > 0 ? parsedAmount / rate : 0
  const total = roundToExponent(parsedAmount + fee, exponent)
  const amountValid = total <= balance && parsedAmount > 0 && Number.isFinite(parsedAmount)
  const amountError = parsedAmount <= 0
    ? null
    : total > balance
      ? "Amount and network fee exceed your available balance."
      : null

  const remaining = Math.max(0, rateAt + RATE_TTL_MS - now)
  const quoteState: QuoteState = remaining <= 0 ? "expired" : remaining <= RATE_WARNING_MS ? "expiring" : "active"

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const filteredAddresses = savedAddresses.filter((item) => item.asset === asset && item.network === network)
  const selectedAddress = filteredAddresses.find((item) => item.id === selectedAddressId) ?? null
  const canProceedToAmount = Boolean(selectedAddress) || (address.length > 0 && isValidAddress(network, address))
  const canReview = amountValid && canProceedToAmount && quoteState !== "expired"

  const selectAsset = (nextAsset: string) => {
    setAsset(nextAsset)
    setNetwork(ASSET_NETWORKS[nextAsset][0])
    setSelectedAddressId(null)
    setAddress("")
    setAddressName("")
    setAddressError(null)
    setRate(ASSET_RATES[nextAsset] ?? 1)
    setRateAt(Date.now())
    setNow(Date.now())
  }

  const refreshRate = () => {
    setRate(ASSET_RATES[asset] ?? 1)
    setRateAt(Date.now())
    setNow(Date.now())
  }

  const saveAddress = () => {
    if (!addressName.trim()) {
      setAddressError("Enter a name for this address.")
      return
    }
    if (!isValidAddress(network, address)) {
      setAddressError("Check the address format for this network.")
      return
    }
    onSaveAddress({ name: addressName.trim(), asset, network, address: address.trim() })
    setAddress("")
    setAddressName("")
    setAddingAddress(false)
    setAddressError(null)
  }

  const confirm = () => {
    if (!canReview) return
    const destination = selectedAddress?.address ?? address.trim()
    onConfirm({ asset, network, address: destination, amount: parsedAmount, fee })
  }

  const stepIndex = step === "address" ? 1 : step === "amount" ? 2 : 3
  const stepLabel = step === "address" ? "Destination" : step === "amount" ? "Amount" : "Review"
  const rateTakenAt = new Intl.DateTimeFormat(CASHIER_LOCALE, { hour: "2-digit", minute: "2-digit" }).format(new Date(rateAt))

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div className="grid gap-4">
          <p className="text-[13px] leading-5 text-muted-foreground">
            Step {stepIndex} of 3 · {stepLabel}
          </p>

          {step === "address" ? (
            <>
              <div className="grid gap-2">
                <Label htmlFor="crypto-withdraw-asset" className="text-[13px] text-muted-foreground">Asset</Label>
                <NativeSelect id="crypto-withdraw-asset" value={asset} onChange={(event) => selectAsset(event.target.value)} className="w-full [&_select]:h-14">
                  {Object.keys(ASSET_NETWORKS).map((option) => (
                    <NativeSelectOption key={option} value={option}>{option}</NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="crypto-withdraw-network" className="text-[13px] text-muted-foreground">Network</Label>
                <NativeSelect id="crypto-withdraw-network" value={network} onChange={(event) => { setNetwork(event.target.value); setSelectedAddressId(null); setAddress("") }} className="w-full [&_select]:h-14">
                  {ASSET_NETWORKS[asset].map((option) => (
                    <NativeSelectOption key={option} value={option}>{option}</NativeSelectOption>
                  ))}
                </NativeSelect>
                <p className="text-[13px] leading-5 text-muted-foreground">
                  The network must match your wallet. Sending on another network may result in loss of funds.
                </p>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-medium">Saved addresses</span>
                  <button
                    type="button"
                    onClick={() => setAddingAddress((open) => !open)}
                    className="text-[13px] font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  >
                    {addingAddress ? "Cancel" : "Add address"}
                  </button>
                </div>

                {filteredAddresses.length > 0 ? (
                  <div className="grid gap-2">
                    {filteredAddresses.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => { setSelectedAddressId(item.id); setAddress(""); setAddressError(null) }}
                        className={cn(
                          "flex items-center gap-3 rounded-card bg-surface-2 p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          selectedAddressId === item.id && "ring-1 ring-primary/70",
                        )}
                      >
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-3 text-foreground ring-1 ring-hairline" aria-hidden="true">
                          <Wallet className="size-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[17px] font-medium leading-6">{item.name}</span>
                          <span className="block truncate font-mono text-[13px] leading-5 text-muted-foreground">{shortenAddress(item.address)}</span>
                        </span>
                        <SelectionIndicator selected={selectedAddressId === item.id} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-card border border-dashed border-hairline px-4 py-5 text-[13px] leading-5 text-muted-foreground">
                    No saved addresses for {asset} on {network}.
                  </p>
                )}

                {addingAddress ? (
                  <div className="grid gap-3 rounded-card bg-surface-2 p-4">
                    <div className="grid gap-2">
                      <FloatingInput
                        id="crypto-address-name"
                        label="Name"
                        autoComplete="off"
                        value={addressName}
                        onChange={(event) => setAddressName(event.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <FloatingInput
                        id="crypto-address"
                        label="Wallet address"
                        autoComplete="off"
                        value={address}
                        onChange={(event) => { setAddress(event.target.value); setAddressError(null) }}
                        error={Boolean(addressError)}
                        aria-invalid={Boolean(addressError)}
                        inputClassName="font-mono text-[15px]"
                      />
                      {addressError && <p className="text-xs text-danger" role="alert">{addressError}</p>}
                    </div>
                    <ActionButton onClick={saveAddress}>Save address</ActionButton>
                  </div>
                ) : null}
              </div>

              <InlineNotice tone="warning" title={`Only send ${asset} on ${network}`}>
                Sending another asset or network may result in loss of funds.
              </InlineNotice>
            </>
          ) : null}

          {step === "amount" ? (
            <>
              <div className="grid gap-2 rounded-card bg-surface-2 p-4">
                <p className="text-[13px] leading-5 text-muted-foreground">Withdrawal address</p>
                <p className="break-all font-mono text-[15px] leading-6">{selectedAddress?.address ?? address}</p>
                <p className="text-[13px] leading-5 text-muted-foreground">{network}</p>
              </div>

              <CryptoAmountPicker
                amount={amount}
                currency={currency}
                error={amountError}
                onChange={setAmount}
                maxAmount={balance}
                feeAwareMax={Math.max(0, roundToExponent(balance - fee, exponent))}
              />

              <SummaryList>
                  <SummaryRow label="You withdraw" value={formatCurrency(parsedAmount || 0, currency)} />
                  <SummaryRow label="You receive" value={`≈ ${formatAssetAmount(cryptoAmount, ASSET_DECIMALS[asset] ?? 6)} ${asset}`} />
                  <SummaryRow label="Network" value={network} />
                  <SummaryRow label="Rate" value={`1 ${asset} = ${formatReceipt(rate, currency, CASHIER_LOCALE)}`} />
                  <SummaryRow label="Fee" value={formatCurrency(fee, currency)} />
                  <SummaryRow label="Total deducted" value={formatCurrency(total, currency)} emphasis />
                </SummaryList>

              <div className="rounded-card bg-surface-2 p-4">
                {quoteState === "expired" ? (
                  <div className="grid gap-2">
                    <p className="flex items-center gap-2 text-[15px] font-medium text-warning">
                      <Clock className="size-4" aria-hidden="true" />
                      Rate expired
                    </p>
                    <p className="text-[13px] leading-5 text-muted-foreground">
                      The price moved on while you were away. Update the rate to continue.
                    </p>
                    <ActionButton variant="secondary" size="md" fullWidth={false} onClick={refreshRate}>
                      Update rate
                    </ActionButton>
                  </div>
                ) : (
                  <div className="grid gap-1">
                    <p className="text-[15px] font-medium">
                      1 {asset} = {formatReceipt(rate, currency, CASHIER_LOCALE)}
                    </p>
                    <p
                      className={cn(
                        "flex items-center gap-2 text-[13px] leading-5",
                        quoteState === "expiring" ? "text-warning" : "text-muted-foreground",
                      )}
                    >
                      {quoteState === "expiring" ? (
                        <>
                          <Clock className="size-4" aria-hidden="true" />
                          Rate expires in {formatCountdown(remaining)}
                        </>
                      ) : (
                        `Rate as of ${rateTakenAt}`
                      )}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : null}

          {step === "review" ? (
            <>
              <div className="grid gap-2 rounded-card bg-surface-2 p-4">
                <p className="text-[13px] leading-5 text-muted-foreground">Withdraw to</p>
                <p className="text-[17px] font-medium leading-6">{selectedAddress?.name ?? "New address"}</p>
                <p className="break-all font-mono text-[13px] leading-5 text-muted-foreground">{selectedAddress?.address ?? address}</p>
                <p className="text-[13px] leading-5 text-muted-foreground">{asset} · {network}</p>
              </div>

              <SummaryList>
                  <SummaryRow label="You withdraw" value={formatCurrency(parsedAmount || 0, currency)} />
                  <SummaryRow label="You receive" value={`≈ ${formatAssetAmount(cryptoAmount, ASSET_DECIMALS[asset] ?? 6)} ${asset}`} />
                  <SummaryRow label="Network" value={network} />
                  <SummaryRow label="Rate" value={`1 ${asset} = ${formatReceipt(rate, currency, CASHIER_LOCALE)}`} />
                  <SummaryRow label="Fee" value={formatCurrency(fee, currency)} />
                  <SummaryRow label="Total deducted" value={formatCurrency(total, currency)} emphasis />
                </SummaryList>

              <InlineNotice tone="warning" title="Double-check the address and network">
                Crypto withdrawals are irreversible. Sending to the wrong network or address may result in loss of funds.
              </InlineNotice>
            </>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 px-5 pb-6 pt-4 shadow-[var(--shadow-medium)]">
        <div className="grid gap-2">
          {step === "address" ? (
            <>
              <ActionButton disabled={!canProceedToAmount} onClick={() => setStep("amount")}>
                Continue
              </ActionButton>
              <button
                type="button"
                onClick={onCancel}
                className="justify-self-center rounded text-[13px] font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Cancel withdrawal
              </button>
            </>
          ) : null}

          {step === "amount" ? (
            <>
              <ActionButton variant="secondary" onClick={() => setStep("address")}>Back</ActionButton>
              <ActionButton disabled={!canReview} onClick={() => setStep("review")}>Review</ActionButton>
            </>
          ) : null}

          {step === "review" ? (
            <>
              <ActionButton variant="secondary" onClick={() => setStep("amount")}>Back</ActionButton>
              <ActionButton disabled={!canReview} onClick={confirm}>Confirm withdrawal</ActionButton>
              <SecureTransactionNote methodName={asset} />
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
