---
target: src/components/bonus-offer.tsx
total_score: 17
max_score: 36
na_heuristics: 9
p0_count: 0
p1_count: 2
target_identity: "file:/Users/antonybozhatarnyk/Downloads/Harness-Test/casier-withdrawal-v2-copy/src/components/bonus-offer.tsx"
target_fingerprint: "sha256:dab3c7d239e4162ea285493a24b62dd1c0c12c7ba8cf30f3e660cf153f5ef59a"
target_path: /Users/antonybozhatarnyk/Downloads/Harness-Test/casier-withdrawal-v2-copy/src/components/bonus-offer.tsx
timestamp: 2026-11-10T18-13-01Z
slug: src-components-bonus-offer-tsx
---
Method: dual-agent (A: ses_e39570204ffe4RYl20O3uNa8Z5 · B: ses_e3956be19ffeVVO4ZXxQv6mQ6o)

Design Health: 17/36 (Poor). H1 Visibility 2, H2 Match 1, H3 Control 3, H4 Consistency 2, H5 Error Prevention 2, H6 Recognition 1, H7 Flexibility 2, H8 Minimalist 1, H9 n/a, H10 Help 3.

Specificity: casino-marketing layout transplanted into task UI. Every element borrowed from ad surface; hierarchy inverted (promo number outranks toggle decision).

Working: 3-tile skeleton + single decision row is right shape; a11y wiring correct (switch, expanded, progressbar); active state is informative.

Priority issues:
P1 — Two 100s: "100% up to 100 PLN" + "Min deposit 100 PLN" share identical numbers (cap vs threshold). Fix: headline "100 PLN bonus on 100 PLN deposit" with lavender only on bonus amount.
P1 — "Activate bonus" says nothing about consequence. Fix: add one-line summary at toggle, e.g. "Adds 100 PLN bonus on 100 PLN+ deposit · 35× bonus".
P2 — Promotional header displaces task (gift + pill + 22px headline + deco ~80px above payment methods). Fix: shrink to single-line header, drop decor layers in Operate, target ≤110px collapsed.
P2 — "35×" and "Max bet" meaningless collapsed (no basis/scope). Fix: labels "35× bonus" and "Max bet while wagering".
P3 — Default-ON consent with no summary at control; promote aria-label "Add first deposit bonus" to visible text.

Personas: Jordan (jargon: 35×, Spade icon misleads), Sam (dual-100 ambiguity), Casey (small switch target, focus offset over glass).

Minor: drop rotated highlight + orb layers; pillar border + lavender headline = 3 accents in 80px, reduce to 1; min-deposit repeated in tile + terms.

Questions considered: why gift+pill instead of task-linked line; why honest math only appears after opt-in.
