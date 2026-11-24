import type { Meta, StoryObj } from "@storybook/react-vite";
import App from "@/App";
import { longTransactions } from "./cashier-fixtures";

const meta = { title: "Cashier/Screens/History", component: App, render: (args) => <App key={JSON.stringify(args)} {...args} />, parameters: { layout: "fullscreen" } } satisfies Meta<typeof App>;
export default meta;
type Story = StoryObj<typeof meta>;
export const EmptyTransactionHistory: Story = { args: { initialView: 'transactions', initialTransactions: [] } }
export const FailedCanceledExpired: Story = { args: { initialView: 'transactions', initialTransactions: [
  { id: 1, reference: 'TXN-FAILED', createdAt: '2026-11-07T18:00:00Z', method: 'Card', amount: 50, fee: null, currency: 'PLN', status: 'failed' },
  { id: 2, reference: 'TXN-CANCELED', createdAt: '2026-11-06T18:00:00Z', method: 'BLIK', amount: 60, fee: null, currency: 'PLN', status: 'canceled' },
  { id: 3, reference: 'TXN-EXPIRED', createdAt: '2026-11-05T18:00:00Z', method: 'Card', amount: 70, fee: null, currency: 'PLN', status: 'expired' },
] } }
export const TransactionHistory: Story = { args: { initialView: 'transactions', initialTransactions: [
  { id: 1, reference: 'TXN-4F82B1C9', createdAt: '2026-11-07T18:00:00Z', method: 'BLIK', amount: 50, fee: 0, currency: 'PLN', status: 'pending', delayed: true, cancelable: true },
  { id: 2, reference: 'TXN-38A91F02', createdAt: '2026-11-06T14:30:00Z', method: 'Card', amount: 250, fee: 7.5, currency: 'PLN', status: 'success' },
  { id: 3, reference: 'TXN-7B42D301', createdAt: '2026-11-05T09:15:00Z', method: 'BLIK', amount: 100, fee: 0, currency: 'PLN', status: 'failed' },
  { id: 4, reference: 'TXN-9A10C678-ABCD-1234-9876-LONGREFERENCE', createdAt: '2026-10-29T12:00:00Z', method: 'Card', amount: 4999.99, fee: 150, currency: 'PLN', status: 'success' },
  { id: 5, reference: 'TXN-4D37E2AB', createdAt: '2026-10-15T10:00:00Z', method: 'Card', amount: 20, fee: 0.6, currency: 'PLN', status: 'success' },
] } }
export const TransactionHistoryLong: Story = { args: { initialView: 'transactions', initialTransactions: longTransactions } }
export const TransactionHistoryLoading: Story = { args: { initialView: 'transactions', initialHistoryState: 'loading' } }
export const TransactionHistoryError: Story = { args: { initialView: 'transactions', initialHistoryState: 'error' } }
export const MixedHistoryWithWithdrawal: Story = { args: { initialView: 'transactions', initialTransactions: [
  { id: 1, reference: 'TXN-4F82B1C9', createdAt: '2026-11-07T18:00:00Z', method: 'BLIK', amount: 50, fee: 0, currency: 'PLN', status: 'pending' },
  { id: 2, reference: 'TXN-38A91F02', createdAt: '2026-11-06T14:30:00Z', method: 'Card', amount: 250, fee: 7.5, currency: 'PLN', status: 'success', direction: 'withdrawal' },
  { id: 3, reference: 'TXN-7B42D301', createdAt: '2026-11-05T09:15:00Z', method: 'Bank transfer', amount: 100, fee: 2, currency: 'PLN', status: 'success', direction: 'withdrawal' },
] } }
export const FailedDepositDetails: Story = { args: { initialView: 'transactions', initialDetailTransaction: 1, initialTransactions: [
  { id: 1, reference: 'TXN-7B42D301', createdAt: '2026-11-07T18:00:00Z', method: 'BLIK', amount: 100, fee: 0, currency: 'PLN', status: 'failed', chargeState: 'not_charged', declineReason: 'funds' },
  { id: 2, reference: 'TXN-38A91F02', createdAt: '2026-11-06T14:30:00Z', method: 'Card', amount: 250, fee: 7.5, currency: 'PLN', status: 'success' },
] } }
export const CanceledDepositDetails: Story = { args: { initialView: 'transactions', initialDetailTransaction: 1, initialTransactions: [
  { id: 1, reference: 'TXN-CANCELED', createdAt: '2026-11-07T18:00:00Z', method: 'BLIK', amount: 60, fee: null, currency: 'PLN', status: 'canceled', chargeState: 'not_charged' },
  { id: 2, reference: 'TXN-EXPIRED', createdAt: '2026-11-06T18:00:00Z', method: 'Card', amount: 70, fee: null, currency: 'PLN', status: 'expired' },
] } }
export const PendingWithdrawalDetails: Story = { args: { initialView: 'transactions', initialDetailTransaction: 1, initialTransactions: [
  { id: 1, reference: 'TXN-WD-PENDING', createdAt: '2026-11-07T18:00:00Z', method: 'Bank transfer', amount: 500, fee: 10, currency: 'PLN', status: 'pending', direction: 'withdrawal', eta: '1–2 business days' },
  { id: 2, reference: 'TXN-WD-FAILED', createdAt: '2026-11-05T09:15:00Z', method: 'Card', amount: 100, fee: 2, currency: 'PLN', status: 'failed', direction: 'withdrawal' },
] } }

