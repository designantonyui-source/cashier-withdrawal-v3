/**
 * Money helpers for the cashier.
 *
 * PLN always renders as the code (`10 PLN`, `1 234,50 PLN`): entry surfaces
 * and receipts share the same affix so the widget never mixes `zł` and `PLN`.
 * Other currencies keep the currency's narrow symbol on entry surfaces (the
 * Polish market writes it after the number, English before it: `1 234,50 zł`
 * would be the symbol form, `$1,234.50` in English).
 * Receipts and summaries always use the code in the locale's position too
 * (`50,00 PLN`), so a receipt stays unambiguous when it is read next to
 * another currency.
 *
 * The number of decimals comes from the currency exponent, never from a
 * hardcoded `2`. Amounts are handled as numbers here; callers that need exact
 * arithmetic should work in minor units.
 */

export const CURRENCY_EXPONENTS: Record<string, number> = {
  // 0 decimals
  JPY: 0,
  KRW: 0,
  VND: 0,
  CLP: 0,
  ISK: 0,
  XOF: 0,
  XAF: 0,
  XPF: 0,
  PYG: 0,
  RWF: 0,
  UGX: 0,
  VUV: 0,
  KMF: 0,
  DJF: 0,
  GNF: 0,
  BIF: 0,
  // 2 decimals
  EUR: 2,
  USD: 2,
  GBP: 2,
  PLN: 2,
  UAH: 2,
  TRY: 2,
  BRL: 2,
  INR: 2,
  NGN: 2,
  ZAR: 2,
  SEK: 2,
  NOK: 2,
  DKK: 2,
  CZK: 2,
  HUF: 2,
  // 3 decimals
  BHD: 3,
  IQD: 3,
  JOD: 3,
  KWD: 3,
  LYD: 3,
  OMR: 3,
  TND: 3,
  // 4 decimals
  CLF: 4,
}

export function currencyExponent(currency: string) {
  return CURRENCY_EXPONENTS[currency?.toUpperCase() ?? ""] ?? 2
}

/** Rounds once, at the currency's precision. Never round an intermediate. */
export function roundToExponent(value: number, exponent: number) {
  const factor = 10 ** exponent
  return Math.round((value + Number.EPSILON) * factor) / factor
}

const separatorCache = new Map<string, { decimal: string; group: string }>()

/** The decimal and group separators the locale actually uses. */
export function localeSeparators(locale: string) {
  const cached = separatorCache.get(locale)
  if (cached) return cached

  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6)
  const separators = {
    decimal: parts.find((part) => part.type === "decimal")?.value ?? ".",
    group: parts.find((part) => part.type === "group")?.value ?? ",",
  }

  separatorCache.set(locale, separators)
  return separators
}

export function currencySymbol(currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: currencyDisplayFor(currency),
  })
    .formatToParts(0)
    .find((part) => part.type === "currency")?.value
}

/** PLN renders as its code everywhere (`10 PLN`); other currencies use the narrow symbol on entry. */
function currencyDisplayFor(currency: string) {
  return currency.toUpperCase() === "PLN" ? ("code" as const) : ("narrowSymbol" as const)
}

/** Entry-surface money: PLN code, other currencies narrow symbol; locale position and separators. */
export function formatMoney(
  value: number,
  currency = "USD",
  locale = "en-US",
  options: { showDecimals?: boolean } = {},
) {
  const exponent = currencyExponent(currency)
  const showDecimals = options.showDecimals ?? !Number.isInteger(value)

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: currencyDisplayFor(currency),
    useGrouping: "always",
    minimumFractionDigits: showDecimals ? exponent : 0,
    maximumFractionDigits: exponent,
  }).format(value)
}

/** Plain number with consistent thousands separator (e.g. `1 000` in Polish). */
export function formatNumber(value: number, locale = "pl-PL") {
  return new Intl.NumberFormat(locale, {
    useGrouping: "always",
  }).format(value)
}

