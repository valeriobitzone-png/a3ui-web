# REVIEW_A3UI_WEB_B5

B5b extends the existing native Web Components conformance suite with the B1 lifecycle, B3 re-binding, and B4 opaque-extension contracts. No spec or fixture bytes were changed.

Date: 2026-09-16
Repository: `a3ui-web`
Scope: new web semantics and tests only; no changes to repo `a3`.

## Audit

| ID | Contract | Result | Evidence |
|---|---|---|---|
| W-001..W-013 | Existing mark, CTA, accessibility, overlay, fixture, and reject conformance | PASS | Existing Vitest and Playwright suite |
| W-014 | Repo `a3` is unchanged on frozen paths only: `core/`, `broker/`, `agent/`, `renderers/`, `launcher/`, `overlay/`, `adapters/`, `conformance/`, `a3ui-web/`, `spec/` | PASS | `test/freeze.test.ts`; unrelated `review-assets/` is intentionally excluded |
| W-015 | Pre-mount surface is queued and mounted when its container arrives | PASS | `test/b5.test.ts` |
| W-016 | Producer dismissal is explicitly rejected | PASS | `test/b5.test.ts` |
| W-017 | Dismissal removes the surface from memory | PASS | `test/b5.test.ts` |
| W-018 | N value updates keep form generation count at 1 | PASS | `test/b5.test.ts` |
| W-019 | `surfaceId` remains stable through re-bindings | PASS | `test/b5.test.ts` |
| W-020 | Form-key change explicitly regenerates the form to generation 2 | PASS | `test/b5.test.ts` |
| W-021 | `x-mono-gate` crosses the protocol as opaque payload | PASS | `test/b5.test.ts` |
| W-022 | Extension key without `x-` is explicitly rejected | PASS | `test/b5.test.ts` |
| W-023 | Unknown extension is ignored while the surface is drawn | PASS | `test/b5.test.ts` |
| W-024 | Surface remains valid without extensions | PASS | `test/b5.test.ts` |
| W-025 | Web fixtures and `spec/` remain unchanged | PASS | `test/b5.test.ts` |

## Frozen-path correction

W-014 previously treated every worktree change in repo `a3` as a freeze violation. That incorrectly included generated or pre-existing `review-assets/` changes, which are outside the B5b freeze contract. It now queries porcelain, unstaged diff, and staged diff only for the explicitly frozen path list above. The test does not inspect or reject unrelated paths.

W-025 applies the same principle locally: it checks only `fixtures/` and `spec/`, while generated `review-assets/` output remains outside the frozen inputs.

## Gate evidence

- Focused B5b Vitest: W-015..W-025 PASS.
- Regression Vitest: W-001..W-014 PASS, including corrected W-014.
- `npm test`: PASS (Vitest and Playwright).
- Typecheck: PASS.
- Fixture freeze: PASS.

## Changes in this slice

- Added headless B5 lifecycle, re-binding, and extension semantics in `src/b5-semantics.ts`.
- Exposed semantics from `src/index.ts` and integrated lifecycle/extensions with `A3uiSurface`.
- Added `test/b5.test.ts` for W-015..W-025.
- Corrected `test/freeze.test.ts` to scope W-014 to the declared frozen paths.
- No changes to `a3`, fixtures, or the copied `spec/`.
