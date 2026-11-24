import type { Currency } from "@/types"

import { formatReceipt } from "@/components/cashier-ds/money"

/**
 * The cashier renders in English for the Polish market, so copy and dates stay
 * `en-GB` while amounts use the Polish number format: the PLN code goes
 * after the number (`10 PLN`, `50,00 PLN`) with a comma decimal. Prefixing
 * `PLN 100.00` is the English position and reads as wrong in Polish.
 */
export const CASHIER_LOCALE = "pl-PL"

export function formatCurrency(value: number, currency: Currency) {
  return formatReceipt(value, currency, CASHIER_LOCALE)
}
