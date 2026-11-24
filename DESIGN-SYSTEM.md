# Cashier design system — “Cash” direction

> This document records the original reference system and its standalone withdrawal flow. For current widget screens and states, use `Cashier/Screens` in Storybook and `src/App.tsx`. The widget supports region- and deposit-dependent withdrawal methods, including crypto.

A dark cashier system for adding and withdrawing cash, derived from Phantom iOS’s **Adding funds** flow. It is implemented in the existing React/Storybook app and scoped to `.cashier-ds`, so the current cashier can migrate deliberately rather than all at once.

- **Source flow:** Phantom iOS “Adding funds” on Mobbin, 10 screens, captured locally in [`reference/phantom/01.jpg`](reference/phantom/01.jpg)–[`10.jpg`](reference/phantom/10.jpg).
- **Storybook:** `Cashier/Design system`, starting at `cashier-design-system--colour`.
- **Reference harness:** [`src/components/cashier-ds/withdraw-cash-flow.tsx`](src/components/cashier-ds/withdraw-cash-flow.tsx).
- **Screenshots:** [`reference/design-system/`](reference/design-system/).

---

## 1. What this system is — and is not

**It is** the visual and interaction layer for cash deposits and withdrawals: a balance hub, an amount keypad, a payment-method sheet, a review receipt, an in-place processing state, and an in-context success toast. It includes reusable primitives and a runnable withdrawal flow.

**It is not** a live payment integration. Fees, processing time, limits, and the success result are illustrative reference behavior. Production must replace them with provider values and provider state.

**Crypto is a peer choice.** The `EntryPattern` fork presents cash/crypto as choice cards. The live cashier shows an illustrative address and QR for the prototype; in production these must come from the provider along with network, asset, memo/tag, expiry, and warning data.

---

## 2. What the reference actually does

| Screen | Phantom pattern | What the system keeps |
| --- | --- | --- |
| 01 Home | One lavender **Add Funds** action on a true-black canvas | One filled action per surface; a quiet balance card as context |
| 02 Add Funds sheet | Two stacked choice cards: **Add Cash** and **Transfer Crypto**, each with an icon, outcome title, and plain-language subtitle | The cash/crypto fork as `OptionCard layout="stacked"`; peers, not tabs |
| 03 Amount, empty | A large, muted `$0`; method trigger; quick amounts; keypad | Serif amount display, muted zero, 3-column keypad, quick amounts |
| 04 Amount, filled | Amount turns white; **Review** appears in place; quick amounts remain | Amount is the screen; Review stays anchored above the keypad |
| 05 Method sheet | Bottom sheet over the live amount context; selected method gets a lavender dot | `CashierSheet` + `MethodGroup`; scrim, grabber, selected state |
| 06 Method selected | Sheet closes; trigger updates to the chosen method | Selection commits and closes; focus returns to the trigger |
| 07 Review | Receipt-like summary: Add, Delivery, Payment + fee, **Confirm** | Amount remains visible; fee is a first-class row; total is explicit |
| 08 Processing | **Loading …** in place; no navigation to a dead-end screen | `ActionButton loading` keeps the label meaningful and blocks repeat submission |
| 09 Success | Returns home with a **Funding submitted** toast | In-context `StatusToast`; balance and activity update behind it |
| 10 Funded home | Updated cash balance on the home surface | Balance card + recent activity; the toast is not the only record |

### Adopted
True-black canvas, quiet charcoal surfaces, indigo as the single action colour, a high-contrast serif money display, generous spacing, bottom sheets, and success that returns to context.

### Adapted
Cashier language (“Add cash”, “Cash balance”, “Cash deposit”), USD/en-US reference data, card/bank transfer as the methods, a dedicated fee row, and a review screen that can be reached with a back action.

### Guarded against
- No implementation labels in widget copy (“demo”, “prototype”, and similar).
- No “No deposit address available” message. The prototype may show an illustrative address and QR; production must replace them with provider data.
- No hidden fees, fake balances, or success state without a corresponding activity row.
- No provider names or network jargon at the cash/crypto fork.
- No dead-end success screen.

---

## 3. Design principles