/** Receipt money: the currency code, so a receipt never reads ambiguously. */
export function formatReceipt(value: number, currency = "USD", locale = "en-US") {
  const exponent = currencyExponent(currency)

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "code",
    useGrouping: "always",
    minimumFractionDigits: exponent,
    maximumFractionDigits: exponent,
  }).format(value)
}

function wholeFormatter(currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: currencyDisplayFor(currency),
    useGrouping: "always",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

/**
 * Normalises typed text into a canonical amount string: digits, an optional
 * `.` decimal separator, and at most `exponent` decimals.
 *
 * The locale decides how a separator is read:
 *
 * - The locale's **decimal** separator is always a decimal point. `1.50` stays
 *   `1.50`; `1.500` is truncated to the currency's precision instead of being
 *   read as one thousand five hundred.
 * - The locale's **group** separator groups thousands when it is followed by
 *   exactly three digits (`1,234` → `1234`), and is read as a decimal point
 *   when fewer digits follow (`1,23` → `1.23`).
 */
export function normalizeAmountInput(raw: string, locale = "en-US", exponent = 2) {
  const cleaned = raw.replace(/[\s\u00a0\u202f']/g, "").replace(/[^\d.,]/g, "")
  if (!cleaned) return ""

  const { decimal, group } = localeSeparators(locale)
  if (decimal === group) return cleaned.replace(/[.,]/g, "").slice(0, 9)

  const lastDecimal = cleaned.lastIndexOf(decimal)
  const lastGroup = cleaned.lastIndexOf(group)
  const lastIndex = Math.max(lastDecimal, lastGroup)
  if (lastIndex === -1) return cleaned.slice(0, 9)

  const head = cleaned.slice(0, lastIndex)
  const tail = cleaned.slice(lastIndex + 1).replace(/[^\d]/g, "")

  if (cleaned[lastIndex] === decimal) {
    const whole = head.replace(/[.,]/g, "")
    if (whole.length > 9) return whole.slice(0, 9)
    if (!whole && !tail) return "0."
    return tail ? `${whole || "0"}.${tail.slice(0, exponent)}` : `${whole || "0"}.`
  }

  const whole = head.replace(/[.,]/g, "")
  if (!whole && !tail) return "0."
  if (tail.length === 3 && exponent < 3) return `${whole}${tail}`.slice(0, 9)
  if (tail.length <= exponent) return `${whole || "0"}.${tail}`
  return `${whole}${tail}`.slice(0, 9)
}

/** Keeps a typed value canonical while the user is still typing. */
export function sanitizeAmountInput(value: string, locale = "en-US", exponent = 2) {
  return normalizeAmountInput(value, locale, exponent)
}

export function parseAmount(raw: string, locale = "en-US", exponent = 2) {
  const canonical = normalizeAmountInput(raw, locale, exponent)
  const value = Number(canonical)
  return Number.isFinite(value) ? value : 0
}

/**
 * The live text for the amount display: the grouped whole part in the
 * currency's entry affix (PLN code, other currencies narrow symbol), with
 * exactly the decimals the user typed. The affix keeps the locale's
 * position — before the number in English (`$1,234.50`) and after it in
 * Polish (`1 234,50 PLN`) — so the typed fraction is inserted on the
 * correct side of the affix.
 */
export function formatAmountInput(raw: string, currency = "USD", locale = "en-US") {
  const canonical = normalizeAmountInput(raw, locale, currencyExponent(currency))
  const [whole = "", fraction] = canonical.split(".")
  const format = wholeFormatter(currency, locale)

  if (!whole && !fraction) return format.format(0)
  if (!fraction) return format.format(Number(whole || "0"))

  // Re-format the full value so the grouping, decimal separator and the
  // affix position all come from Intl — a Polish suffix (`1 234,50 PLN`)
  // must not come out as `1 234 PLN,50`.
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: currencyDisplayFor(currency),
    minimumFractionDigits: fraction.length,
    maximumFractionDigits: fraction.length,
  }).format(Number(canonical))
}
