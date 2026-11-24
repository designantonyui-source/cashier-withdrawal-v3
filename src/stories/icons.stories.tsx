import type { Meta, StoryObj } from "@storybook/react-vite"
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
import { CreditCard, Landmark } from "lucide-react"
import { AllIcons } from "@/components/cashier-ds/icons"
import { PaymentChip } from "@/components/cashier-ds/primitives"
import { POLISH_BANKS } from "@/lib/bank-options"

const meta: Meta = {
  title: "Cashier/Design system/Icons",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The complete cashier icon and brand-mark inventory: Lucide UI glyphs, 9 Polish bank SVG logos, and 50×32 PaymentChip payment method marks.",
      },
    },
  },
}
export default meta
type Story = StoryObj

const categories = [...new Set(AllIcons.map((i) => i.category))]

const paymentBrandMarks = [
  { name: "BLIK", node: <PaymentBlik variant="light" size={30} className="shrink-0" aria-hidden="true" /> },
  { name: "Przelewy24", node: <PaymentPrzelewy24 variant="light" size={30} className="shrink-0" aria-hidden="true" /> },
  { name: "Card", node: <CreditCard className="size-5 text-[#111111]" aria-hidden="true" /> },
  { name: "Visa", node: <PaymentVisa variant="light" size={30} className="shrink-0" aria-hidden="true" /> },
  { name: "Mastercard", node: <PaymentMastercard variant="light" size={30} className="shrink-0" aria-hidden="true" /> },
  { name: "Bank transfer", node: <Landmark className="size-5 text-[#111111]" aria-hidden="true" /> },
  { name: "Apple Pay", node: <PaymentApplepay variant="light" size={30} className="shrink-0" aria-hidden="true" /> },
  { name: "Google Pay", node: <PaymentGooglePay variant="light" size={30} className="shrink-0" aria-hidden="true" /> },
  { name: "PayPal", node: <PaymentPaypal variant="light" size={30} className="shrink-0" aria-hidden="true" /> },
  { name: "Trustly", node: <PaymentTrustly variant="light" size={30} className="shrink-0" aria-hidden="true" /> },
  { name: "Paysafecard", node: <PaymentPaysafecard variant="light" size={30} className="shrink-0" aria-hidden="true" /> },
  { name: "Skrill", node: <PaymentSkrill variant="light" size={30} className="shrink-0" aria-hidden="true" /> },
  { name: "Neteller", node: <PaymentNeteller variant="light" size={30} className="shrink-0" aria-hidden="true" /> },
  { name: "SEPA", node: <PaymentSepa variant="light" size={30} className="shrink-0" aria-hidden="true" /> },
] as const

export const Inventory: Story = {
  render: () => (
    <div className="min-h-svh bg-background px-5 py-10 text-foreground">
      <div className="mx-auto grid w-full max-w-5xl gap-10">
        <div className="max-w-2xl">
          <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Icons & Brand Marks</h1>
          <p className="mt-1 text-[15px] leading-6 text-muted-foreground">
            {AllIcons.length} UI glyphs across {categories.length} categories, {POLISH_BANKS.length} Polish bank
            SVG logos, and {paymentBrandMarks.length} payment method chips.
          </p>
        </div>

        <section className="grid gap-4">
          <h2 className="text-[11px] font-medium uppercase leading-4 tracking-[0.08em] text-text-tertiary">
            Polish banks ({POLISH_BANKS.length})
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {POLISH_BANKS.map((bank) => (
              <div
                key={bank.name}
                className="flex items-center gap-3 rounded-card bg-surface-1 p-4 ring-1 ring-hairline"
              >
                <PaymentChip className="px-1.5 py-1">
                  <img src={bank.iconSrc} alt="" className="max-h-full max-w-full object-contain" />
                </PaymentChip>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium">{bank.name}</p>
                  <p className="truncate text-[12px] text-muted-foreground">{bank.subtitle}</p>
                </div>
                <span
                  className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-1 ring-1 ring-black/10"
                  aria-hidden="true"
                >
                  <img src={bank.iconSrc} alt="" className="max-h-full max-w-full object-contain" />
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4">
          <h2 className="text-[11px] font-medium uppercase leading-4 tracking-[0.08em] text-text-tertiary">
            Payment method chips ({paymentBrandMarks.length})
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {paymentBrandMarks.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-3 rounded-card bg-surface-1 p-4 ring-1 ring-hairline"
              >
                <PaymentChip>{item.node}</PaymentChip>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium">{item.name}</p>
                  <p className="text-[12px] text-muted-foreground">53×32 chip</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {categories.map((category) => (
          <section key={category} className="grid gap-4">
            <h2 className="text-[11px] font-medium uppercase leading-4 tracking-[0.08em] text-text-tertiary">
              {category}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {AllIcons.filter((i) => i.category === category).map(({ name, Icon }) => (
                <div
                  key={name}
                  className="flex items-center gap-3 rounded-card bg-surface-1 p-4 ring-1 ring-hairline"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2 ring-1 ring-hairline">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium">{name}</p>
                    <p className="text-[12px] text-muted-foreground">size-5</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        <section className="grid gap-4">
          <h2 className="text-[11px] font-medium uppercase leading-4 tracking-[0.08em] text-text-tertiary">
            Size scale
          </h2>
          <div className="flex items-end gap-6 rounded-card bg-surface-1 p-5 ring-1 ring-hairline">
            {(["size-4", "size-5", "size-6", "size-8"] as const).map((size) => {
              const DemoIcon = AllIcons[0].Icon
              return (
                <div key={size} className="grid justify-items-center gap-2">
                  <span className="flex size-12 items-center justify-center rounded-full bg-surface-2 ring-1 ring-hairline">
                    <DemoIcon className={size} aria-hidden="true" />
                  </span>
                  <code className="text-[11px] text-text-tertiary">{size}</code>
                </div>
              )
            })}
          </div>
        </section>

        <section className="grid gap-4">
          <h2 className="text-[11px] font-medium uppercase leading-4 tracking-[0.08em] text-text-tertiary">
            Status tones
          </h2>
          <div className="flex flex-wrap gap-3">
            {(
              [
                { tone: "success", iconName: "CircleCheck", badge: "bg-success-surface text-success ring-success/20" },
                { tone: "warning", iconName: "CircleAlert", badge: "bg-warning-surface text-warning ring-warning/20" },
                { tone: "error", iconName: "CircleX", badge: "bg-danger-surface text-danger ring-danger/20" },
                { tone: "pending", iconName: "Clock", badge: "bg-surface-3 text-muted-foreground ring-hairline" },
              ] as const
            ).map(({ tone, iconName, badge }) => {
              const entry = AllIcons.find((i) => i.name === iconName)!
              return (
                <div key={tone} className="flex items-center gap-3 rounded-card bg-surface-1 p-4 ring-1 ring-hairline">
                  <span className={`flex size-10 items-center justify-center rounded-full ring-1 ${badge}`}>
                    <entry.Icon className="size-5" strokeWidth={2.5} aria-hidden="true" />
                  </span>
                  <span className="text-[14px] font-medium capitalize">{tone}</span>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  ),
}
