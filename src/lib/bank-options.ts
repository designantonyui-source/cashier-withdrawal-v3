import type { SheetPickerOption } from "@/components/cashier-ds/primitives"

export const POLISH_BANKS: readonly { name: string; subtitle: string; iconSrc: string }[] = [
  { name: "PKO Bank Polski", subtitle: "iPKO · Instant transfer", iconSrc: "/bank-logos/pkobp.svg" },
  { name: "Bank Pekao", subtitle: "Pekao24 · Instant transfer", iconSrc: "/bank-logos/pekao.svg" },
  { name: "mBank", subtitle: "Instant bank confirmation", iconSrc: "/bank-logos/mbank.svg" },
  { name: "ING Bank Śląski", subtitle: "Moje ING · Instant transfer", iconSrc: "/bank-logos/ing.svg" },
  { name: "Santander Bank Polska", subtitle: "Santander Internet", iconSrc: "/bank-logos/santander.svg" },
  { name: "Millennium Bank", subtitle: "Millenet", iconSrc: "/bank-logos/millennium.svg" },
  { name: "Alior Bank", subtitle: "Alior Online", iconSrc: "/bank-logos/alior.svg" },
  { name: "BNP Paribas", subtitle: "GOonline", iconSrc: "/bank-logos/bnp.svg" },
  { name: "Credit Agricole", subtitle: "CA24", iconSrc: "/bank-logos/credit-agricole.svg" },
]

const BANK_META: Record<string, { iconSrc?: string; subtitle: string }> = {
  ...Object.fromEntries(POLISH_BANKS.map((bank) => [bank.name, { iconSrc: bank.iconSrc, subtitle: bank.subtitle }])),
  ING: { iconSrc: "/bank-logos/ing.svg", subtitle: "Moje ING" },
  Santander: { iconSrc: "/bank-logos/santander.svg", subtitle: "Santander Internet" },
  "Other bank": { subtitle: "Select your Polish bank on redirect" },
}

export function getBankLogoSrc(name: string): string | undefined {
  return BANK_META[name]?.iconSrc
}

export function toBankPickerOptions(names: string[]): SheetPickerOption[] {
  return names.map((name) => {
    const meta = BANK_META[name]
    return {
      value: name,
      label: name,
      subtitle: meta?.subtitle,
      iconSrc: meta?.iconSrc,
    }
  })
}

export function toIdBankPickerOptions(items: { id: string; name: string }[]): SheetPickerOption[] {
  return items.map((item) => {
    const meta = BANK_META[item.name]
    return {
      value: item.id,
      label: item.name,
      subtitle: meta?.subtitle,
      iconSrc: meta?.iconSrc,
    }
  })
}
