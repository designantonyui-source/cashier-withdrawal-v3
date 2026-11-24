import type { Meta, StoryObj } from "@storybook/react-vite"
import { ArrowLeft, ChevronDown, ChevronRight, Copy, CreditCard, Info, Landmark, ReceiptText, Wallet, X } from "lucide-react"
import { useState, type ReactNode } from "react"

import { cn } from "@/lib/utils"

import { WithdrawCashFlow } from "@/components/cashier-ds/withdraw-cash-flow"
import { POLISH_BANKS, toBankPickerOptions } from "@/lib/bank-options"
import {
  ActionButton,
  AmountDisplay,
  BalanceCard,
  CashierHeader,
  CashierSheet,
  CashierSurface,
  CurrencyAmountField,
  EmptyState,
  HeaderBalanceSubtitle,
  InlineNotice,
  MethodGroup,
  MethodRow,
  MethodTrigger,
  OptionCard,
  PaymentChip,
  QuickAmounts,
  SecureTransactionNote,
  SheetPickerField,
  StatusToast,
  SummaryList,
  SummaryRow,
  SupportButton,
} from "@/components/cashier-ds/primitives"

const meta: Meta = {
  title: "Cashier/Design system",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A cashier system derived from Phantom iOS. Dark canvas, one lavender action, a serif money display, quiet surfaces, and bottom sheets. The widget uses these tokens and shared primitives.",
      },
    },
  },
}
export default meta
type Story = StoryObj

function Page({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-background px-5 py-10 text-foreground">
      <div className="mx-auto grid w-full max-w-5xl gap-12">{children}</div>
    </div>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="grid gap-5">
      <div className="max-w-2xl">
        <h1 className="text-[28px] font-semibold tracking-[-0.02em]">{title}</h1>
        {description ? (
          <p className="mt-1 text-[15px] leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function Specimen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-[28px] border border-hairline bg-surface-1 p-5", className)}>
      {children}
    </div>
  )
}

const colours = [
  { name: "Canvas", token: "background", hex: "#0A0A14", note: "App canvas" },
  { name: "Surface 1", token: "surface-1", hex: "#14141F", note: "Sheets, notices" },
  { name: "Surface 2", token: "surface-2", hex: "#1E1E2E", note: "Cards, method rows" },
  { name: "Surface 3", token: "surface-3", hex: "#2A2A3E", note: "Hover, pressed" },
  { name: "Primary", token: "primary", hex: "#8B5CF6", note: "One action per screen" },
  { name: "Success", token: "success", hex: "#34D399", note: "Completed, credited" },
  { name: "Warning", token: "warning", hex: "#FBBF24", note: "Pending, delayed" },
  { name: "Danger", token: "danger", hex: "#FB7185", note: "Failed, declined" },
  { name: "Text", token: "foreground", hex: "#F0F0FA", note: "Primary copy and money" },
  { name: "Text secondary", token: "muted-foreground", hex: "#9B9BB4", note: "Labels, support" },
  { name: "Text tertiary", token: "text-tertiary", hex: "#6E6E8A", note: "Chevrons, hints" },
]

export const Colour: Story = {
  render: () => (
    <Page>
      <Section
        title="Colour"
        description="True black canvas, three quiet surfaces, one lavender action, and status colour reserved for state. Money is always white; green and red never decorate a balance."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {colours.map((colour) => (
            <div key={colour.token} className="grid gap-2">
              <div
                className="h-20 rounded-card border border-hairline"
                style={{ backgroundColor: colour.hex }}
              />
              <div>
                <p className="text-[15px] font-medium">{colour.name}</p>
                <p className="text-[13px] text-muted-foreground">
                  {colour.hex} · {colour.note}
                </p>
                <code className="text-[12px] text-text-tertiary">{colour.token}</code>
              </div>
            </div>
          ))}
        </div>
        <Specimen className="grid gap-3">
          <p className="text-[15px] font-medium">Hairlines</p>
          <div className="rounded-card bg-surface-2 p-4">
            <div className="border-b border-hairline pb-3 text-[13px] text-muted-foreground">
              hairline · 8% white · default separation
            </div>
            <div className="border-b border-hairline-strong pb-3 pt-3 text-[13px] text-muted-foreground">
              hairline-strong · 14% white · emphasized markers (timeline dots)
            </div>
          </div>
          <ul className="grid gap-1 text-[13px] leading-5 text-muted-foreground">
            <li>Text on canvas — 19.61:1</li>
            <li>Secondary text on canvas — 7.52:1</li>
            <li>Primary on canvas — 8.97:1</li>
            <li>Canvas text on primary — 8.45:1</li>
            <li>Success on canvas — 10.98:1</li>
            <li>Danger on canvas — 7.54:1</li>
          </ul>
        </Specimen>
      </Section>
    </Page>
  ),
}

