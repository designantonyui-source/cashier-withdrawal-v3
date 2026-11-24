import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ComponentProps } from "react";
import App from "@/App";
import { bankDepositTransaction, depositTransaction, withdrawalTransaction } from "./cashier-fixtures";

const meta = { title: "Cashier/Screens/Withdrawal", component: App, render: (args) => <App key={JSON.stringify(args)} {...args} />, parameters: { layout: "fullscreen" } } satisfies Meta<typeof App>;
export default meta;
type Story = StoryObj<typeof meta>;

function WithdrawalSupportStory(props: ComponentProps<typeof App>) {
  const [reference, setReference] = useState<string | null>(null)
  return <>
    <div className={reference ? "hidden" : undefined}><App {...props} onContactSupport={(context) => setReference(context.kind === "fiat" ? context.transaction.reference : context.asset)} /></div>
    {reference && <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-4 text-foreground"><h1>Support destination</h1><p>{reference}</p><button type="button" onClick={() => setReference(null)}>Back to cashier</button></main>}
  </>
}
export const WithdrawalHome: Story = { args: { initialMode: 'withdrawal', initialTransactions: [depositTransaction] }, parameters: { docs: { description: { story: 'The method list names the arrival time and the fee per rail. Fees and arrival times are illustrative values.' } } } }
export const WithdrawalHomeInProgress: Story = {
  args: {
    initialMode: 'withdrawal',
    initialTransactions: [
      { ...bankDepositTransaction, amount: 500 },
      { ...withdrawalTransaction, id: 10, method: 'Standard Elixir', destination: 'mBank', amount: 250, fee: 0, status: 'pending' as const, cancelable: true },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Withdraw Home showing an active pending withdrawal in the In progress bar (collapsed by default; tap Details to inspect steps, reference, Full receipt, Cancel, or Support).',
      },
    },
  },
}
export const WithdrawalZero: Story = { args: { initialMode: 'withdrawal', initialTransactions: [] } }
export const WithdrawalLowBalance: Story = { args: { initialMode: 'withdrawal', initialMethod: 'bank-transfer', initialTransactions: [{ ...bankDepositTransaction, amount: 10 }] } }
export const WithdrawalBank: Story = { args: { initialMode: 'withdrawal', initialMethod: 'bank-transfer', initialTransactions: [bankDepositTransaction] }, parameters: { docs: { description: { story: 'Same-method payout: the bank used for the deposit is the saved destination. The destination is named before the amount.' } } } }
export const WithdrawalCard: Story = { args: { initialMode: 'withdrawal', initialMethod: 'card', initialTransactions: [depositTransaction] } }
export const WithdrawalSavedCard: Story = { args: { initialMode: 'withdrawal', initialMethod: 'card', initialTransactions: [depositTransaction] }, parameters: { docs: { description: { story: 'Same-method payout: the card used for the deposit (Visa •••• 4242) is the saved destination. No CVC is collected for a payout.' } } } }
export const WithdrawalPending: Story = { args: { initialMode: 'withdrawal', initialMethod: 'card', initialStatus: 'pending', initialTransactions: [depositTransaction, { ...withdrawalTransaction, status: 'pending' as const }] } }
export const WithdrawalSuccess: Story = { args: { initialMode: 'withdrawal', initialMethod: 'card', initialStatus: 'success', initialTransactions: [depositTransaction, withdrawalTransaction] } }
export const WithdrawalFailed: Story = { args: { initialMode: 'withdrawal', initialMethod: 'card', initialStatus: 'failed', initialTransactions: [depositTransaction, { ...withdrawalTransaction, status: 'failed' as const }] } }
export const WithdrawalCardDeclined: Story = { args: { initialMode: 'withdrawal', initialMethod: 'card', initialStatus: 'failed', initialTransactions: [depositTransaction, { ...withdrawalTransaction, status: 'failed' as const, declineReason: 'card' as const }] }, parameters: { docs: { description: { story: 'A declined card offers a different destination, not a retry of the same one.' } } } }
export const WithdrawalProviderError: Story = { args: { initialMode: 'withdrawal', initialMethod: 'card', initialStatus: 'failed', initialTransactions: [depositTransaction, { ...withdrawalTransaction, status: 'failed' as const, declineReason: 'provider' as const }] }, render: (args) => <WithdrawalSupportStory {...args} />, parameters: { docs: { description: { story: 'A provider-side failure points to the illustrative support destination supplied by this story.' } } } }
export const WithdrawalExpressElixir: Story = { args: { initialMode: 'withdrawal', initialMethod: 'express-elixir', initialTransactions: [bankDepositTransaction] } }
export const WithdrawalKycRequired: Story = {
  args: { initialMode: 'withdrawal', kycStatus: 'unverified', initialTransactions: [bankDepositTransaction] },
  parameters: { docs: { description: { story: 'Entry gate for unverified Polish accounts. Clicking Complete verification launches the 3-step KYC checklist (Personal details & PESEL, Photo ID, Polish bank account).' } } },
}
export const WithdrawalKycChecklist: Story = {
  args: { initialMode: 'withdrawal', kycStatus: 'unverified', initialKycStep: 'checklist', initialTransactions: [bankDepositTransaction] },
  parameters: { docs: { description: { story: '3-step KYC checklist modeled on Phantom iOS, Binance, and Zopa Bank: Personal details & PESEL, Photo ID (Polish ID card or Passport), and Polish bank account (PL IBAN).' } } },
}
export const WithdrawalKycPersonalStep: Story = {
  args: { initialMode: 'withdrawal', kycStatus: 'unverified', initialKycStep: 'personal', initialTransactions: [bankDepositTransaction] },
}
export const WithdrawalKycDocumentStep: Story = {
  args: { initialMode: 'withdrawal', kycStatus: 'unverified', initialKycStep: 'document', initialTransactions: [bankDepositTransaction] },
}
export const WithdrawalKycBankStep: Story = {
  args: { initialMode: 'withdrawal', kycStatus: 'unverified', initialKycStep: 'bank', initialTransactions: [bankDepositTransaction] },
}
export const WithdrawalKycPending: Story = {
  args: { initialMode: 'withdrawal', kycStatus: 'pending', initialKycStep: 'submitted', initialTransactions: [bankDepositTransaction] },
  parameters: { docs: { description: { story: 'Submitted KYC review status screen with Check status button to unlock withdrawals.' } } },
}
export const WithdrawalKycVerified: Story = {
  args: { initialMode: 'withdrawal', kycStatus: 'unverified', initialKycStep: 'verified', initialTransactions: [bankDepositTransaction] },
  parameters: { docs: { description: { story: 'Completed KYC verification confirmation screen leading directly back into withdrawals.' } } },
}
export const WithdrawalWithActiveBonus: Story = {
  args: {
    initialMode: 'withdrawal',
    initialTransactions: [{ ...bankDepositTransaction, amount: 300 }],
    activeBonus: {
      offer: {
        id: 'welcome-100',
        matchPercent: 100,
        cap: 100,
        currency: 'PLN',
        wageringMultiplier: 35,
        wageringBasis: 'bonus',
        minDeposit: 100,
        maxBet: 5,
        maxCashout: 500,
        expiryDays: 30,
      },
      bonusAmount: 100,
      depositAmount: 100,
      contributed: 1200,
      expiresAt: '2026-12-20T23:59:59Z',
    },
  },
}
