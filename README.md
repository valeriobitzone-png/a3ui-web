# a3ui-web — native Web Components renderer

![a3ui-web cover](docs/assets/cover.png)

A native Web Components renderer for A3UI surface semantics in the browser.

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](https://github.com/valeriobitzone-png/a3/blob/main/LICENSE) [![Latest tag](https://img.shields.io/github/v/tag/valeriobitzone-png/a3ui-web?sort=semver)](https://github.com/valeriobitzone-png/a3ui-web/tags) [![CI](https://github.com/valeriobitzone-png/a3ui-web/actions/workflows/ci.yml/badge.svg)](https://github.com/valeriobitzone-png/a3ui-web/actions/workflows/ci.yml)

## What it is

A TypeScript renderer built with native Web Components. It consumes the A3UI surface tuple and implements mark-to-CTA semantics, accessibility output, lifecycle, re-binding, and opaque extensions.

## What it is NOT

It is not a Compose port, not a general UI framework, and not a claim that browser output is pixel-identical across renderers.

## Status

- **VERIFIED:** W-001..W-025, Vitest, Playwright, typecheck, lifecycle/re-binding/extensions, and shared fixture semantics.
- **UNVERIFIED:** production adoption and browser/device coverage beyond the declared gate.

## Quickstart

### Get it

```bash
git clone https://github.com/valeriobitzone-png/a3ui-web.git
cd a3ui-web
# Requirements: Node.js >=20 and npm.
npm ci
npx playwright install chromium
```

### Prove it

```bash
npm run typecheck
npx vitest run
```

### Integrate it

Import the Web Components, consume the shared fixtures, and preserve mark→CTA mapping: CONTRADICTED and PENDING disable confirmation; STALE exposes age/warning; FACT is the enabled baseline. Unknown `x-*` extensions are ignored without invalidating the surface.

## Architecture

`src/` contains Web Components and semantic mapping; `test/` contains unit and browser conformance; `fixtures/` contains the local contract examples; `spec/` records the consumed A3UI contract.

## Testing & conformance

CI runs typecheck and Vitest. The full local gate additionally runs Playwright against Chromium. Fixture bytes are treated as contract inputs.

## Family

- [a3](https://github.com/valeriobitzone-png/a3) — normative specs and Kotlin implementation
- [a3-ts](https://github.com/valeriobitzone-png/a3-ts) — TypeScript reference implementation
- [a3-go](https://github.com/valeriobitzone-png/a3-go) — Go reference implementation
- [a3ui-cli](https://github.com/valeriobitzone-png/a3ui-cli) — textual Python renderer
- [a3ui-graphics](https://github.com/valeriobitzone-png/a3ui-graphics) — renderer-neutral graphics tokens

## Contributing

Preserve DOM accessibility, provenance, shared fixtures, and the mark→CTA contract. See the pull request checklist.

## License

Implementation code is Apache-2.0. The consumed A3UI specification is CC BY 4.0 in the A3 repository.

## Provenance

Measured: DOM assertions, browser tests, accessibility output, and fixture comparisons. Pixel details and browser/device behavior outside the declared gate remain unverified.
