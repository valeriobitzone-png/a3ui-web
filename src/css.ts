/** Constructable styles. Marks are geometry and labels, not opacity. SPEC_A3UI §3 §6 §7. */

export const SURFACE_CSS = `
:host {
  display: block;
  color: #111;
  font: 15px/1.4 ui-sans-serif, system-ui, sans-serif;
  --target: 48px;
  --amber: #b45309;
}

:host([hidden]) { display: none; }

.chrome {
  position: relative;
  min-height: 168px;
  box-sizing: border-box;
  padding: 16px;
  border: 1px solid #1a1a1a;
  border-radius: 12px;
  background: #f6f4ef;
  display: grid;
  gap: 10px;
  align-content: start;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.oggetto {
  font-weight: 700;
  font-size: 18px;
}

.badge, .age, .reason, .warning, .pending-label {
  font-weight: 700;
  letter-spacing: 0.01em;
}

.badge, .age, .pending-label {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 2px 8px;
  border: 1px solid currentColor;
  border-radius: 999px;
}

.badge[hidden], .age[hidden], .reason[hidden], .warning[hidden], .reserved[hidden], .payload[hidden] {
  display: none !important;
}

.payload {
  min-height: 48px;
}

.slots {
  display: flex;
  gap: 8px;
}

.slot-chip {
  padding: 8px 12px;
  border: 1px solid currentColor;
  min-height: var(--target);
  display: inline-flex;
  align-items: center;
}

.reserved {
  min-height: 96px;
  display: grid;
  gap: 8px;
}

.reserved-slot {
  min-height: 72px;
  outline: 2px dashed currentColor;
  outline-offset: 2px;
}

.reason, .warning {
  margin: 0;
}

.cta {
  justify-self: start;
  min-width: var(--target);
  min-height: var(--target);
  padding: 12px 16px;
  font: inherit;
  font-weight: 700;
  border: 2px solid currentColor;
  background: #fff;
  cursor: pointer;
}

.cta:disabled, .cta[aria-disabled="true"] {
  cursor: not-allowed;
  color: inherit;
  opacity: 1;
  background: #fff;
  /* MUST NOT encode state by opacity alone. */
  border-style: dashed;
  text-decoration: none;
}

.spinner { display: none !important; }

:host([mark="unknown"]) .chrome {
  outline: 2px dashed currentColor;
  outline-offset: -8px;
}

:host([mark="stale"]) .chrome {
  border: 3px solid var(--amber);
}

:host([mark="held"]) .chrome {
  border: 3px solid currentColor;
  animation: a3ui-pulse 2.8s ease-in-out infinite;
}

:host([mark="contradicted"]) .payload,
:host([mark="contradicted"]) .slot-chip {
  text-decoration: line-through;
  text-decoration-thickness: 2px;
}

:host([mark="pending"]) .chrome {
  outline: 2px dashed currentColor;
  outline-offset: -6px;
}

:host([mark="fact"]) .chrome {
  border: 1px solid #1a1a1a;
}

@keyframes a3ui-pulse {
  0%, 100% { box-shadow: 0 0 0 0 currentColor; }
  50% { box-shadow: 0 0 0 8px transparent; }
}

@media (prefers-reduced-motion: reduce) {
  :host([mark="held"]) .chrome,
  .chrome, .cta, .badge {
    animation: none !important;
    transition: none !important;
  }
}

@media (prefers-contrast: more) {
  .chrome {
    background: #fff;
    color: #000;
    border-color: #000;
  }
  :host([mark="unknown"]) .chrome {
    background: repeating-linear-gradient(-45deg, #fff, #fff 6px, #000 6px, #000 7px);
    outline: 3px dashed #000;
  }
  :host([mark="stale"]) .chrome {
    border: 4px double #000;
    background: repeating-linear-gradient(90deg, #fff, #fff 10px, #d6d6d6 10px, #d6d6d6 12px);
  }
  :host([mark="held"]) .chrome {
    outline: 4px solid #000;
    outline-offset: 3px;
    animation: none;
  }
  :host([mark="contradicted"]) .payload,
  :host([mark="contradicted"]) .slot-chip {
    text-decoration: line-through;
    text-decoration-thickness: 3px;
  }
  :host([mark="pending"]) .reserved-slot {
    outline: 3px dotted #000;
    background: repeating-linear-gradient(0deg, #fff, #fff 8px, #ececec 8px, #ececec 10px);
  }
  .cta {
    border-width: 3px;
  }
}
`;

export const OVERLAY_CSS = `
:host {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 40;
  font: 15px/1.4 ui-sans-serif, system-ui, sans-serif;
}

.pill {
  pointer-events: auto;
  position: absolute;
  right: 16px;
  bottom: 16px;
  min-width: 48px;
  min-height: 48px;
  border-radius: 999px;
  border: 2px solid currentColor;
  background: #111;
  color: #fff;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.panel {
  pointer-events: auto;
  position: absolute;
  right: 16px;
  bottom: 76px;
  width: min(360px, calc(100vw - 32px));
}

.panel[hidden] { display: none !important; }

.dismiss {
  margin-top: 8px;
  min-width: 48px;
  min-height: 48px;
  font: inherit;
  font-weight: 700;
  border: 2px solid currentColor;
  background: #fff;
}

@media (prefers-reduced-motion: reduce) {
  :host, .pill, .panel { animation: none !important; transition: none !important; }
}

@media (prefers-contrast: more) {
  .pill { background: #000; color: #fff; outline: 3px solid #000; outline-offset: 2px; }
}
`;

export const HOST_CSS = `
:host {
  display: block;
  color: #111;
  font: 16px/1.45 ui-sans-serif, system-ui, sans-serif;
}

.skip {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  min-height: 48px;
  padding: 8px 12px;
  margin: 8px;
  font: inherit;
  font-weight: 700;
  color: inherit;
  background: #fff;
  border: 2px solid currentColor;
  z-index: 50;
}

.fallbacks {
  display: grid;
  gap: 6px;
  margin: 8px;
}

.fallback {
  margin: 0;
  padding: 8px 12px;
  border: 2px dashed currentColor;
  font-weight: 700;
}

.fallback[hidden] { display: none !important; }

.under-app {
  min-height: 240px;
  margin: 8px;
  padding: 16px;
  background: #dbe4f0;
  border: 1px solid #334;
}

.under-app button {
  min-width: 48px;
  min-height: 48px;
  font: inherit;
}

.marks {
  display: grid;
  gap: 16px;
  margin: 8px;
  max-width: 420px;
}

.frost {
  background: rgba(255,255,255,0.55);
}

.frost.live {
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}

@media (prefers-contrast: more) {
  .under-app { background: #fff; border: 3px solid #000; }
  .fallback { border-style: dotted; }
}
`;
