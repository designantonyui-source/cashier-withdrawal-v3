import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { QuickTopUpFlow } from "@/components/cashier-ds/quick-topup-flow";

const meta = { title: "Cashier/Screens/InGame TopUp", component: QuickTopUpFlow, render: (args) => <QuickTopUpFlow key={`${args?.balance}-${args?.betAmount}-${args?.initialAmount}-${args?.initialBank}-${args?.initialStatus}`} {...args} />, parameters: { layout: "fullscreen" } } satisfies Meta<typeof QuickTopUpFlow>;
export default meta;
type Story = StoryObj<typeof meta>;
export const LowBalance: Story = { args: {} }
export const HighBet: Story = { args: { balance: 12, betAmount: 50, initialAmount: 200 } }
export const Success: Story = { args: { initialStatus: 'success' }, parameters: { docs: { description: { story: 'Success returns to context: toast plus updated balance, Back to game exit. No dead-end screen.' } } } }

/**
 * The game owns the sheet: it mounts `QuickTopUpFlow` over the session and
 * `onBackToGame` unmounts it. The header X and the Back to game buttons all
 * call the same callback, so close is never trapped inside the widget.
 */
function FromGameStory() {
  const [open, setOpen] = useState(true)
  if (!open) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-4 text-foreground">
        <h1 className="text-lg font-semibold">Game</h1>
        <p className="text-[13px] text-muted-foreground">Balance 212,00 PLN · session preserved.</p>
        <button type="button" onClick={() => setOpen(true)} className="h-14 rounded-full bg-primary px-6 text-[17px] font-semibold text-primary-foreground">Top up to continue</button>
      </main>
    )
  }
  return <QuickTopUpFlow onBackToGame={() => setOpen(false)} />
}
export const FromGame: Story = { render: () => <FromGameStory />, parameters: { docs: { description: { story: 'Close contract: the header X and Back to game unmount the sheet and return to the session. In production the game passes its own close (unmount, postMessage, or route back).' } } } }