1. **The amount is the screen.** The number gets the display face, the largest type, and the most space. Everything else is support.
2. **One filled action per surface.** Lavender is reserved for the next committed step. Secondary actions are surfaces, ghost buttons, or text.
3. **Hierarchy comes from lightness and hairlines, not shadows.** Cards are flat; sheets and toasts lift with a scrim or a soft shadow.
4. **Money is white.** Green and red communicate state and direction, never decoration. A balance is not “green” just because it is positive.
5. **Keep the context.** Sheets sit over the amount screen; success returns to the balance with a toast. Users should never lose their place.
6. **Fees before commitment.** The review shows the fee, what it is added to, and the total. Production must not defer a known fee to the provider page.
7. **Outcome-first copy.** “Add cash”, “You receive”, “Total to pay”, “Cash added” — describe what happens, not the machinery.
8. **Accessible by default.** Real buttons, a real input behind the amount display, focus management, visible focus, reduced-motion support, and status announcements.

---

## 4. Tokens

Tokens live in [`src/styles/cashier-ds.css`](src/styles/cashier-ds.css). Actual values are declared under `.cashier-ds`; the Tailwind theme aliases are declared with `@theme inline`. Outside a `.cashier-ds` subtree, the cashier tokens are intentionally not applied.

### Colour

| Token | Value | Use |
| --- | --- | --- |
| `background` | `#000000` | App and widget canvas |
| `foreground` | `#F7F7F8` | Primary copy, money, icons |
| `surface-1` | `#111113` | Sheets, notices, empty surfaces |
| `surface-2` | `#1A1A1C` | Balance cards, method rows, toasts |
| `surface-3` | `#242426` | Hover and pressed surfaces |
| `primary` | `#5B8DEF` | The one filled action; selection ring |
| `primary-foreground` | `#0A0A0C` | Text and icons on indigo |
| `accent-hover` | `#B9AFF5` | Primary hover |
| `accent-pressed` | `#9A8DE8` | Primary active |
| `accent-soft` | `rgb(171 159 242 / 0.22)` | Selected quick amount |
| `hairline` | `rgb(255 255 255 / 0.08)` | Default separation |
| `hairline-strong` | `rgb(255 255 255 / 0.14)` | Emphasized markers (timeline dots) |
| `muted-foreground` | `#9A9AA2` | Secondary labels and support copy |
| `text-tertiary` | `#7C7C86` | Chevrons, hints, non-essential glyphs |
| `success` | `#32D583` | Completed, credited |
| `warning` | `#FDB022` | Pending, delayed |
| `danger` | `#F97066` | Failed, declined, destructive |
| `ring` | `#5B8DEF` | Keyboard focus |

**Paper variant (`.cashier-paper`).** The same components re-skinned on a light
canvas for an alternative identity: paper `#F6F6F4`, white receipt cards on it,
deep-green primary `#067647` (white on green 5.69:1). Status tokens are the
light-safe pair: green `#067647`, amber `#B54708` (5.43:1), red `#B42318`
(6.57:1) — same roles, all AA on white. Hairlines become ink at 8%/18%.
Preview it in any `Cashier/*` Storybook story with the toolbar's “Cashier theme”
toggle (`dark` default / `paper`); the live widget stays dark until it
deliberately adopts the new scope.

Contrast, measured against the canvas unless noted:

| Pair | Ratio | Notes |
| --- | --- | --- |
| Foreground on canvas | 19.61:1 | AAA |
| Secondary text on canvas | 7.52:1 | AAA |
| Tertiary text on canvas | 5.08:1 | AA |
| Primary on canvas | 8.97:1 | AAA |
| Canvas text on primary | 8.45:1 | AAA |
| Success on canvas | 10.98:1 | AAA |
| Danger on canvas | 7.54:1 | AAA |
| Secondary text on surface 2 | 6.22:1 | AA |
| Tertiary on surface 2 | 4.21:1 | **Do not use for body copy**; chevrons and non-text only |

### Typography

| Role | Face | Size / line / tracking |
| --- | --- | --- |
| Money display | Instrument Serif 400 | `clamp(48px, 14vw, 64px)` / `0.94` / `-0.03em` |
| Sheet title | Geist 600 | 22px / 28px / `-0.01em` |
| Screen title | Geist 600 | 17px / 22px / `-0.01em` |
| Section heading | Geist 600 | 17px / 24px |
| Body | Geist 400 | 17px / 24px |
| Secondary | Geist 400 | 15px / 20px |
| Caption | Geist 400 | 13px / 18–20px |
| Overline | Geist 500 | 11px / 14px / `0.08em`, uppercase |

