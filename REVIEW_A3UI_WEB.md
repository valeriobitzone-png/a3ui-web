# REVIEW_A3UI_WEB

Second a3ui renderer. TypeScript + native Web Components. Implements `spec/SPEC_A3UI.md` (copy of a3 `SPEC_A3UI` 0.1.0). Not a Compose translation.

Gate: **W-001..W-014 PASS** on 2026-09-13. Tag `a3ui-web-v0.1` only after this file.

Evidence: `review-assets/web/` (Playwright screenshots, DOM JSON, aria-label dumps). Unit: Vitest. E2E: Playwright Chromium via the installed Google Chrome channel (`playwright.config.ts`).

## Audit

| ID | Invariant | Result | Evidence |
|----|-----------|--------|----------|
| W-001 | CONTRADICTED → CTA disabled, reason visible, aria-label names type + forbidden confirm + reason | PASS | `W-001.png`, `W-001.dom.json` |
| W-002 | STALE → CTA enabled with warning `stale 2 ore`, complete aria-label, age `2h fa` | PASS | `W-002.png`, `W-002.dom.json` |
| W-003 | PENDING → CTA disabled, reserved slot, no spinner, aria-label contains `in verifica, slot riservato` | PASS | `W-003.png`, `W-003.dom.json` |
| W-004 | FACT → CTA enabled, baseline aria-label, no extra mark | PASS | `W-004.png`, `W-004.dom.json` |
| W-005 | `prefers-reduced-motion: reduce` → HELD pulse duration 0, badges/reason/slot remain | PASS | `W-005.png`, `W-005.dom.json` |
| W-006 | `prefers-contrast: more` → hatch, label, strikethrough, dotted reserved slot; not color alone | PASS | `W-006.png`, `W-006.dom.json` |
| W-007 | blur-off → `blur unavailable` visible, marks still readable | PASS | `W-007.png`, `W-007.dom.json` |
| W-008 | overlay COLLAPSED default → EXPAND on pill tap → COLLAPSE after dispatch | PASS | `W-008-collapsed.png`, `W-008-expanded.png`, `W-008.png` |
| W-009 | COLLAPSED hit outside pill reaches the under-app | PASS | `W-009.png`, `W-009.dom.json` (`under-hits` = 1) |
| W-010 | CTA / pill / skip touch target ≥ 48px | PASS | `W-010.dom.json` (CTA 108.25×49) |
| W-011 | skip link `Salta ai marchi` first in focus order | PASS | `W-011.focus.txt` |
| W-012 | same fixtures → same *semantic* output as `:a3ui:conformance` (mark, CTA, reason, speech). Not pixel-identical. | PASS | `W-012.semantic.json`, `W-012-*.png` |
| W-013 | incomplete surface tuple → explicit `missing-field` reject, no silent placeholder | PASS | `W-013.png`, Vitest `tuple.test.ts` |
| W-014 | repo a3 unmodified (zero porcelain, zero diff) | PASS | Vitest `freeze.test.ts` |

## Documented aria-labels (stateDescription)

These strings are generated from SPEC_A3UI §7 (type + reason + forbidden action). They are not copied from Kotlin `SpokenLaw`.

| Fixture | aria-label |
|---------|------------|
| calendar-contradicted | `Calendario, contradicted, conferma disabilitata, ragione: contradicted resolve conflict first` |
| hotel-stale | `Hotel, stale 2 ore, prezzo 89 euro, conferma abilitata, warning: stale 2 ore` |
| train-pending | `Treno, in verifica, slot riservato, conferma disabilitata, ragione: in verifica, slot riservato` |
| flight-fact | `Volo, conferma abilitata` |

Disabled CTAs are not announced as a dimmed button.

## Comparison with Compose (same fixtures)

| Surface | Mark | CTA | Reason / warning | Speech |
|---------|------|-----|------------------|--------|
| Calendario | CONTRADICTED both | disabled both | `contradicted: resolve conflict first` both | identical to a3 AX spoken dump |
| Hotel | STALE both | enabled both | age visible both; web warning `stale 2 ore` | see divergence 1 and 2 |
| Treno | PENDING both | disabled both | reserved slot, `in verifica`, no spinner both | identical to a3 AX spoken dump |
| Volo | FACT both | enabled both | no extra mark both | identical to a3 AX spoken dump |

Semantic contract holds. Pixels differ (Web Components vs Compose chrome). That is allowed.

## Declared divergences

Do not silently reconcile.

1. **STALE oggetto copy.** Fixture `oggetto` is `Hotel`. Compose a11y showcase spoke `Hotel Milano`. Milano is scene chrome, not a tuple field. **Compose is wrong relative to the fixture; web is right** to speak `Hotel`. Mark, CTA enablement, and stale warning still match.

2. **STALE warning token.** Fixture field `warning` is `stale 2h`. W-002 and SPEC §7 require a non-sensory warning; web CTA/aria use `stale 2 ore`. Visible age stays the fixture duration as `2h fa`. Compose AX speech also used `stale 2 ore`. **Neither impl should treat `stale 2h` as the spoken string.** Web shows `stale 2 ore` on the surface, not the fixture chrome token.

3. **HELD / UNKNOWN** have no conformance JSON. Web synthesizes valid 7-field tuples for W-005/W-006 only. Compose showcase scenes are not a fixture oracle.

4. **Haptic.** Web has no Taptic actuator. Fallback `haptic Mac limited` is logged at boot and shown only with `?haptic=limited`. That is an honest platform limit, not a missing mark.

5. **Overlay permission.** Android `SYSTEM_ALERT_WINDOW` has no browser equivalent. `?permission=denied` shows `overlay disabled: overlay permission not granted` (SPEC §8 equivalent wording) and does not render surfaces.

6. **Toolchain.** E2E launches Google Chrome (`channel: "chrome"`) because Playwright's bundled Chromium extract hung on this host. Engine remains Chromium. Marks do not depend on the channel.

## What this renderer is not

- Not a port of `:renderers:android-compose` or `:renderers:mac-compose`.
- No React, Vue, or runtime UI framework. Zero runtime dependencies.
- CTA on CONTRADICTED stays disabled.
- Reduced motion does not remove marks.
- PENDING has no spinner.
- State is not encoded by opacity alone (dashed disabled border + label/reason/hatch).
