export type Currency = "EUR" | "PLN" | "USD"
export type TransactionDirection = "deposit" | "withdrawal"

export type SavedCryptoAddress = {
  id: string
  name: string
  asset: string
  network: string
  address: string
}