Instrument Serif is an open-source stand-in for Phantom’s display face. If exact brand fidelity is required, license the brand face and keep the same scale and line-height so the layout does not reflow.

Money uses `Intl.NumberFormat` with `currencyDisplay: "narrowSymbol"`, except PLN which always uses `"code"` so entry and receipt share one affix (`10 PLN`, `50,00 PLN`). The reference is USD/en-US. Entry hides cents for whole values; review always shows two decimals so the total remains unambiguous.

### Space and shape

- Space comes from the library scale (Tailwind `--spacing: 0.25rem` = 4px); use integer steps only (4/8/12/16/20/24/28/32/40/48/56/64px). Half-steps (6/10/14px) and arbitrary off-grid values break the rhythm and are not used in cashier components. Base unit: 4px; layout rhythm: 8px.
- Widget: max 400px wide; 20px horizontal gutters; 64px header.
- Card padding: 16px; sheet padding: 20px; sheet bottom inset: 24px.
- Radii: control 16px, card 16px, sheet 28px; actions are full pills.
- Sheet: top corners 28px, grabber 36 × 4px, maximum height 86% of the widget.
- Depth: no elevation on cards or buttons; sheet uses a 60% black scrim plus a top shadow; toast uses a soft shadow so it clears the canvas.

#### Height scale

Every control height is a multiple of the 4px base; one rung per role. Nothing sits between rungs.

| Height | Role | Used by |
| --- | --- | --- |
| 4px | Atom | sheet grabber |
| 32px | Small control | small inputs, small selects, method icon wells |
| 36px | Mini control | direction tabs, filter pills and preset chips (h-9 variants), balance pill action |
| 40px | Chip | quick-amount chips, sm actions, small icon wells |
| 44px | Icon button | header actions, history close, method row mark, keypad delete is 56px (below) |
| 48px | Medium action | `ActionButton md` |
| 56px | Primary control | text fields, selects, triggers, keypad keys, `ActionButton lg`, primary CTAs |
| 64px | Chrome | widget header |

- Primary controls (fields, selects, triggers, keypad keys, `lg` actions) share one 56px height at a 17px value size — a field never looks small next to a total.
- Icon-only buttons are 44px (`size-11`); small header-adjacent chips may be 36–40px with a 44px invisible hit area via padding.
- Brand payment plaques keep the Tabler 5:3 chip ratio (32px tall) — a documented exception to the ladder, not spacing.

### Motion

- Colour and transform transitions: 150ms.
- Sheet entrance: 300ms slide-up; toast: 200ms fade/slide.
- Loading uses a spinner plus the text label; the spinner is not the only signal.
- Under `prefers-reduced-motion: reduce`, animations and transitions collapse to 0.01ms and smooth scrolling is disabled. The spinner stops; the “Processing…” label remains.

---

## 5. Components

All primitives are in [`src/components/cashier-ds/primitives.tsx`](src/components/cashier-ds/primitives.tsx). Each component is a small, typed React function; there is no hidden provider or context requirement.

