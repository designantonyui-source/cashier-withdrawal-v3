import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ComponentProps } from "react";
import App, { type SupportContext } from "@/App";

const welcomeOffer = { id: 'welcome-100', matchPercent: 100, cap: 100, currency: 'PLN' as const, wageringMultiplier: 35, wageringBasis: 'bonus' as const, minDeposit: 100, maxBet: 5, maxCashout: 500, expiryDays: 30 };

function SupportDestinationStory(props: ComponentProps<typeof App>) {
  const [context, setContext] = useState<SupportContext | null>(null);
  return <>
    <div className={context ? 'hidden' : undefined}><App {...props} onContactSupport={setContext} /></div>
    {context && <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4 text-foreground"><div className="grid w-full max-w-sm gap-3 rounded-xl border border-border bg-card p-5"><h1 className="text-base font-semibold">Support destination</h1><p className="text-sm text-muted-foreground">{context.kind === 'fiat' ? `${context.transaction.method} · ${context.transaction.reference}` : `${context.asset} · ${context.network}`}</p><button type="button" className="min-h-11 rounded-md border border-border px-4 text-sm" onClick={() => setContext(null)}>Back to cashier</button></div></main>}
  </>
}

const meta = { title: "Cashier/Screens/Deposit", component: App, render: (args) => <App key={JSON.stringify(args)} {...args} />, parameters: { layout: "fullscreen" } } satisfies Meta<typeof App>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Cashier: Story = {}
export const BlikDeposit: Story = { args: { initialCategory: 'fiat', initialMethod: 'blik' } }
export const CardDeposit: Story = { args: { initialCategory: 'fiat', initialMethod: 'card' } }
export const P24Deposit: Story = { args: { initialCategory: 'fiat', initialMethod: 'p24' } }
export const TrustlyDeposit: Story = { args: { initialCategory: 'fiat', initialMethod: 'trustly' } }
export const PaysafecardDeposit: Story = { args: { initialCategory: 'fiat', initialMethod: 'paysafecard' } }
export const ApplePayDeposit: Story = { args: { initialCategory: 'fiat', initialMethod: 'applepay' } }
export const GooglePayDeposit: Story = { args: { initialCategory: 'fiat', initialMethod: 'googlepay' } }
export const CardAwaitingConfirmation: Story = { args: { initialCategory: 'fiat', initialMethod: 'card', initialStatus: 'pending' } }
export const CardSuccessful: Story = { args: { initialCategory: 'fiat', initialMethod: 'card', initialStatus: 'success' } }
export const CardFailed: Story = { args: { initialCategory: 'fiat', initialMethod: 'card', initialStatus: 'failed' } }
export const BlikAwaitingConfirmation: Story = { args: { initialCategory: 'fiat', initialMethod: 'blik', initialStatus: 'pending', initialChargeState: 'not_charged' }, parameters: { docs: { description: { story: 'Fixture supplies a not-charged state. A real integration must obtain this from the payment provider.' } } } }
export const BlikCancellation: Story = { args: { initialCategory: 'fiat', initialMethod: 'blik', initialStatus: 'pending', initialChargeState: 'not_charged' }, render: (args) => <App {...args} onCheckCancelDeposit={async (transaction) => transaction} onCancelDeposit={async () => { await new Promise(resolve => setTimeout(resolve, 500)); return true }} />, parameters: { docs: { description: { story: 'A simulated status check allows cancellation; a simulated provider confirms it. No real payment is canceled.' } } } }
export const BlikCancellationRejected: Story = { args: { initialCategory: 'fiat', initialMethod: 'blik', initialStatus: 'pending', initialChargeState: 'not_charged' }, render: (args) => <App {...args} onCheckCancelDeposit={async (transaction) => transaction} onCancelDeposit={async () => { await new Promise(resolve => setTimeout(resolve, 500)); return false }} />, parameters: { docs: { description: { story: 'A simulated provider rejects the cancellation; the payment remains pending.' } } } }
export const BlikCancellationUnavailable: Story = { args: { initialCategory: 'fiat', initialMethod: 'blik', initialStatus: 'pending', initialChargeState: 'not_charged' }, render: (args) => <App {...args} onCheckCancelDeposit={async (transaction) => ({ ...transaction, cancelable: false })} onCancelDeposit={async () => false} />, parameters: { docs: { description: { story: 'The status refresh reports that cancellation is no longer available; the confirmation action is withheld.' } } } }
export const BlikConfirmedDuringCancellationCheck: Story = { args: { initialCategory: 'fiat', initialMethod: 'blik', initialStatus: 'pending', initialChargeState: 'not_charged' }, render: (args) => <App {...args} onCheckCancelDeposit={async (transaction) => ({ ...transaction, status: 'success', chargeState: 'charged', cancelable: false })} onCancelDeposit={async () => false} />, parameters: { docs: { description: { story: 'The simulated refresh returns a confirmed payment; the pending screen changes to success instead of offering cancellation.' } } } }
export const BlikCanceled: Story = { args: { initialCategory: 'fiat', initialMethod: 'blik', initialChargeState: 'not_charged', initialStatus: 'canceled' } }
export const BlikDelayed: Story = { args: { initialCategory: 'fiat', initialMethod: 'blik', initialStatus: 'pending', initialDelayed: true, initialChargeState: 'not_charged' }, render: (args) => <App {...args} onCheckCancelDeposit={async (transaction) => transaction} onCancelDeposit={async () => { await new Promise(resolve => setTimeout(resolve, 300)); return true }} />, parameters: { docs: { description: { story: 'Delayed BLIK payment that is still cancellable: the screen offers Cancel and View transaction; Back to game remains the exit. The status check and cancellation response are simulated.' } } } }
export const BlikDelayedWithSupport: Story = { args: { initialCategory: 'fiat', initialMethod: 'blik', initialStatus: 'pending', initialDelayed: true }, render: (args) => <SupportDestinationStory {...args} />, parameters: { docs: { description: { story: 'Contact support opens a Storybook destination with this transaction reference. Production needs a real support route.' } } } }
export const RecentDeposits: Story = { args: { initialCategory: 'fiat', initialTransactions: [
  { id: 11, reference: 'TXN-RECENT-1', createdAt: '2026-11-07T18:00:00Z', method: 'BLIK', amount: 75, fee: 0, currency: 'PLN', status: 'success' },
  { id: 12, reference: 'TXN-RECENT-2', createdAt: '2026-11-06T12:00:00Z', method: 'Card', amount: 50, fee: 1.5, currency: 'PLN', status: 'success' },
  { id: 14, reference: 'TXN-RECENT-4', createdAt: '2026-11-05T16:00:00Z', method: 'Bank transfer', amount: 100, fee: 2, currency: 'PLN', status: 'success' },
  { id: 13, reference: 'TXN-RECENT-3', createdAt: '2026-11-05T09:00:00Z', method: 'BLIK', amount: 20, fee: 0, currency: 'PLN', status: 'pending' },
] }, parameters: { docs: { description: { story: 'Settled past deposits appear as expandable cards in a swipeable strip above the method list; the pending one is excluded from repeats. Expanding a card reveals its secret field (CVV for cards, BLIK code, bank select) and the deposit button inline.' } } } }
export const WelcomeBonus: Story = { args: { initialCategory: 'fiat', bonusOffer: welcomeOffer, initialBonusOptedIn: false }, parameters: { docs: { description: { story: 'Welcome 100% up to 100 PLN (example terms). The offer starts switched off in this story; the terms appear beside it.' } } } }
export const WelcomeBonusOptedIn: Story = { args: { initialCategory: 'fiat', bonusOffer: welcomeOffer, initialBonusOptedIn: true } }
export const WelcomeBonusActive: Story = { args: { initialCategory: 'fiat', bonusOffer: welcomeOffer, initialBonusOptedIn: true, activeBonus: { offer: welcomeOffer, bonusAmount: 50, depositAmount: 50, contributed: 525, expiresAt: 'in 12 days' } }, parameters: { docs: { description: { story: 'Active bonus shows wagering progress: requirement = bonus × 35. Example: 50 PLN bonus → 1,750 PLN total, 525 contributed → 1,225 left.' } } } }
export const BlikSuccessful: Story = { args: { initialCategory: 'fiat', initialMethod: 'blik', initialStatus: 'success' } }
export const BlikFailed: Story = { args: { initialCategory: 'fiat', initialMethod: 'blik', initialChargeState: 'not_charged', initialStatus: 'failed' } }
export const BlikFailedBank: Story = { args: { initialCategory: 'fiat', initialMethod: 'blik', initialChargeState: 'not_charged', initialStatus: 'failed', initialDeclineReason: 'bank' } }
export const BlikFailedFunds: Story = { args: { initialCategory: 'fiat', initialMethod: 'blik', initialChargeState: 'not_charged', initialStatus: 'failed', initialDeclineReason: 'funds' } }
export const BlikExpired: Story = { args: { initialCategory: 'fiat', initialMethod: 'blik', initialChargeState: 'not_charged', initialStatus: 'expired' } }
export const BlikUnknown: Story = { args: { initialCategory: 'fiat', initialMethod: 'blik', initialStatus: 'unknown' } }
export const DailyDepositLimit: Story = {
  args: {
    initialCategory: 'fiat',
    initialMethod: 'blik',
    dailyDepositLimit: 500,
    initialTransactions: [
      {
        id: 101,
        reference: 'TXN-DAILY-1',
        createdAt: new Date().toISOString(),
        method: 'BLIK',
        amount: 450,
        fee: 0,
        currency: 'PLN',
        status: 'success',
        direction: 'deposit',
      },
    ],
  },
}