export const Typography: Story = {
  render: () => (
    <Page>
      <Section
        title="Typography"
        description="A high-contrast serif carries the amount; Inter carries the interface. The display face is an open-source stand-in for Phantom's money face — license the brand face if exact fidelity is required."
      >
        <Specimen className="grid gap-8">
          <div>
            <p className="mb-2 text-[13px] text-muted-foreground">
              Display · Inter · clamp(48–64px) / 0.94 / -0.03em
            </p>
            <p className="font-display text-[clamp(48px,10vw,64px)] leading-[0.94] tracking-[-0.03em] tabular-nums">
              $1,250.00
            </p>
          </div>
          <div>
            <p className="mb-2 text-[13px] text-muted-foreground">
              Title · Inter 600 · 22px / 28px
            </p>
            <p className="text-[22px] font-semibold leading-7 tracking-[-0.01em]">Add funds</p>
          </div>
          <div>
            <p className="mb-2 text-[13px] text-muted-foreground">
              Headline · Inter 600 · 17px / 22px
            </p>
            <p className="text-[17px] font-semibold leading-6">Payment methods</p>
          </div>
          <div>
            <p className="mb-2 text-[13px] text-muted-foreground">
              Body · Inter 400 · 17px / 24px
            </p>
            <p className="max-w-lg text-[17px] leading-6">
              Add cash with a card or bank transfer. Your balance updates as soon as the payment
              is confirmed.
            </p>
          </div>
          <div>
            <p className="mb-2 text-[13px] text-muted-foreground">
              Secondary · Inter 400 · 15px / 20px
            </p>
            <p className="text-[15px] leading-5 text-muted-foreground">
              Visa or Mastercard. Fees are shown before you confirm.
            </p>
          </div>
          <div>
            <p className="mb-2 text-[13px] text-muted-foreground">
              Caption · Inter 400 · 13px / 18px
            </p>
            <p className="text-[13px] leading-5 text-muted-foreground">
              Your cash deposits will appear here.
            </p>
          </div>
          <div>
            <p className="mb-2 text-[13px] text-muted-foreground">
              Overline · Inter 500 · 11px / 14px / 0.08em
            </p>
            <p className="text-[11px] font-medium uppercase leading-4 tracking-[0.08em] text-text-tertiary">
              Cash balance
            </p>
          </div>
        </Specimen>
      </Section>
    </Page>
  ),
}

