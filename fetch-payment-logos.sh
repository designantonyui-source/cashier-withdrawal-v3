#!/usr/bin/env bash
# Fetches open-licensed payment-method SVG logos for the Polish market set
# into public/payment-logos/ (dark-variant wordmarks fit the cashier theme).
#
# Sources (permissive collections; each brand's usage guidelines still apply):
#   https://github.com/richiehug/payment-icons  (light + dark variants)
#   https://github.com/datatrans/payment-logos (wallets, APMs)
#
# Run from the project root:  ./fetch-payment-logos.sh
set -euo pipefail

DEST="public/payment-logos"
RICHIE="https://raw.githubusercontent.com/richiehug/payment-icons/main/icons"
DATATRANS="https://raw.githubusercontent.com/datatrans/payment-logos/master/assets"

mkdir -p "$DEST"

fetch() {
  local url="$1" out="$2"
  if [ -f "$DEST/$out" ]; then
    echo "skip  $out (exists)"
    return 0
  fi
  if curl -fsSL "$url" -o "$DEST/$out"; then
    echo "ok    $out"
  else
    echo "FAIL  $out  <- $url" >&2
    rm -f "$DEST/$out"
  fi
}

# --- richiehug/payment-icons: dark variants (Polish market core) ---
fetch "$RICH/other/blik-dark.svg"            "blik.svg"
fetch "$RICH/other/przelewy24-dark.svg"      "przelewy24.svg"
fetch "$RICH/other/sepa-dark.svg"            "sepa.svg"
fetch "$RICH/other/paysafecard-dark.svg"     "paysafecard-dark.svg"
fetch "$RICH/wallets/apple-pay-dark.svg"     "apple-pay.svg"
fetch "$RICH/wallets/google-pay-dark.svg"    "google-pay.svg"

# --- datatrans/payment-logos: methods richiehug lacks ---
fetch "$DATATRANS/apm/blik.svg"              "blik-datatrans.svg"
fetch "$DATATRANS/apm/skrill.svg"            "skrill-datatrans.svg"
fetch "$DATATRANS/apm/paypal.svg"            "paypal-datatrans.svg"
fetch "$DATATRANS/apm/przelewy24.svg"        "przelewy24-datatrans.svg"
fetch "$DATATRANS/apm/crypto.svg"            "crypto.svg"

echo
echo "Manual brand-kit downloads still needed (no permissive library covers these):"
echo "  tpay            https://tpay.com (brand/press assets)"
echo "  dotpay          https://www.dotpay.pl (media kit)"
echo "  trustly         https://trustly.com (brand assets)"
echo "  rapid-transfer  https://www.skrill.com (Skrill brand page covers Rapid Transfer)"
echo "  muchbetter      https://www.muchbetter.com (brand resources)"
echo "  jeton           https://www.jeton.com (press/brand)"
echo "  mifinity        https://mifinity.com (brand assets)"
echo "  payz            https://www.payz.com"
echo "  neosurf         https://www.neosurf.com (brand page)"
echo "Save them as: tpay.svg dotpay.svg trustly.svg rapid-transfer.svg"
echo "             muchbetter.svg jeton.svg mifinity.svg payz.svg neosurf.svg"
echo "All names must match src/components/cashier-ds/payment-logos.ts"