| Component | Responsibility | Key behavior / notes |
| --- | --- | --- |
| `CashierShell` | Full-page reference wrapper | Applies `.cashier-ds`, centres the surface, full-bleed on mobile |
| `CashierSurface` | The bounded widget | 400px max width, 32px radius on desktop, label for the region |
| `CashierHeader` | Screen chrome | Optional back/close plus leading/trailing slots; 44px action slot; truncating title; close stays trailing whenever a back, leading or trailing action exists, otherwise leading |
| `IconButton` | Small circular action | 44px target, accessible label, focus ring |
| `ActionButton` | The committed action | `primary`, `secondary`, `ghost`, `danger`; `lg`/`md`/`sm`; loading state |
| `AmountDisplay` | Money display | `aria-live="polite"`; optional invisible input overlay; muted zero |
| `AmountKeypad` | Digits, decimal, delete | 3-column grid; 56px targets; real buttons |
| `QuickAmounts` | Preset amounts | `aria-pressed`; soft-indigo selected state; never a second filled action |
| `OptionCard` | Cash/crypto fork | `row` for compact lists, `stacked` for the entry sheet |
| `BalanceCard` | Balance context | Optional pill action (used by the general “Add funds” pattern) |
| `MethodTrigger` | Opens the method sheet | Chrome-free row: method name + chevron |
| `MethodGroup` | Radio group for methods | Arrow keys move focus; Home/End jump; Enter/Space select |
| `MethodRow` | A payment method | `role="radio"`, `aria-checked`, selected dot, 44px icon |
| `CashierSheet` | Bottom sheet | `role="dialog"`, `aria-modal`; focus moves in; Tab is trapped; Escape closes; focus returns |
| `SummaryList` / `SummaryRow` | Review receipt | Semantic `dl`; label/value rows; optional detail and emphasis |
| `StatusToast` | In-context status | `role="status"` or `alert`; success/warning/error tones |
| `InlineNotice` | Persistent explanation | Neutral/warning/danger; for fees, network warnings, or state |
| `EmptyState` | Quiet zero-data state | Says what will appear; optional next action |

The interactive flow in [`withdraw-cash-flow.tsx`](src/components/cashier-ds/withdraw-cash-flow.tsx) composes these primitives into the withdrawal path: hub → destination → amount → review → processing → home-with-toast, with the method sheet layered over amount and review. Deposits live in the widget (`src/App.tsx`) on the same primitives.

### Money helpers

[`money.ts`](src/components/cashier-ds/money.ts) contains:

- `formatMoney(value, currency, locale, options)` for display values.
- `formatAmountInput(raw, symbol)` for the live amount display.
- `sanitizeAmountInput(value)` for typed input.
- `parseAmount(raw)` for numeric state.

The withdrawal flow is fixed to PLN/pl-PL. Before shipping another locale, replace the hard-coded `currency` and `locale` in `WithdrawCashFlow` and check decimal separators, grouping, and the currency’s minor-unit rules.

---

## 6. Patterns

### 6.1 Cash hub

**Structure:** screen title, balance card, one full-width **Add cash** action, “Recent activity” section, empty or populated deposit list.

**Rules:**
- The balance is the context, not the hero. The action is the hero.
- The empty activity state says what will appear here; it does not invent a transaction.
- Once a deposit succeeds, add a real activity row with direction, method, and amount.
- The success toast is temporary; the activity row is the durable record.

### 6.2 General “Add funds” fork

**Structure:** a balance card with an **Add funds** pill opens a sheet titled “Add funds”. The sheet has two stacked `OptionCard`s:

- **Add cash** — “Use a card or bank transfer…”
- **Transfer crypto** — “Deposit tokens from another wallet…”

**Rules:**
- Two choices maximum at this level.
- Cash and crypto are peers; do not make crypto a tab or a secondary text link.
- Each subtitle says where the money comes from.
- Do not show provider names or network jargon here.
- Closing the sheet returns to the balance, not a blank state.
- The crypto card may be visually present before the crypto rail exists. In the prototype it leads to an illustrative address/QR screen; in production it must connect to a real provider flow.

This is the pattern shown in `EntryPattern`. The live deposit flow in `src/App.tsx` is cash-specific; the fork remains a composition pattern rather than a required step.

### 6.3 Amount entry

**Structure:** close/back header, centered serif amount, method trigger, quick amounts, **Review**, keypad.

**Rules:**
- Zero is muted; a valid amount is white.
- Review is disabled until the amount is within provider limits. Reference: `$1` minimum, `$5,000` maximum.
- Maximum two decimals. The keypad prevents a third fraction digit and ignores further digits after nine characters.
- Quick amounts are a shortcut, not a mode; editing the amount clears the selected state unless it still matches.
- The amount block is vertically centred in the space above the controls so the number does not sit stranded under the header.
- Tapping the amount focuses a real, transparent input with `inputMode="decimal"`; keyboard users can type, paste, or use the keypad.
- The amount is announced politely. The error is linked with `aria-describedby` and announced with `role="alert"`.

### 6.4 Method sheet

**Structure:** scrim, grabber, 22px title, 44px close, radio rows.