export const SpaceAndShape: Story = {
  name: "Space and Shape",
  render: () => (
    <Page>
      <Section
        title="Space and shape"
        description="A 4px base, an 8px rhythm, and three radii. Surfaces are flat: lightness and hairlines create hierarchy, not shadows."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Specimen className="grid gap-4">
            <p className="text-[15px] font-medium">Spacing</p>
            {[4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64].map((space) => (
              <div key={space} className="flex items-center gap-4">
                <span className="w-8 text-right text-[13px] text-muted-foreground">{space}</span>
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${space * 2}px` }}
                />
                <span className="text-[13px] text-muted-foreground">{space}px</span>
              </div>
            ))}
          </Specimen>
          <Specimen className="grid gap-4">
            <p className="text-[15px] font-medium">Radii</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <div className="h-20 rounded-control bg-surface-2" />
                <p className="text-[13px] text-muted-foreground">Control · 20px</p>
              </div>
              <div className="grid gap-2">
                <div className="h-20 rounded-card bg-surface-2" />
                <p className="text-[13px] text-muted-foreground">Card · 20px</p>
              </div>
              <div className="grid gap-2">
                <div className="h-20 rounded-sheet bg-surface-2" />
                <p className="text-[13px] text-muted-foreground">Sheet · 28px</p>
              </div>
              <div className="grid gap-2">
                <div className="h-20 rounded-full bg-surface-2" />
                <p className="text-[13px] text-muted-foreground">Action · full</p>
              </div>
            </div>
            <div className="rounded-card bg-surface-2 p-4 text-[13px] leading-5 text-muted-foreground">
              No elevation on cards or buttons. Sheets use a scrim and a top shadow; toasts use a
              soft shadow so they lift off the canvas.
            </div>
          </Specimen>
          <Specimen className="grid gap-4">
            <p className="text-[15px] font-medium">Shadow</p>
            <div className="grid gap-2">
              <div className="flex h-24 items-center justify-center rounded-card bg-surface-2 shadow-[var(--shadow-soft)]">
                <p className="text-[13px] text-muted-foreground">soft · 0 2px 5px 0 · #212224 @ 17%</p>
              </div>
              <code className="text-[12px] text-text-tertiary">--shadow-soft: 0 2px 5px 0 rgb(33 34 36 / 0.17)</code>
            </div>
            <div className="grid gap-2">
              <div className="flex h-24 items-center justify-center rounded-card bg-surface-2 shadow-[var(--shadow-medium)]">
                <p className="text-[13px] text-muted-foreground">medium · 0 8px 24px -6px · #212224 @ 22%</p>
              </div>
              <code className="text-[12px] text-text-tertiary">--shadow-medium: 0 8px 24px -6px rgb(33 34 36 / 0.22)</code>
            </div>
            <div className="rounded-card bg-surface-2 p-4 text-[13px] leading-5 text-muted-foreground">
              Soft lifts amount entry and summary cards slightly off the canvas. Medium elevates
              primary actions and floating elements above surrounding content.
            </div>
          </Specimen>
        </div>
      </Section>
    </Page>
  ),
}

export const Actions: Story = {
  render: () => (
    <Page>
      <Section
        title="Actions"
        description="One filled lavender action per screen. Secondary and ghost actions are surfaces or text. Loading stays in place and keeps the label meaningful."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Specimen className="grid gap-3">
            <ActionButton>Confirm</ActionButton>
            <ActionButton variant="secondary">Back</ActionButton>
            <ActionButton variant="ghost">Cancel</ActionButton>
            <ActionButton variant="danger">Try again</ActionButton>
          </Specimen>
          <Specimen className="grid gap-3">
            <ActionButton loading loadingLabel="Processing…">
              Confirm
            </ActionButton>
            <ActionButton disabled>Review</ActionButton>
            <ActionButton variant="secondary" size="md">
              Medium action
            </ActionButton>
            <ActionButton
              variant="secondary"
              size="sm"
              fullWidth={false}
              className="justify-self-start"
            >
              Small action
            </ActionButton>
            <SupportButton variant="secondary" size="md" />
            <SupportButton variant="ghost" size="sm" />
          </Specimen>
        </div>
      </Section>
    </Page>
  ),
}

function AmountEntrySpecimen() {
  const [raw, setRaw] = useState("100")
  const [visible, setVisible] = useState(true)
  const amount = Number(raw || 0)
  const outOfRange = Boolean(raw) && (!Number.isFinite(amount) || amount < 100 || amount > 100000)

  return (
    <CashierSurface className="h-[540px]">
      <CashierHeader
        title="Add cash"
        subtitle={<HeaderBalanceSubtitle value="250,00 PLN" visible={visible} onToggleVisible={() => setVisible((v) => !v)} />}
        onClose={() => setRaw("")}
      />
      <div className="flex min-h-0 flex-1 flex-col justify-between gap-4 px-5 pb-5 pt-4">
        <div className="grid gap-3 rounded-card bg-surface-2 p-4">
          <CurrencyAmountField
            id="ds-amount-input"
            label="Amount"
            value={raw}
            currency="PLN"
            error={outOfRange}
            describedBy="ds-amount-hint"
            onChange={setRaw}
          />
          <p id="ds-amount-hint" className={outOfRange ? "text-[12px] text-danger" : "text-[12px] text-muted-foreground"}>
            {outOfRange ? "Enter an amount between 100 PLN and 100 000 PLN." : "Minimum 100 PLN · Maximum 100 000 PLN"}
          </p>
          <QuickAmounts
            amounts={[100, 250, 500, 1000]}
            value={[100, 250, 500, 1000].includes(amount) ? amount : null}
            onSelect={(value) => setRaw(String(value))}
          />
        </div>
        <div className="grid gap-2.5">
          <MethodTrigger name="Card" onClick={() => {}} />
          <ActionButton disabled={amount < 100 || outOfRange}>Continue</ActionButton>
          <SecureTransactionNote methodName="card" />
        </div>
      </div>
    </CashierSurface>
  )
}

export const AmountEntry: Story = {
  render: () => (
    <Page>
      <Section
        title="Amount entry"
        description="One shared CurrencyAmountField across deposit and withdrawal flows: oversized tabular numeric input, currency pill, inline range limits, quick-amount presets, and a sticky primary CTA."
      >
        <div className="flex flex-wrap items-start gap-8">
          <AmountEntrySpecimen />
          <Specimen className="grid max-w-sm gap-4">
            <p className="text-[15px] font-medium">Rules</p>
            <ul className="grid gap-2 text-[13px] leading-5 text-muted-foreground">
              <li>CurrencyAmountField is shared identically between Deposit and Withdraw.</li>
              <li>Currency badge stays anchored at the trailing edge of the input card.</li>
              <li>Maximum two decimals for fiat and validated min/max limits underneath.</li>
              <li>Quick amounts use a soft accent fill, never a second competing filled CTA.</li>
            </ul>
          </Specimen>
        </div>
      </Section>
    </Page>
  ),
}

export const ChoiceCards: Story = {
  render: () => (
    <Page>
      <Section
        title="Choice cards"
        description="A compact fork between two funding options. Each card is a full-width target with an icon, an outcome-first title, and a plain-language subtitle."
      >
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <Specimen className="grid content-start gap-3">
            <p className="text-[13px] leading-5 text-muted-foreground">
              Inline rows · compact lists and sheets
            </p>
            <div className="grid gap-2">
              <OptionCard
                icon={<CreditCard className="size-6" aria-hidden="true" />}
                title="Pay by card"
                description="Visa or Mastercard"
              />
              <OptionCard
                icon={<Landmark className="size-6" aria-hidden="true" />}
                title="Bank transfer"
                description="Pay directly from your Polish bank account"
              />
            </div>
          </Specimen>
          <Specimen className="grid content-start gap-3">
            <p className="text-[13px] leading-5 text-muted-foreground">
              Stacked cards · the reference entry sheet
            </p>
            <div className="grid gap-2">
              <OptionCard
                layout="stacked"
                icon={<CreditCard className="size-6" aria-hidden="true" />}
                title="Pay by card"
                description="Use a Visa or Mastercard registered in your own name."
              />
              <OptionCard
                layout="stacked"
                icon={<Landmark className="size-6" aria-hidden="true" />}
                title="Bank transfer"
                description="Select your Polish bank and confirm in your banking app."
              />
            </div>
          </Specimen>
        </div>
      </Section>
    </Page>
  ),
}

const dsBankOptions = toBankPickerOptions([
  ...POLISH_BANKS.map((bank) => bank.name),
  "Other bank",
])

function MethodRowsSpecimen() {
  const [selected, setSelected] = useState<"card" | "bank">("card")
  const [bank, setBank] = useState("")

  return (
    <div className="grid gap-4">
      <MethodGroup label="Payment methods">
        <MethodRow
          icon={
            <PaymentChip>
              <CreditCard className="size-5 text-[#111111]" aria-hidden="true" />
            </PaymentChip>
          }
          title="Card"
          description="Visa or Mastercard"
          selected={selected === "card"}
          onClick={() => setSelected("card")}
        />
        <MethodRow
          icon={
            <PaymentChip>
              <Landmark className="size-5 text-[#111111]" aria-hidden="true" />
            </PaymentChip>
          }
          title="Bank transfer"
          description="Instant bank transfer"
          selected={selected === "bank"}
          onClick={() => setSelected("bank")}
        />
      </MethodGroup>
      <SheetPickerField
        id="ds-bank-picker"
        label="Bank"
        sheetTitle="Choose your bank"
        placeholder="Choose your bank"
        value={bank}
        options={dsBankOptions}
        onChange={setBank}
      />
    </div>
  )
}

export const PaymentMethods: Story = {
  render: () => (
    <Page>
      <Section
        title="Payment methods"
        description="Methods are rows, not cards. The selected method is a lavender dot at the trailing edge; the rest show a chevron. Arrow keys move focus inside the group, Enter or Space selects, and the method trigger on the amount screen stays chrome-free."
      >
        <div className="grid max-w-xl gap-5">
          <Specimen className="grid gap-2">
            <MethodRowsSpecimen />
          </Specimen>
          <Specimen className="grid gap-2">
            <p className="text-[13px] text-muted-foreground">Method trigger on the amount screen</p>
            <MethodTrigger name="Card" onClick={() => {}} />
          </Specimen>
        </div>
      </Section>
    </Page>
  ),
}

function SheetSpecimen() {
  const [open, setOpen] = useState(true)
  const [selected, setSelected] = useState<"card" | "bank">("card")

  return (
    <CashierSurface className="h-[600px]">
      <CashierHeader title="Add cash" onClose={() => {}} />
      <div className="px-5 pt-4">
        <MethodTrigger
          name={selected === "card" ? "Card" : "Bank transfer"}
          onClick={() => setOpen(true)}
        />
      </div>
      <CashierSheet open={open} title="Payment methods" onClose={() => setOpen(false)}>
        <MethodGroup label="Payment methods">
          <MethodRow
            icon={
              <PaymentChip>
                <CreditCard className="size-5 text-[#111111]" aria-hidden="true" />
              </PaymentChip>
            }
            title="Card"
            description="Visa or Mastercard"
            selected={selected === "card"}
            onClick={() => {
              setSelected("card")
              setOpen(false)
            }}
          />
          <MethodRow
            icon={
              <PaymentChip>
                <Landmark className="size-5 text-[#111111]" aria-hidden="true" />
              </PaymentChip>
            }
            title="Bank transfer"
            description="Instant bank transfer"
            selected={selected === "bank"}
            onClick={() => {
              setSelected("bank")
              setOpen(false)
            }}
          />
        </MethodGroup>
      </CashierSheet>
    </CashierSurface>
  )
}

export const Sheet: Story = {
  render: () => (
    <Page>
      <Section
        title="Sheet"
        description="A bottom sheet for secondary choices. Scrim at 65% black, 28px top corners, a 20px title, and a 44px close target. Focus moves into the sheet, Tab is trapped, Escape closes it, and focus returns to the trigger."
      >
        <div className="flex flex-wrap items-start gap-8">
          <SheetSpecimen />
          <Specimen className="grid max-w-sm gap-3">
            <p className="text-[15px] font-medium">Anatomy</p>
            <ul className="grid gap-2 text-[13px] leading-5 text-muted-foreground">
              <li>Title: 20/24 semibold, left aligned.</li>
              <li>Close: 44px circle on surface 2.</li>
              <li>Sheet body: 20px top/side gutters, 24px bottom inset.</li>
              <li>Maximum height: 86% of the widget.</li>
            </ul>
          </Specimen>
        </div>
      </Section>
    </Page>
  ),
}

export const Review: Story = {
  render: () => (
    <Page>
      <Section
        title="Review"
        description="The review is a receipt, not a form. Keep the amount visible, list only the facts that change the decision, and put the fee next to the method. Confirm is the only filled action."
      >
        <div className="grid max-w-md gap-8">
          <Specimen className="grid gap-6">
            <AmountDisplay value="$10.00" />
            <SummaryList>
              <SummaryRow label="You receive" value="$10.00" />
              <SummaryRow label="Payment method" value="Card" />
              <SummaryRow label="Fee" value="$0.30" />
              <SummaryRow label="Total to pay" value="$10.30" emphasis />
            </SummaryList>
            <ActionButton>Confirm</ActionButton>
          </Specimen>
          <Specimen className="grid gap-2">
            <p className="text-[15px] font-medium">Copy rules</p>
            <ul className="grid gap-2 text-[13px] leading-5 text-muted-foreground">
              <li>Label the outcome, not the mechanism: “You receive”, “Total to pay”.</li>
              <li>Put the fee in the row where it is incurred.</li>
              <li>Never hide a fee until the provider page.</li>
              <li>Use the same currency and precision as the amount screen.</li>
            </ul>
          </Specimen>
        </div>
      </Section>
    </Page>
  ),
}

export const Feedback: Story = {
  render: () => (
    <Page>
      <Section
        title="Feedback"
        description="Success returns to the cashier with a compact toast, never a dead-end screen. Pending, delayed, and failed states stay in context and state whether anything was charged."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Specimen className="grid gap-4">
            <StatusToast title="Cash added" description="Your new balance is $10.00." />
            <StatusToast
              tone="warning"
              title="Payment pending"
              description="We’re waiting for confirmation from your bank."
            />
            <StatusToast
              tone="error"
              title="Payment declined"
              description="Nothing was charged. Try another method."
            />
          </Specimen>
          <Specimen className="grid gap-4">
            <InlineNotice title="Fees are set by the payment provider">
              The amount you see on the review screen is the amount you pay.
            </InlineNotice>
            <InlineNotice title="Bank BLIK daily limit" tone="warning">
              Most Polish banks default to 1 000–3 000 PLN per day for BLIK.
            </InlineNotice>
            <InlineNotice title="This withdrawal can’t be canceled here" tone="danger">
              The bank transfer is already in transit and cannot be canceled from the cashier.
            </InlineNotice>
          </Specimen>
        </div>
      </Section>
    </Page>
  ),
}

export const EmptyStates: Story = {
  render: () => (
    <Page>
      <Section
        title="Empty states"
        description="An empty state says what will appear here and keeps the next step within reach. It is a quiet state, not an error, and it never uses a fake value to fill the space."
      >
        <div className="grid max-w-3xl gap-6 lg:grid-cols-2">
          <Specimen>
            <EmptyState
              icon={<ReceiptText className="size-5" aria-hidden="true" />}
              title="No cash deposits yet"
              description="Your cash deposits will appear here after the first payment is confirmed."
              action="Add cash"
              onAction={() => {}}
            />
          </Specimen>
          <Specimen>
            <EmptyState
              icon={<Wallet className="size-5" aria-hidden="true" />}
              title="No saved methods"
              description="Add a card or bank account to make the next deposit faster."
              action="Add a card"
              onAction={() => {}}
            />
          </Specimen>
        </div>
      </Section>
    </Page>
  ),
}

function EntrySpecimen() {
  const [open, setOpen] = useState(true)

  return (
    <CashierSurface className="h-[760px]">
      <CashierHeader title="Cash" />
      <div className="px-5 pt-4">
        <BalanceCard
          label="Cash balance"
          value="$0.00"
          icon={<Wallet className="size-5" aria-hidden="true" />}
          action="Add funds"
          onAction={() => setOpen(true)}
        />
      </div>
      <div className="flex-1" />
      <CashierSheet open={open} title="Add funds" onClose={() => setOpen(false)}>
        <div className="grid gap-2">
          <OptionCard
            layout="stacked"
            icon={<CreditCard className="size-6" aria-hidden="true" />}
            title="Pay by card"
            description="Visa or Mastercard registered in your own name. Your balance updates right after confirmation."
            onClick={() => setOpen(false)}
          />
          <OptionCard
            layout="stacked"
            icon={<Landmark className="size-6" aria-hidden="true" />}
            title="Instant bank transfer"
            description="Confirm in your Polish banking app via BLIK or Przelewy24 with 0% fee."
            onClick={() => setOpen(false)}
          />
        </div>
      </CashierSheet>
    </CashierSurface>
  )
}

export const EntryPattern: Story = {
  render: () => (
    <Page>
      <Section
        title="Entry pattern"
        description="Phantom opens with a sheet over the home surface. The cashier adapts it to a wallet balance and two peer choices. The sheet is dismissible; the balance remains the context behind it."
      >
        <div className="flex flex-wrap items-start gap-8">
          <EntrySpecimen />
          <Specimen className="grid max-w-sm gap-3">
            <p className="text-[15px] font-medium">Rules</p>
            <ul className="grid gap-2 text-[13px] leading-5 text-muted-foreground">
              <li>Title the sheet by the outcome: “Add funds”.</li>
              <li>Two choices maximum at the fork.</li>
              <li>Each subtitle says where the money comes from.</li>
              <li>Closing returns to the balance, not to a blank state.</li>
              <li>No provider names or network jargon at this level.</li>
            </ul>
          </Specimen>
        </div>
      </Section>
    </Page>
  ),
}

export const WithdrawalFlow: Story = {
  render: () => (
    <Page>
      <Section
        title="Withdrawal flow"
        description="Same-method: withdrawals return to the instrument you deposited with. Destination → amount → Review → Confirm. The destination is named before the amount, the fee is visible before the commitment, and success returns to the balance with a toast and an activity row that reconciles with the new balance. Amounts use the PLN code after the number (10 PLN entry, 50,00 PLN receipt). Limits, fees and arrival times are provider data and are illustrative here."
      >
        <div className="flex justify-center">
          <CashierSurface className="h-[780px]">
            <WithdrawCashFlow />
          </CashierSurface>
        </div>
      </Section>

      <Section
        title="Withdrawal states"
        description="Every state a withdrawal can reach, named and reviewable. The amount step shows the balance (fee-aware max), the limits and the fee preview; the review step names the same-method destination and the arrival time. Pending locks the balance."
      >
        <div className="flex flex-wrap gap-6">
          <CashierSurface className="h-[780px] w-[400px]">
            <WithdrawCashFlow initialScreen="destination" />
          </CashierSurface>
          <CashierSurface className="h-[780px] w-[400px]">
            <WithdrawCashFlow initialScreen="amount" initialAmount="250" />
          </CashierSurface>
          <CashierSurface className="h-[780px] w-[400px]">
            <WithdrawCashFlow initialScreen="review" initialAmount="250" />
          </CashierSurface>
        </div>
      </Section>
    </Page>
  ),
}

export const WithdrawalSavedCard: Story = {
  render: () => (
    <Page>
      <Section
        title="Withdrawal to saved card"
        description="Same-method example: the Visa •••• 4242 used for the deposit is pre-selected. The user only enters an amount — no CVC or expiry is collected for a payout."
      >
        <div className="flex flex-wrap justify-center gap-6">
          <CashierSurface className="h-[780px] w-[420px]">
            <WithdrawCashFlow
              variant="embedded"
              balance={250}
              minimum={100}
              initialScreen="destination"
              initialDestinationId="card-4242"
            />
          </CashierSurface>
          <CashierSurface className="h-[780px] w-[420px]">
            <WithdrawCashFlow
              variant="embedded"
              balance={250}
              minimum={100}
              initialScreen="amount"
              initialAmount="100"
              initialDestinationId="card-4242"
            />
          </CashierSurface>
          <CashierSurface className="h-[780px] w-[420px]">
            <WithdrawCashFlow
              variant="embedded"
              balance={250}
              minimum={100}
              initialScreen="review"
              initialAmount="100"
              initialDestinationId="card-4242"
            />
          </CashierSurface>
        </div>
      </Section>
    </Page>
  ),
}

export const MobileLayout: Story = {
  render: () => (
    <Page>
      <Section
        title="Mobile layout"
        description="The cashier uses 20px gutters, 16px card padding, 28px sheet corners, and quiet hairlines instead of shadows. Icon buttons and close targets are 44px; keypad keys are 56px tall."
      >
        <div className="max-w-md">
          <div className="flex h-14 items-center justify-center rounded-full bg-primary px-4 text-[17px] font-semibold text-primary-foreground">
            Primary action · full pill
          </div>
          <p className="mt-3 text-[13px] leading-5 text-muted-foreground">
            Open a cashier screen and select a mobile viewport to see these foundations in context.
          </p>
        </div>
      </Section>
    </Page>
  ),
}

export const Icons: Story = {
  render: () => (
    <Page>
      <Section
        title="Icons & brand chips"
        description="Stroke UI glyphs alongside shared 53×32 8px-rounded PaymentChip marks for Polish banks and payment rails. See Cashier/Design system/Icons for the complete inventory."
      >
        <div className="grid gap-5">
          <div className="flex flex-wrap gap-6">
            {[ArrowLeft, ChevronDown, ChevronRight, Copy, Info, X].map((Icon, index) => (
              <Icon key={index} className="size-5" aria-hidden="true" />
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {POLISH_BANKS.map((bank) => (
              <PaymentChip key={bank.name} className="px-1.5 py-1">
                <img src={bank.iconSrc} alt={bank.name} className="max-h-full max-w-full object-contain" />
              </PaymentChip>
            ))}
          </div>
        </div>
      </Section>
    </Page>
  ),
}
