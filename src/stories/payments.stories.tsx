import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { CardFields, MethodDetails, MethodList, PaymentStatusPanel, methods as cashierMethods, type Transaction } from '@/App'

const meta: Meta = { title: 'Cashier/Payment components' }
export default meta
type Story = StoryObj
const methods = ['blik', 'bank-transfer', 'card'].map(id => cashierMethods.fiat.find(method => method.id === id)!)
function ChoicesExample() { const [selected, setSelected] = useState(''); return <div className="grid max-w-xl gap-3"><MethodList methods={methods} label="Payment methods" onSelect={setSelected} />{selected && <p className="text-sm text-muted-foreground">Selected: {selected}</p>}</div> }
export const MethodChoices: Story = { render: () => <ChoicesExample /> }
function CardExample({ attempted = false }: { attempted?: boolean }) {
  const [details, setDetails] = useState({ number: '', expiry: '', cvc: '', holder: '' })
  return <div className="max-w-xl"><CardFields details={details} attempted={attempted} onChange={(field, value) => setDetails(current => ({ ...current, [field]: value }))} /></div>
}
export const CardDetails: Story = { render: () => <CardExample /> }
export const CardErrors: Story = { render: () => <CardExample attempted /> }
function BlikExample() {
  const [amount, setAmount] = useState('100')
  const [code, setCode] = useState('')
  const [bank, setBank] = useState('')
  const [card, setCard] = useState({ number: '', expiry: '', cvc: '', holder: '' })
  return <div className="max-w-xl"><MethodDetails method={{ ...methods[0], flow: 'blik' }} amount={amount} currency="PLN" amountError={null} cardDetails={card} cardAttempted={false} blikCode={code} setBlikCode={setCode} bank={bank} setBank={setBank} onAmountChange={setAmount} onCardChange={(field, value) => setCard(current => ({ ...current, [field]: value }))} /></div>
}
export const BlikAndFeeBreakdown: Story = { name: 'Blik Deposit Breakdown', render: () => <BlikExample /> }
const statusTransaction: Transaction = { id: 1, reference: 'TXN-4F82B1C9', createdAt: '2026-11-07T18:00:00Z', method: 'BLIK', amount: 50, fee: 0, currency: 'PLN', status: 'pending' }

export const Pending: Story = { name: 'Status Pending', render: () => <div className="max-w-xl"><PaymentStatusPanel status="pending" method={methods[0]} amount={statusTransaction.amount} currency={statusTransaction.currency} transaction={statusTransaction} onChooseAnother={() => {}} /></div> }
export const Success: Story = { name: 'Status Success', render: () => <div className="max-w-xl"><PaymentStatusPanel status="success" method={methods[0]} amount={statusTransaction.amount} currency={statusTransaction.currency} transaction={{ ...statusTransaction, status: 'success' }} showActions={false} onChooseAnother={() => {}} /></div> }
export const Failed: Story = { name: 'Status Failed', render: () => <div className="max-w-xl"><PaymentStatusPanel status="failed" method={methods[0]} amount={statusTransaction.amount} currency={statusTransaction.currency} transaction={{ ...statusTransaction, status: 'failed', chargeState: 'not_charged' }} showActions={false} onChooseAnother={() => {}} /></div> }
