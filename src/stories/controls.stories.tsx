import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import { StatusBadge } from "@/components/status-badge"
import {
  CashierSurface,
  CurrencyAmountField,
  QuickAmounts,
  SheetPickerField,
  Switch,
} from "@/components/cashier-ds/primitives"
import { POLISH_BANKS, toBankPickerOptions } from "@/lib/bank-options"
import { DirectionTabs } from "@/App"

const meta: Meta = {
  title: "Cashier/Controls",
  parameters: {
    docs: {
      description: {
        component:
          "Shared cashier controls. Refer to Cashier/Design system for the full component specimens, tokens, and state examples.",
      },
    },
  },
}
export default meta
type Story = StoryObj

const polishBankOptions = toBankPickerOptions([
  ...POLISH_BANKS.map((bank) => bank.name),
  "Other bank",
])

function DirectionExample() {
  const [mode, setMode] = useState<"deposit" | "withdrawal">("deposit")
  return (
    <div className="max-w-xs">
      <DirectionTabs mode={mode} onChange={setMode} />
    </div>
  )
}

function BankSheetPickerExample() {
  const [bank, setBank] = useState("")
  return (
    <CashierSurface className="h-[520px] max-w-md">
      <div className="grid gap-3 p-5">
        <p className="text-[13px] font-medium text-muted-foreground">
          Tap to open the iOS bank selector sheet (shows 3 overlapping bank icons when empty)
        </p>
        <SheetPickerField
          id="story-bank-picker"
          label="Bank"
          sheetTitle="Choose your bank"
          placeholder="Choose your bank"
          value={bank}
          options={polishBankOptions}
          onChange={setBank}
        />
      </div>
    </CashierSurface>
  )
}

function AmountInputExample() {
  const [amount, setAmount] = useState("100")
  const parsed = Number(amount)
  const outOfRange = Boolean(amount) && (!Number.isFinite(parsed) || parsed < 100 || parsed > 100000)

  return (
    <div className="grid max-w-md gap-3 rounded-card bg-surface-2 p-4">
      <CurrencyAmountField
        id="story-amount-input"
        label="Deposit amount"
        value={amount}
        currency="PLN"
        error={outOfRange}
        describedBy="story-amount-hint"
        onChange={setAmount}
      />
      <p id="story-amount-hint" className={outOfRange ? "text-[12px] text-danger" : "text-[12px] text-muted-foreground"}>
        {outOfRange ? "Enter an amount between 100 PLN and 100 000 PLN." : "Minimum 100 PLN · Maximum 100 000 PLN"}
      </p>
      <QuickAmounts
        amounts={[100, 250, 500, 1000]}
        value={[100, 250, 500, 1000].includes(parsed) ? parsed : null}
        onSelect={(value) => setAmount(String(value))}
      />
    </div>
  )
}

export const PaymentStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <StatusBadge status="pending" />
      <StatusBadge status="success" />
      <StatusBadge status="failed" />
      <StatusBadge status="canceled" />
    </div>
  ),
}

function SwitchExample() {
  const [checked, setChecked] = useState(false)
  return (
    <div className="flex max-w-xs items-center justify-between gap-3 rounded-card bg-surface-2 px-4 py-3.5 ring-1 ring-hairline">
      <label id="story-switch-label" htmlFor="story-switch" className="cursor-pointer select-none text-[14px] font-medium leading-5 text-foreground">
        Save card for later
      </label>
      <Switch id="story-switch" checked={checked} onCheckedChange={setChecked} aria-labelledby="story-switch-label" />
    </div>
  )
}

export const BankSheetPicker: Story = { render: () => <BankSheetPickerExample /> }
export const AmountInput: Story = { render: () => <AmountInputExample /> }
export const Direction: Story = { render: () => <DirectionExample /> }
export const SaveToggle: Story = { render: () => <SwitchExample /> }
