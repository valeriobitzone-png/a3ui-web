/** <a3ui-overlay> SPEC_A3UI §5. COLLAPSED default, pass-through outside the pill. */
import { OVERLAY_CSS } from "./css.ts";
import { MARKS, type Mark } from "./tuple.ts";
import { OverlaySession, type OverlayCause, type OverlayPhase } from "./overlay.ts";
import { essentialGlyph } from "./speech.ts";
import { SurfaceReject } from "./reject.ts";

function adopt(root: ShadowRoot, cssText: string): void {
  const style = document.createElement("style");
  style.textContent = cssText;
  root.prepend(style);
}

function asMark(raw: string | null): Mark {
  const value = (raw ?? "FACT").toUpperCase();
  return MARKS.includes(value as Mark) ? (value as Mark) : "FACT";
}

export class A3uiOverlay extends HTMLElement {
  static readonly observedAttributes = ["mark"];
  readonly session: OverlaySession;
  #root: ShadowRoot;
  #onDoc: ((event: Event) => void) | null = null;
  #onKey: ((event: KeyboardEvent) => void) | null = null;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    this.#root.innerHTML = `
      <button class="pill" type="button" aria-expanded="false"></button>
      <div class="panel" hidden>
        <slot></slot>
        <button class="dismiss" type="button">Chiudi</button>
      </div>
    `;
    adopt(this.#root, OVERLAY_CSS);
    this.session = new OverlaySession(undefined, (phase, cause) => this.#sync(phase, cause));
    this.#pill().addEventListener("click", () => this.session.apply("tap-pill"));
    this.#dismiss().addEventListener("click", () => this.session.apply("dismiss"));
    this.addEventListener("a3ui-dispatch", () => this.session.apply("choice-dispatch"));
  }

  get phase(): OverlayPhase {
    return this.session.phase;
  }

  expand(cause: OverlayCause = "intent"): void {
    this.session.apply(cause);
  }

  collapse(cause: OverlayCause = "dismiss"): void {
    this.session.apply(cause);
  }

  connectedCallback(): void {
    this.setAttribute("phase", this.session.phase);
    this.refreshPill();
    this.#onDoc = (event: Event) => {
      if (this.session.phase !== "expanded") return;
      const path = event.composedPath();
      if (path.includes(this)) {
        this.session.noteInteraction();
        return;
      }
      this.session.apply("under-app-focus");
    };
    this.#onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") this.session.apply("dismiss");
    };
    document.addEventListener("pointerdown", this.#onDoc, true);
    document.addEventListener("focusin", this.#onDoc, true);
    document.addEventListener("keydown", this.#onKey);
  }

  disconnectedCallback(): void {
    if (this.#onDoc) {
      document.removeEventListener("pointerdown", this.#onDoc, true);
      document.removeEventListener("focusin", this.#onDoc, true);
    }
    if (this.#onKey) document.removeEventListener("keydown", this.#onKey);
    this.session.dispose();
  }

  attributeChangedCallback(): void {
    this.refreshPill();
  }

  refreshPill(): void {
    const mark = asMark(this.getAttribute("mark"));
    const pill = this.#pill();
    pill.textContent = essentialGlyph(mark);
    pill.setAttribute("aria-label", `overlay, ${mark.toLowerCase()}`);
  }

  #sync(phase: OverlayPhase, cause: OverlayCause): void {
    this.setAttribute("phase", phase);
    const expanded = phase === "expanded";
    this.#panel().hidden = !expanded;
    this.#pill().setAttribute("aria-expanded", expanded ? "true" : "false");
    this.dispatchEvent(
      new CustomEvent("a3ui-overlay-phase", {
        bubbles: true,
        composed: true,
        detail: { phase, cause },
      }),
    );
  }

  #pill(): HTMLButtonElement {
    const node = this.#root.querySelector(".pill");
    if (!(node instanceof HTMLButtonElement)) throw new SurfaceReject("internal", "missing pill");
    return node;
  }

  #panel(): HTMLElement {
    const node = this.#root.querySelector(".panel");
    if (!(node instanceof HTMLElement)) throw new SurfaceReject("internal", "missing panel");
    return node;
  }

  #dismiss(): HTMLButtonElement {
    const node = this.#root.querySelector(".dismiss");
    if (!(node instanceof HTMLButtonElement)) throw new SurfaceReject("internal", "missing dismiss");
    return node;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "a3ui-overlay": A3uiOverlay;
  }
}
