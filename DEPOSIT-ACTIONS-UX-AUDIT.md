# Deposit actions: UX audit and decision rules

**Date:** 8 November 2026  
**Scope:** The local cashier widget, Storybook screens, and the actions shown during fiat and crypto deposits. The current flows use local state and have no payment provider, support service, or game host connection. The audit below records the original problems; implementation status is at the end.

## Verdict

The status timeline explains what happened, but the buttons often lead back into another deposit instead of helping the player finish, safely wait, or resolve a problem. The shared rule should be: **show the next useful action for the transaction's actual state; keep “Back to game” available after the user no longer needs to act inside the cashier.** Returning to the game must close the cashier and restore the prior game context, not reset the deposit or create another payment.

## Evidence inspected

I inspected the current `src/App.tsx` behavior and Storybook at a 320 px dark viewport. The rendered steps and visible controls were reviewed for [BLIK failed](http://127.0.0.1:6009/?path=/story/cashier-screens--blik-failed), [BLIK successful](http://127.0.0.1:6009/?path=/story/cashier-screens--blik-successful), [BLIK delayed](http://127.0.0.1:6009/?path=/story/cashier-screens--blik-delayed), and [crypto credited](http://127.0.0.1:6009/?path=/story/cashier-screens--crypto-credited). Other cases below are based on the current component and Storybook fixtures, not a live provider journey. At 320 × 568, some BLIK actions are below the visible area and require scrolling; this is a discoverability risk, not proof that the controls are inaccessible.

| Step | Current health | What the user sees | Main issue |
| --- | --- | --- | --- |
| 1. BLIK payment declined | Needs work | “Choose another method” plus a separate footer “Try again” | Two recovery actions compete; the retry does not say it returns to BLIK entry. No clear exit or contextual help. |
| 2. BLIK payment successful | Needs work | “View transaction” and prominent “New deposit” | The strongest action asks for another deposit, although the current task is complete. |
| 3. BLIK payment delayed | Critical | “View transactions”, “Back to deposit”, “Cancel deposit” | “Back to deposit” can encourage a second payment while the first is unresolved. “Cancel” claims more control than the widget can verify. |
| 4. Crypto credited | Needs work | Completed timeline and details; only header back and close | No explicit completion action that returns to the game. |

The visual hierarchy and labels above were checked in Storybook. Keyboard order, screen reader announcements across state changes, real provider responses, and host game navigation were not verified.

## What current payment guidance supports

- BLIK's own integration checklist says the bank confirmation screen should focus attention on confirming in the banking app, with no competing task actions; after success, it recommends an explicit return action instead of an automatic redirect. Errors should state the real cause when known and allow a fresh BLIK code. [BLIK integration checklist](https://www.blik.com/lp/payment-without-code/BLIK_OneClick_-_requirements_checklist.html)
- A BLIK code is one use and valid for two minutes. A new attempt should request a fresh code rather than reuse the original. [BLIK FAQ](https://www.blik.com/en/faq)
- An iGaming operator's crypto help directs players to transaction status/history while confirmations are pending and offers support for deposit problems. Its bank transfer troubleshooting asks for proof of payment after the stated processing window. These are reference patterns, not evidence that every operator uses the exact button labels proposed here. [Stake crypto deposit help](https://help.stake.com/en/articles/4824372-crypto-help-with-deposits), [Stake bank transfer deposit help](https://help.stake.com/en/articles/8210123-bank-transfer-deposit-processing-time-and-troubleshooting)
- Cancellation is a provider state transition, not a local UI preference. Stripe, as an example, allows cancellation only in specific PaymentIntent states and returns an error if the intent is no longer cancelable. This does not establish what our eventual provider supports. [Stripe cancellation API](https://docs.stripe.com/api/payment_intents/cancel)
- An incoming crypto transfer cannot be canceled from the recipient cashier after it has been initiated. Pending deposits need network confirmation; an incorrect address/network may need support and may not be recoverable. [Coinbase pending deposits](https://help.coinbase.com/en/exchange/crypto-transfers/deposit-pending-unconfirmed-transaction), [Coinbase cancellation guidance](https://help.coinbase.com/en/exchange/crypto-transfers/sent-to-wrong-address)

## Action policy

1. **Only one prominent action per state.** Its label must describe the result of tapping it. Keep history, help, another method, and another deposit secondary.
2. **“Back to game” is navigation, not cancellation.** It may be used while a deposit is pending if the status will continue updating in History. It must preserve the transaction and game context.
3. **“Cancel payment” appears only when the provider says the payment is cancelable.** Otherwise, use “Stop this request” only if it truly stops an unsubmitted request, or omit the action. After asking to cancel, show “Canceling…” until the provider responds. Show “Canceled” only on provider confirmation; on a race or error, refresh the real status and explain what happened.
4. **Never offer “Try again” for an unresolved payment.** Let the player check status or contact support first; otherwise a second attempt may create a duplicate debit. A final failed state may offer retry with a new request and new BLIK code.
5. **Support is for an actionable problem.** Give it a real destination and pass method, amount, time, and transaction reference into the support context. If there is no support route, do not render a dead button. Show help early for incorrect network/address, provider errors, or a payment outside the expected window; do not make support the primary action for ordinary short waits.
6. **Separate navigation labels.** “Back to payment methods” changes a choice before payment; “View transaction” opens this transaction; “Back to game” exits the cashier. Avoid “Back to deposit” once payment has started.

## State-by-state action matrix

“Primary” is the visually strongest button in the cashier. “Secondary” is a lower-emphasis button or link. The header close control remains available, with an accessible name that explains its destination.

| State | Primary action | Secondary action | Cancel / support rule | What must happen |
| --- | --- | --- | --- | --- |
| Choose payment method | Select a method | Back to game | No cancellation; support only if methods unavailable | Preserve game context. |
| BLIK/card form before submission | “Pay PLN X” or provider-specific submit | Change payment method | “Cancel deposit” is wrong here; nothing has started | Show final amount and fee before submission. |
| BLIK awaiting bank approval | No competing primary button; instruction is the focus | Back to game, preferably quiet header action | Cancel only if provider explicitly confirms cancelability; otherwise no cancel. Help if bank prompt is missing after a short, defined wait | Keep transaction visible in History; do not start another payment. |
| Card 3-D Secure / provider authentication | “Continue authentication” only if the provider gives a resumption action | Back to game only if safe to resume later | Cancel only when provider supports it | Do not replace provider authentication with a generic retry. |
| Fiat processing or delayed, outcome unknown | “View transaction” | Back to game | “Contact support” after method-specific threshold or when the user reports a debit without credit; no generic cancel | Show last known status, reference, and when to check again. Avoid a second payment prompt. |
| Fiat succeeded and credited | “Back to game” | View transaction; “Make another deposit” as a quiet option, if needed | No cancel | Show credited amount and current balance. |
| Fiat failed with final provider result | “Try BLIK again” / “Try card again” | Choose another method; Back to game | Support if the reason is unclear or the user was charged | Create a new attempt; do not silently resubmit. BLIK field starts empty. |
| Fiat canceled, provider confirmed | “Back to game” | Make another deposit; View transaction | No further cancel | Say whether money was taken or whether any hold may remain, using provider truth. |
| Cancellation requested, outcome unresolved | “View transaction” | Back to game | Support if cancellation cannot be resolved; hide repeat cancel | Do not show a final canceled state yet. |
| Crypto address shown, no transfer detected | “Back to game” or no primary if address/copy is the main task | Copy address; View deposit instructions | No “Cancel transaction”; support when deposit details are unavailable | Keep the selected asset/network/address accessible after exit if the address remains valid. |
| Crypto detected / confirming | “Back to game” | View transaction / explorer when a real hash exists | No cancel; support after network or provider threshold | Show confirmation count and state that credit follows confirmation. |
| Crypto credited | “Back to game” | View transaction | No cancel | Show credited asset amount and refreshed balance. |
| Crypto missing or wrong network/address | “Contact support” when a real route exists | View transaction / explorer | No cancel | Ask for transaction hash, asset, network, and destination; do not promise recovery. |
| Transaction History pending row | “View details” | Resume authentication **only** when the provider supplies a resumable action | Cancel only if provider says yes; support after threshold | Do not use “Return to payment” to launch another attempt. |
| Transaction History final row | “View details” | Retry only for final failure | Support for disputed payment | Keep historical facts immutable. |

## Specific changes to the current widget

| Priority | Current implementation | Proposed change |
| --- | --- | --- |
| P0 | Success/canceled footer primary is “New deposit” | Make “Back to game” primary; move “Make another deposit” into a quiet secondary action. |
| P0 | Delayed BLIK primary is “View transactions” and secondary is “Back to deposit” | Use “View transaction” for the specific payment; replace “Back to deposit” with “Back to game.” Keep pending state intact. |
| P0 | `CancelDepositAction` can mark a pending payment canceled in local state | Gate it on provider capability and the provider's successful response. While unresolved, show a cancellation-pending state. Do not equate closing the cashier with canceling. |
| P0 | History “Return to payment” can set a pending BLIK/card transaction active again | Rename to “Resume bank confirmation” only for a real resumable authorization; otherwise use “View details.” Never create or re-enter another payment from a pending row. |
| P1 | Failed screen has “Choose another method” and “Try again” in different sections | Keep the method-specific retry as one primary action; make “Choose another method” secondary next to it. Add “Back to game” exit and a contextual help path if charged. |
| P1 | Crypto credited has no explicit completion button | Add “Back to game” and optional “View transaction.” Match fiat success. |
| P1 | Header X is labeled “Close cashier” and closes to a local “Deposit” launcher | In the hosted product, call a game-return callback and restore the prior screen. Label the control “Back to game” or provide a visible text action on result screens. Keep the local launcher only for Storybook/testing. |
| P1 | “Contact support for deposit details” is plain text in the unavailable crypto state | Add a working support route before making it a button; prefill asset and network. |
| P2 | Status actions can be below the fold on a 320 × 568 viewport | Keep the primary action reachable at the bottom without obscuring transaction details; verify with keyboard, screen reader, and long translated copy. |

## Flow and backend requirements before implementation

- Define an explicit `returnToGame()` host callback and the original game route/state. Closing the cashier must not mutate the deposit.
- Model `requires_user_action`, `processing`, `succeeded`, `failed`, `cancel_requested`, and `canceled` separately. Keep provider status and local presentation status distinct.
- Get `canCancel`, `canResume`, `lastUpdatedAt`, `supportAfter`, and an idempotent transaction ID from the payment backend. Do not infer these from elapsed time alone.
- Receive and reconcile provider webhooks when the widget is closed. History and balance must match the backend's settled result after reopening.
- Provide a support route capable of accepting a transaction context. Show the support control only when that route exists.
- Record the click destination and result of each action. Suggested checks: duplicate attempts after delayed payment; support clicks after debited-not-credited reports; successful return to game; cancellation requests that race with success.

## Storybook and acceptance checklist

Add isolated action states for BLIK pending, delayed, cancel available, cancel unavailable, cancel requested, cancel failed, succeeded, failed, and canceled; card authentication and processing; crypto address, detected, confirming, credited, and missing deposit. Add a host callback stub that visibly records “Returned to game” so the exit can be tested without a live game.

Acceptance criteria:

- Every completed or canceled flow has a visible “Back to game” action that preserves the correct final state in History.
- Leaving a pending flow never changes its status or creates a second attempt.
- A pending payment cannot be retried; a final failure can be retried as a new request with a fresh BLIK code.
- “Canceled” appears only after provider confirmation; a failed cancel attempt leaves the real payment status visible.
- A support action opens a real destination with the correct transaction context; no support button is decorative.
- The primary action is discoverable at 320 × 568 and at desktop width; touch target, focus order, live status announcement, and button labels work in both themes.

**Decision needed for production:** the actual payment provider's cancellation and resumption capabilities, the support destination, the expected delay thresholds for each method, and the game host's return callback. Until those are known, Storybook should label these as proposed interaction states and should not imply a real cancellation or support connection.

## Implementation status — 8 November 2026

- Completed in the local widget: success and canceled states lead back to the game; delayed payments lead to the specific transaction; failed payments offer a method-specific new attempt with a blank BLIK code; pending History no longer returns to payment entry; crypto progress has a game exit and transaction action.
- Cancellation is shown only when a host supplies `onCancelDeposit`. The dialog waits for its response, marks the payment canceled only on confirmation, and leaves it pending if rejected or errored. Storybook includes both outcomes.
- Support is shown only when a host supplies `onContactSupport`. Storybook includes a destination that carries fiat transaction reference or crypto asset and network and preserves the cashier state when returning.
- `onReturnToGame` is the host navigation contract. Storybook's standalone “Game” surface demonstrates closing and reopening the cashier; the actual game route is still an integration task.
- Still required for production: provider truth for cancellation and settlement, status reconciliation while the cashier is closed, method-specific support thresholds, a real support destination, and the game host callback. Local Storybook fixtures do not prove these integrations.

## Deposit status copy pass — 8 November 2026

- BLIK awaiting confirmation now names the payment in the heading and uses *confirm* consistently in the progress steps. A charge reassurance is shown only when the transaction explicitly carries `chargeState: "not_charged"`.
- The amount summary now shows the deposit, fee, total, and transaction ID on pending screens. PLN amounts use `pl-PL` formatting with the currency code (`50,00 PLN`).
- The cancel action is a quiet link that opens a native modal dialog. It is rendered only with a not-charged transaction and both a status-refresh callback and cancellation callback. Opening the dialog updates the transaction from the latest response; if the payment has completed, the screen changes state and the dialog closes. A failed cancellation keeps the deposit pending. Storybook includes confirmed, rejected, unavailable, and status-changed responses.
- English and Polish BLIK awaiting/cancellation copy lives in `src/blik-copy.ts`. Storybook has both language variants. This is a targeted copy pass, not whole-cashier localization.
- The widget still models local `pending`, `success`, `failed`, and `canceled` states. It cannot truthfully display provider-derived `processing`, `expired`, `declined`, `unknown`, or regulated blocks without a status API. `expires_at`, charge certainty, decline reason, support threshold, and any balance/bonus destination must be provided by the host before the remaining deck can be implemented as transaction behavior.
