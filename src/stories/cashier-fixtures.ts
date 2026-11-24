import type { ComponentProps } from "react"
import App from "@/App"

export const depositTransaction = { id: 2, reference: "TXN-DEPOSIT-1", createdAt: "2026-11-07T18:00:00Z", method: "Card", amount: 100, fee: 3, currency: "PLN" as const, status: "success" as const, direction: "deposit" as const }
export const withdrawalTransaction = { id: 1, reference: "TXN-4F82B1C9", createdAt: "2026-11-07T19:00:00Z", method: "Card", amount: 50, fee: 1.5, currency: "PLN" as const, status: "success" as const, direction: "withdrawal" as const, destination: "Visa •••• 4242", eta: "1–2 business days" }
export const bankDepositTransaction = { ...depositTransaction, id: 3, method: "Bank transfer" }

const longTransactionStatuses = ["pending", "success", "failed", "canceled", "expired"] as const
export const longTransactions: NonNullable<ComponentProps<typeof App>>["initialTransactions"] = Array.from({ length: 14 }, (_, index) => {
  const createdAt = new Date(Date.UTC(2026, 10, 8) - index * 3 * 24 * 60 * 60 * 1000).toISOString()
  return {
    id: 200 + index,
    reference: `TXN-LONG-${index + 1}`,
    createdAt,
    method: index % 2 === 0 ? "BLIK" : "Card",
    amount: 20 + index * 10,
    fee: index % 2 === 0 ? 0 : (20 + index * 10) * 0.03,
    currency: "PLN",
    status: longTransactionStatuses[index % longTransactionStatuses.length],
    delayed: index === 0,
    chargeState: index === 0 ? "not_charged" : undefined,
    cancelable: index === 0,
  }
})