**Rules:**
- The sheet opens over the amount screen; the dimmed amount remains visible as context.
- The selected method gets an indigo dot and a subtle indigo ring; unselected rows get a chevron.
- Arrow keys move focus within the group; Home/End jump to the ends; Enter/Space commits and closes.
- Escape and the scrim close the sheet; focus returns to the trigger.
- No “Apply” button. A method selection is a single-choice action; adding a second confirmation would be redundant.
- Keep method descriptions factual (“Visa or Mastercard”, “Instant bank transfer”) and free of unverified speed or approval promises.

### 6.5 Review

**Structure:** back/close header, amount display, receipt rows, **Confirm** anchored at the bottom.

**Rules:**
- Show **You receive**, **Payment method**, **Fee**, and **Total to pay**.
- The fee belongs next to the method that incurred it; never reveal a known fee only on the provider page.
- Use the same currency and precision as the amount screen. The reference uses two decimals on review.
- Confirm is the only filled action. Back is chrome; close is a chrome action.
- If the amount is invalid or the method is unavailable, keep the user on the amount screen and explain why.

### 6.6 Processing

**Structure:** the same review screen, with Confirm replaced by a disabled, in-place **Processing…** button and spinner.

**Rules:**
- Do not navigate to a spinner-only screen; keep the amount and receipt visible.
- Disable repeat submission and the close/back actions while the request is in flight.
- Announce busy state with `aria-busy`; keep the visible label meaningful.
- When the request resolves, either return to the hub with a success toast or keep the user in context with a pending/failed notice that states whether anything was charged.

### 6.7 Success

**Structure:** return to the cash hub; show a success toast at the top; update the balance and recent activity.

**Copy:** “Cash added” / “Your new balance is $250.50.” The activity row reads “Cash deposit”, “Today · Bank transfer”, “+$250.50”.

**Rules:**
- The toast is not the only confirmation. The balance and activity row must reflect the result.
- Do not show a success state if the provider has only accepted the request; use “Payment pending” with a clear next step.
- Auto-dismiss is a convenience, not a guarantee. If the result is important, keep a durable record in activity.
- Do not animate the balance count-up. The final value should be legible immediately.

### 6.8 Empty and error states

- **Empty:** say what will appear and keep the next action within reach. Never fill the space with a fake value.
- **Inline error:** explain the specific problem and whether money moved. Use `InlineNotice` or the amount error; use `role="alert"` for errors.
- **Toast:** use for transient confirmation, not for errors that require a decision.
- **Disabled:** `ActionButton` uses a reduced-opacity state and removes pointer events. Do not rely on colour alone; the label and context explain why the action is unavailable.

### 6.9 Withdrawal flow

**Structure:** the withdrawal hub shows the available balance and a single **Withdraw cash** action. The amount screen shows the available balance as the limit; the method sheet offers bank transfer and card; the review shows **You withdraw**, **Destination**, **Fee**, and **Total deducted**; success returns to the hub with a toast and deducts the amount plus fee.

**Rules:**
- The balance is the hard limit; the user cannot withdraw more than `balance - fee`.
- The fee is always shown before Confirm and is added to the total deducted.
- The destination is a bank or card; no crypto address or QR code is generated here.
- Success reduces the balance by `amount + fee` and leaves a durable activity row.
- Failed, canceled, and expired states state that nothing was deducted.

---

## 7. Content rules

### Interface copy

- **Outcome-first:** “Add cash”, “Cash balance”, “You receive”, “Payment method”, “Fee”, “Total to pay”, “Cash added”.
- **Quiet labels:** form labels are muted 13px secondary text — they name the field, the white 17px input value carries the voice. Full-bright text is reserved for section titles, money, and the committed action.
- **One control height:** text inputs, selects, keypad keys, and primary actions are all 56px tall with 17px values — a field never looks small next to a total.
- **Plain language:** “Use a card or bank transfer”, not “Initiate a fiat on-ramp”.
- **No implementation labels:** do not put “demo”, “prototype”, “mock”, or similar words in the widget.
- **No unavailable-address copy:** never show “No deposit address available” or tell the user a QR/address is unavailable.
- **Prototype data:** the prototype may show an illustrative address and QR. Production must replace them with real provider data and must not present nonfunctional data as usable.
- **No unsupported promises:** do not promise instant approval, zero fees, or guaranteed arrival unless the provider contract guarantees it.

