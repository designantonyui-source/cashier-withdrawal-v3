export function isCryptoCreditPending(transfer: { status: "detected" | "confirming" | "credited"; confirmations: number; requiredConfirmations: number }) {
  return transfer.status === "confirming" && transfer.requiredConfirmations > 0 && transfer.confirmations >= transfer.requiredConfirmations
}
