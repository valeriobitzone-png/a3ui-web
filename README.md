# a3ui-web

Epistemic window manager in TypeScript and native Web Components. Implements [`spec/SPEC_A3UI.md`](spec/SPEC_A3UI.md). Not a Compose port.

```bash
npm install
npx playwright install chromium
npm run gate
```

Zero runtime dependencies. Vitest covers the tuple, CTA law, speech, overlay reducer, fallbacks, and the a3 freeze. Playwright covers W-001–W-013 in Chromium.