### Money copy

- Label the outcome, not the mechanism: “You receive” and “Total to pay” beat “Debit amount” and “Gross”.
- Receipts are label + value only; fee detail lines add a second row and bloat the card.
- Match the precision across amount, fee, and total.
- Use the currency's narrow symbol in UI and the full code in provider/debug contexts — except PLN, which uses the code everywhere (`10 PLN`, `50,00 PLN`) so entry and receipt never mix `zł` and `PLN`.
- Do not use a negative sign for a deposit in the activity list; use a positive amount and a deposit icon/direction.

### Status vocabulary

| State | Use | Copy pattern |
| --- | --- | --- |
| Success | Provider confirms the credit | “Cash added” + new balance |
| Pending | Request accepted, credit not final | “Payment pending” + what happens next |
| Delayed | Provider or bank is slow | “Still processing” + expected next step |
| Failed | Declined or errored | “Payment declined” + whether anything was charged |
| Unavailable | Method/rail not offered | Explain the alternative; do not silently hide the method |

---

## 8. Accessibility

### Semantics

- The widget is a labelled `section`; screen titles are `h1`; section headings are `h2`.
- The amount display is `aria-live="polite"` and `aria-atomic="true"`.
- The visible number is backed by a real input with a label, hint, and error association. The input is transparent but focusable and typeable.
- Quick amounts use `aria-pressed`; methods use `role="radio"` and `aria-checked` inside a labelled `radiogroup`.
- The sheet is a labelled `role="dialog"` with `aria-modal="true"`.
- Toasts use `role="status"` with polite announcement; error toasts use `role="alert"` with assertive announcement.
- Decorative icons are `aria-hidden`; icon-only buttons have accessible names.

### Keyboard

- Every action is a native button; no clickable `div`s.
- Amount input: type digits and a decimal separator; keypad buttons are focusable and labelled.
- Method group: Arrow keys move focus, Home/End jump, Enter/Space select and close.
- Sheet: focus moves into the dialog on open; Tab cycles inside; Escape closes; focus returns to the trigger.
- Visible focus: 2px indigo ring with a 2px offset on controls; the amount wrapper uses a focus-within ring.
- Touch targets: 44px icon buttons and close; 56px keypad keys. Supporting controls are at least 36–40px high.

### Motion and contrast

- Reduced motion is handled at the `.cashier-ds` scope.
- The primary action, body text, secondary text, success, and danger all meet AA or better on the canvas.
- `text-tertiary` on `surface-2` is 4.21:1; keep it to chevrons, separators, and non-essential glyphs. Use `muted-foreground` for any supporting sentence.
- Do not use colour as the only signal for selection or status; pair it with a dot, icon, label, or text.

### Integration notes

- The reference sheet traps Tab and marks itself `aria-modal`, but the background is not made `inert`/`aria-hidden` by the primitive. In a full application, make the background inert while the sheet is open so screen-reader virtual navigation cannot escape it.
- The success toast auto-dismisses after five seconds. For critical outcomes, keep the activity row and consider a persistent status surface.
- Test with a keyboard only, VoiceOver/NVDA, 200% zoom, and reduced motion. Test long method names and large amounts before shipping.

---

## 9. Implementation and adoption

### File map

| Path | Purpose |
| --- | --- |
| `src/styles/cashier-ds.css` | Tokens, theme scope, reduced-motion overrides |
| `src/components/cashier-ds/primitives.tsx` | Reusable primitives |
| `src/components/cashier-ds/withdraw-cash-flow.tsx` | Interactive withdrawal flow |
| `src/components/cashier-ds/money.ts` | Money formatting and input helpers |
| `src/stories/design-system.stories.tsx` | Storybook documentation and specimens |
| `src/index.css` | Loads Geist + Instrument Serif + the design-system stylesheet |
| `.storybook/preview.tsx` | Applies `.cashier-ds` to all `Cashier/*` stories; full-bleed for Screens and Design system, padded for docs stories |
| `reference/phantom/` | Source flow captures |
| `reference/design-system/` | Historical reference-flow screenshots |

