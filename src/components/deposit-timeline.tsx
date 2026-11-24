import { CircleCheck, CircleX, Clock } from "lucide-react"
import { blikCopy, type CashierLocale } from "@/blik-copy"
import { isCryptoCreditPending } from "@/lib/crypto-progress"

type CryptoTransfer = { status: "detected" | "confirming" | "credited"; confirmations: number; requiredConfirmations: number }
type FiatStatus = "pending" | "success" | "failed" | "canceled" | "expired" | "unknown"
type StepState = "complete" | "current" | "failed" | "canceled" | "expired" | "unreached" | "upcoming"

export function DepositTimelineStep({ title, detail, state, connector = false, connectorComplete = false, mutedComplete = false, current = false }: {
  title: string
  detail?: string
  state: StepState
  connector?: boolean
  connectorComplete?: boolean
  mutedComplete?: boolean
  current?: boolean
}) {
  const mutedTitle = state === "upcoming" || state === "unreached"
  const stopped = state === "failed" || state === "canceled"
  return <li aria-current={current ? "step" : undefined} className="relative flex gap-3 pb-4 last:pb-0">
    {connector && <span className={`absolute bottom-0 left-[10px] top-6 w-px -translate-x-1/2 ${connectorComplete ? "bg-success/60" : "bg-border"}`} aria-hidden="true" />}
    <span className="relative z-10 flex size-5 shrink-0 items-center justify-center" aria-hidden="true">
      {state === "complete" ? <CircleCheck className={`size-5 ${mutedComplete ? "text-muted-foreground" : "text-success"}`} />
        : stopped ? <CircleX className={`size-5 ${state === "canceled" ? "text-muted-foreground" : "text-destructive"}`} />
        : state === "current" ? <Clock className="size-5 text-warning" />
        : state === "expired" ? <Clock className="size-5 text-muted-foreground" />
        : <span className="size-4 rounded-full border-2 border-text-tertiary" />}
    </span>
    <span className="grid min-w-0 gap-1"><span className={`text-sm leading-5 ${state === "current" ? "font-semibold" : "font-medium"} ${mutedTitle ? "text-muted-foreground" : "text-foreground"}`}>{title}</span>{detail ? <span className="text-xs leading-4 text-muted-foreground">{detail}</span> : null}</span>
  </li>
}

export function DepositTimeline(props: { kind: "crypto"; transfer: CryptoTransfer } | { kind: "fiat"; status: FiatStatus; method?: string; flow?: "card" | "wallet" | "bank" | "blik"; declineReason?: "bank" | "funds" | "technical" | "provider" | "card"; chargeState?: "not_charged" | "charged" | "unknown"; locale?: CashierLocale; delayed?: boolean }) {
  const transfer = props.kind === "crypto" ? props.transfer : null
  const fiat = props.kind === "fiat" ? props : null
  const copy = blikCopy[fiat?.locale ?? "en-GB"]

  const completed = transfer ? transfer.status === "credited" : fiat?.status === "success"
  const creditPending = transfer ? isCryptoCreditPending(transfer) : false
  const failed = fiat?.status === "failed"
  const canceled = fiat?.status === "canceled"
  const expired = fiat?.status === "expired"
  const unknown = fiat?.status === "unknown"
  const terminal = Boolean(failed || canceled || expired)
  const currentIndex = transfer ? creditPending ? 2 : { detected: 0, confirming: 1, credited: 2 }[transfer.status] : fiat?.status === "success" ? 2 : 1
  const failedDetail = fiat?.declineReason === "bank" ? "Your bank declined it."
    : fiat?.declineReason === "funds" ? "Your bank declined it for insufficient funds."
    : copy.failedDetail
  const startedDetail = fiat?.flow === "card" ? "We sent the payment to your card provider."
    : fiat?.flow === "bank" ? "We sent the transfer request to your bank."
    : fiat?.flow === "wallet" ? "We sent the payment to your provider."
    : copy.startedDetail
  const confirmedDetail = fiat?.flow === "bank" ? "The transfer arrived."
    : fiat?.flow === "wallet" ? "Confirmed by your provider."
    : copy.confirmedDetail
  const pendingDetail = fiat?.flow === "bank" ? "Waiting for the transfer to arrive."
    : fiat?.flow === "wallet" ? "Waiting for your provider to confirm."
    : copy.pendingDetail
  const balanceFuture = fiat?.flow === "bank" ? "After the transfer arrives." : copy.balanceFuture

  const steps = transfer ? [
    { title: "Detected", detail: "Transfer found on the network." },
    { title: "Confirming", detail: transfer.status === "detected" ? "Waiting for network confirmations." : `${Math.min(transfer.confirmations, transfer.requiredConfirmations)} of ${transfer.requiredConfirmations} network confirmations.` },
    { title: completed ? "Added to your balance" : "Waiting to be added", detail: completed ? "Your deposit is available." : creditPending ? "Network confirmations complete. Waiting for balance credit." : "After the required confirmations." },
  ] : [
    { title: copy.startedStep, detail: startedDetail },
    {
      title: completed ? copy.confirmedStep : canceled ? copy.canceledStep : failed ? copy.failedStep : expired ? copy.expiredStep : unknown || fiat?.delayed ? copy.checkingStep : copy.pendingStep,
      detail: completed ? confirmedDetail
        : canceled ? copy.canceledDetail
        : failed ? failedDetail
        : expired ? copy.expiredDetail
        : unknown || fiat?.delayed ? copy.checkingDetail
        : fiat?.flow === "blik" ? undefined
        : fiat?.method === "Card" ? "Confirm the payment if your bank asks."
        : pendingDetail,
    },
    { title: copy.balanceStep, detail: completed ? copy.balanceDone : terminal ? undefined : balanceFuture },
  ]

  return <ol className="grid" aria-label={transfer ? "Deposit progress" : "Deposit status"}>{steps.map((step, index) => {
    const state: StepState = completed
      ? "complete"
      : index < currentIndex
        ? "complete"
        : index === currentIndex
          ? failed ? "failed" : canceled ? "canceled" : expired ? "expired" : "current"
          : terminal ? "unreached" : "upcoming"
    const isBalanceStep = index === steps.length - 1
    const title = isBalanceStep && !transfer ? (completed ? copy.balanceStep : terminal ? copy.balanceNotAdded : copy.balanceWillAdd) : step.title
    const detail = isBalanceStep && !transfer && !completed && !terminal ? balanceFuture : step.detail
    return <DepositTimelineStep key={title} title={title} detail={detail} state={state} current={state === "current"} connector={index < steps.length - 1} connectorComplete={completed || (!terminal && index < currentIndex)} mutedComplete={!transfer && terminal && index < currentIndex} />
  })}</ol>
}
