# Payment method marks

How the cashier's method list shows the two generic rails. The rule, taken from
how checkouts like Adyen and Stripe do it: a method that has a brand shows the
brand, and only a method with no brand gets a drawn mark.

| Rail | Shown as | Source |
| --- | --- | --- |
| Card | Visa + Mastercard lockup | `public/payment-logos/visa.svg` (Simple Icons, CC0) + `mastercard.svg` (brand colours, drawn in-house) |
| Bank transfer | single-tone bank mark | `bank-transfer.svg` |
| Generic card, no scheme info | `card-payment.svg` | fallback only |

- Source of truth: Figma → Cashier → `02 · Components` → `06 · Payment icons`.
- In use: Figma → `04 · Product flows` → `Popular methods`.
- Tile: 56 × 44 white pill, marks centred at brand scale, so the row reads as a
  row of logos rather than a row of logos plus two illustrations.
- `*-3d.png` are the earlier 3D renders, kept for large hero surfaces only.