### Scoping

The theme is intentionally scoped:

```tsx
import { CashierShell } from "@/components/cashier-ds/primitives"
import { WithdrawCashFlow } from "@/components/cashier-ds/withdraw-cash-flow"

<CashierShell>
  <WithdrawCashFlow />
</CashierShell>
```

`CashierShell` applies `.cashier-ds`. To migrate an existing screen, wrap only that subtree; do not move the token declarations into `:root` until every consumer is ready, because they override core shadcn variables such as `--background`, `--primary`, and `--ring`.

In Storybook, all `Cashier/*` stories already render inside `.cashier-ds` via the preview decorator. That means Foundations, Controls, Payment components, Screens, and Deposit progress inherit the black canvas, indigo action, and serif money tokens without rebuilding their layout. `Cashier/Screens` and `Cashier/Design system` are full-bleed; the docs stories keep a padded canvas.

The live cashier in `src/App.tsx` is now rebuilt with the same primitives: `CashierSurface` shell, `CashierHeader`, `OptionCard` cash/crypto fork, `MethodGroup` + `MethodRow` selection, serif `AmountDisplay` + `QuickAmounts`, `SummaryList` receipts, `StatusToast` status, and `ActionButton` primary actions. Crypto deposits render an illustrative address and QR for the prototype; production must replace them with provider-issued data, with a network warning and terms. Transaction history uses DS cards with a direction icon whose color follows the status (green = completed, yellow = pending, red = failed, gray = canceled/expired) and a two-column row: method + status pill on the left, amount + right-aligned date on the right. Failed and canceled/expired amounts are struck through; failed amounts are red, canceled/expired amounts are muted. Overline month headers, filter chips. An expanded row shows only what the header doesn't: a flat `StatusToast` banner for states needing guidance (`Payment pending`, `Checking payment`, `Payment failed`) — rendered one surface lighter (`surface-3`) with no shadow, since it sits inside the card rather than floating over the canvas — a one-line muted fee fact (`Fee PLN 7.50 · Total PLN 257.50`) wherever a fee applies, the Transaction ID, and actions (`View status` / `Contact support`) — plus Network and live confirmations for crypto. The expanded trigger squares its bottom corners so header meets body on a clean hairline with no notch. Terminal states get no banner; the header badge is the illustration. Hairlines separate header, body, and reference — never borders or inner shadows, per the reference. Full amounts receipt and timeline live only on the dedicated Review and payment-status screens. `EmptyState` covers empty states — no indigo text links. Pending deposits with `expiresAt` show a live mm:ss countdown in the expanded row and flip to `expired` on their own when the deadline passes; while pending, the status screen shows the deadline as an `Expires` receipt row, and the collapsed row surfaces `Expires m:ss` next to the status pill so urgency is visible before expanding. The filter chip for failed/canceled/expired reads **Unsuccessful** — it never claims these are all failures. Cancelable pending deposits open the cancel sheet straight from the expanded row (`View status` remains for the full timeline).

### Provider integration points

1. Replace `demoMin`/`demoMax`/`demoFeeRates`, `currency`, and `locale` in `App.tsx` and `WithdrawCashFlow` with provider/config values.
2. Replace the `setTimeout` in the processing effect with the provider request. Keep the user on the review screen while it is pending.
3. Map provider states to success, pending, delayed, failed, and unavailable. Do not infer success from an HTTP 200.
4. Keep the fee and total calculation server-authoritative. The client values are for preview; the provider’s final amount wins, and any mismatch needs an explicit state.
5. For crypto, fetch the address, network, asset, memo/tag, expiry, and warning text from the provider before rendering. The prototype may use illustrative values; production must never render a placeholder.
6. Add analytics at the same boundaries as the visible states: method sheet opened, method selected, review shown, confirm submitted, result received. Do not log full PAN, IBAN, address, or other sensitive values.

### Storybook

Stories are under `Cashier/Design system`:

- `Colour`, `Typography`, `Space and Shape`, `Actions`
- `Amount Entry`, `Choice Cards`, `Payment Methods`, `Sheet`
- `Review`, `Feedback`, `Empty States`
- `Entry Pattern`, `Withdrawal Flow`

