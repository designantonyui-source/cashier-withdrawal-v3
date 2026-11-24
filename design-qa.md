# Design QA — Fiat cashier reference

> Historical audit of an earlier interface. The findings and implementation details below describe that review, not the current cashier.

**Source visual truth**: `/Users/antonybozhatarnyk/Library/Application Support/CleanShot/media/media_2Kq0xrezmw/CleanShot 2026-11-06 at 14.21.20@2x.png`

**Implementation screenshot**: Not captured. The CUA browser host reports `The browser access host is unavailable`; its native app pipe also fails to start. A local development server is running at `http://127.0.0.1:5173/`.

**Viewport and density**: Source is 1566 × 1410 px. The filename indicates 2× density, so the nominal CSS viewport is 783 × 705 px. An implementation viewport and density could not be captured or normalized.

**State**: Target is Fiat, Poland, EUR, with no payment method selected. The implementation defaults to that state.

## Evidence and comparison

- The source reference is the user-provided iGaming cashier screenshot.
- No browser-rendered implementation screenshot is available, so full-view and focused-region visual comparisons were not possible.
- `npm run build` passes. This proves the app compiles; it does not prove visual fidelity or browser interaction behavior.
- CUA browser access and console inspection are unavailable in this run.

## Fidelity surfaces

- **Typography**: The existing Geist Variable font is retained. Rendered font size, weight, line height, and wrapping against the source are unverified.
- **Spacing and layout**: The code uses a 660 px max-width modal, a two-column regular-method grid, and a one-column small-screen fallback. Rendered proportions and overflow are unverified.
- **Colors and tokens**: The implementation uses a charcoal modal and method tiles with a lime active-tab/action accent, matching the source direction. Rendered color and contrast comparison is unverified.
- **Images and assets**: Payment marks are local files under `public/payment-logos/` and are copied to `dist/payment-logos/`. Their rendered scale and crop are unverified.
- **Copy and content**: Fiat is grouped into Popular and Regular. Poland's Popular method is bank transfer; Regular includes Card, BLIK, Revolut, N26, Skrill, Neteller, Paysafecard, Binance Pay, and Bybit Pay. Labels and method availability are demo configuration.

## Findings

- **Blocked — visual verification**: The implementation could not be opened or captured in the user's browser because the CUA browser host is unavailable. No conclusion about P0/P1/P2 visual differences can be made.

## Implementation checklist

1. Capture the rendered Fiat / Poland / EUR screen at 783 × 705 CSS px and 2× density.
2. Compare the whole modal and a focused method-grid region against the source screenshot.
3. Verify Poland recommends bank transfer, Germany recommends SEPA, wallets remain in Regular, and selecting Card reveals fields inline.
4. Check currency and country changes, primary actions, and browser console output.
5. Record fixes and repeat the visual comparison.

final result: blocked