The withdrawal flow story is the fastest way to exercise the complete withdrawal path. The static Storybook build is produced by `pnpm build-storybook`.

---

## 10. Verification

Run:

```bash
pnpm typecheck
pnpm exec eslint src/components/cashier-ds src/stories/design-system.stories.tsx
pnpm build
pnpm build-storybook
```

At the time of writing:

- `pnpm typecheck` passes.
- `pnpm build` passes.
- `pnpm build-storybook` passes.
- ESLint passes on `src/components/cashier-ds` and `src/stories/design-system.stories.tsx`.
- Repository-wide `npm run lint` passed on 18 November 2026.

Browser interaction checks performed against the withdrawal flow:

- Keyboard amount entry and decimal handling.
- Comma sanitisation.
- Method sheet focus entry, Tab trap, Escape close, and focus return.
- Arrow-key method focus and Enter selection.
- Successful cash flow through processing and back to the hub with a toast and activity row.
- Reduced-motion rendering.
- Storybook static build served locally for screenshot capture.

Final screenshots:

`reference/design-system/flow-hub.png`, `flow-amount-empty.png`, `flow-amount-filled.png`, `flow-method-sheet.png`, `flow-review.png`, `flow-processing.png`, `flow-success.png`, `amount-entry.png`, `sheet.png`, `entry-pattern.png`, `choice-cards.png`.

---

## 11. Known limitations and open work

- **Reference access:** the exact supplied Mobbin flow URL redirected to login in the in-app browser. The analysis used the closest authenticated Mobbin “Adding funds” result (`87368582-67da-4ae7-9f20-73b85432f14f`, 10 screens). The local JPGs are the visual source of record.
- **Fees and timing are illustrative.** The card fee (3%), bank fee (2%), min/max, and 1.1s processing delay are reference values, not production policy.
- **Withdrawal flow uses PLN/pl-PL.** Currency and locale are fixed in that harness. Locale-aware minor units, decimal separators, and RTL layouts are not implemented.
- **Crypto is not fully implemented.** The choice card is visual; the prototype shows an illustrative address, QR, and network selector. Production needs real provider data.
- **Crypto withdrawal:** the current widget includes a simulated crypto withdrawal path. A production implementation needs provider integration and verified destination and network data.
- **Widget integration:** `src/App.tsx` uses cashier design-system primitives. The standalone withdrawal flow runs on the same primitives.
- **No backend and no persistence.** Balances and activity reset on reload.
- **No committed end-to-end suite.** The interaction checks above were run against the local Storybook build; there is no Playwright project checked into the repository.
- **Sheet background isolation:** Tab is trapped, but background content is not inert for screen-reader virtual navigation. Add `inert`/`aria-hidden` at integration time.
- **Focus ring on the hidden amount input:** the ring is intentionally visible for keyboard focus, but it is visually prominent around the large number. Keep it for accessibility unless a user-tested alternative provides an equally clear focus indicator.
- **Validation:** rerun lint and build checks after changes.
- **Visual regression:** screenshots are captured manually; there is no automated image-diff gate.

---

## 12. QA checklist for a new cashier screen

- [ ] Is there exactly one filled indigo action?
- [ ] Is the amount the largest element, and is money white?
- [ ] Does the amount input work by keyboard, keypad, and paste?
- [ ] Are min/max and decimal rules visible when violated?
- [ ] Is the fee shown before Confirm, with its effect on the total?
- [ ] Does the method sheet move focus in, trap Tab, close on Escape, and return focus?
- [ ] Can every interactive element be reached and operated by keyboard?
- [ ] Does the sheet background become inert in the host app?
- [ ] Are success, pending, delayed, failed, and unavailable states distinguishable without colour alone?
- [ ] Does success leave a durable balance/activity record, not just a toast?
- [ ] Are prototype addresses, QR codes, balances, or transactions clearly separated from production data? In the prototype they may be illustrative; in production they must be real.
- [ ] Is any implementation label (“demo”, “prototype”, “mock”) visible in the widget? Remove it.
- [ ] Does the screen survive long names, large amounts, zero items, and non-Latin text?
- [ ] Does it respect reduced motion and 200% zoom?
- [ ] Do the tokens stay inside `.cashier-ds` until the migration is deliberate?
