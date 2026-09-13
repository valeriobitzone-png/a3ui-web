/** <a3ui-surface> SPEC_A3UI §2–§4, §7. Native custom element. */
import { SURFACE_CSS } from "./css.ts";
import { BLUR_UNAVAILABLE } from "./fallbacks.ts";
import { ctaFor, visibleAge } from "./marks.ts";
import { ctaSpeech, stateDescription } from "./speech.ts";
import { parseSurface, type Surface } from "./tuple.ts";
import { SurfaceReject } from "./reject.ts";

function adopt(root: ShadowRoot, cssText: string): void {
  const style = document.createElement("style");
  style.textContent = cssText;
  root.prepend(style);
}

export class A3uiSurface extends HTMLElement {
  static readonly observedAttributes = ["mark", "chrome"];
  #surface: Surface | null = null;
  #reject: SurfaceReject | null = null;
  #root: ShadowRoot;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    this.#root.innerHTML = `
      <div class="chrome" part="chrome">
        <div class="meta">
          <span class="oggetto"></span>
          <span class="badge" hidden></span>
          <span class="age" hidden></span>
        </div>
        <div class="payload"></div>
        <div class="reserved" hidden>
          <span class="pending-label">in verifica</span>
          <div class="reserved-slot" data-testid="reserved-slot"></div>
        </div>
        <p class="reason" id="a3ui-reason" hidden></p>
        <p class="warning" id="a3ui-warning" hidden></p>
        <p class="chrome-fallback" id="a3ui-blur" hidden></p>
        <button class="cta" type="button">Conferma</button>
      </div>
    `;
    adopt(this.#root, SURFACE_CSS);
    this.#cta().addEventListener("click", () => this.#onConfirm());
  }

  get surface(): Surface | null {
    return this.#surface;
  }

  set surface(value: Surface | null) {
    this.#surface = value;
    this.#reject = null;
    this.render();
  }

  applyJson(input: unknown): void {
    try {
      this.#reject = null;
      this.#surface = parseSurface(input);
      this.render();
    } catch (error) {
      this.#surface = null;
      this.#reject = error instanceof SurfaceReject ? error : new SurfaceReject("invalid-tuple", String(error));
      this.#renderReject();
    }
  }

  get rejectMessage(): string | null {
    return this.#reject?.message ?? null;
  }

  connectedCallback(): void {
    this.setAttribute("role", "region");
    this.render();
  }

  attributeChangedCallback(): void {
    this.render();
  }

  render(): void {
    if (this.#reject) {
      this.#renderReject();
      return;
    }
    const surface = this.#surface;
    if (!surface) return;
    const mark = surface.mark.toLowerCase();
    this.setAttribute("mark", mark);
    const cta = ctaFor(surface);
    const speech = stateDescription(surface);
    this.setAttribute("aria-label", speech);
    const described: string[] = [];
    const oggetto = this.#el(".oggetto");
    oggetto.textContent = surface.oggetto;

    const badge = this.#el(".badge");
    const age = this.#el(".age");
    const payload = this.#el(".payload");
    const reserved = this.#el(".reserved");
    const reason = this.#el(".reason");
    const warning = this.#el(".warning");
    const blur = this.#el(".chrome-fallback");
    const button = this.#cta();

    badge.hidden = true;
    age.hidden = true;
    reserved.hidden = true;
    payload.hidden = false;
    reason.hidden = true;
    warning.hidden = true;

    payload.replaceChildren();
    if (surface.price) {
      const price = document.createElement("div");
      price.className = "price";
      price.textContent = surface.price;
      payload.append(price);
    }
    if (surface.slots) {
      const row = document.createElement("div");
      row.className = "slots";
      for (const slot of surface.slots) {
        const chip = document.createElement("span");
        chip.className = "slot-chip";
        chip.textContent = slot;
        row.append(chip);
      }
      payload.append(row);
    }

    switch (surface.mark) {
      case "UNKNOWN":
        badge.hidden = false;
        badge.textContent = "uncertain";
        break;
      case "STALE":
        age.hidden = false;
        age.textContent = visibleAge(surface.age);
        break;
      case "HELD":
        badge.hidden = false;
        badge.textContent = "quarantena";
        break;
      case "CONTRADICTED":
        badge.hidden = false;
        badge.textContent = "contradicted";
        break;
      case "PENDING":
        payload.hidden = true;
        reserved.hidden = false;
        this.#el(".pending-label").textContent = surface.pending_label ?? "in verifica";
        break;
      case "FACT":
        break;
    }

    if (cta.reasonVisible && cta.reasonText) {
      reason.hidden = false;
      reason.textContent = cta.reasonText;
      described.push("a3ui-reason");
    }
    if (cta.warningVisible && cta.warningText) {
      warning.hidden = false;
      warning.textContent = cta.warningText;
      described.push("a3ui-warning");
    }

    if (this.getAttribute("chrome") === "blur-off") {
      blur.hidden = false;
      blur.textContent = BLUR_UNAVAILABLE;
      described.push("a3ui-blur");
    } else {
      blur.hidden = true;
    }

    if (described.length > 0) this.setAttribute("aria-describedby", described.join(" "));
    else this.removeAttribute("aria-describedby");

    button.disabled = !cta.enabled;
    button.setAttribute("aria-label", ctaSpeech(surface));
    if (cta.enabled) button.removeAttribute("aria-disabled");
    else button.setAttribute("aria-disabled", "true");
    button.toggleAttribute("data-require-confirmation", cta.requireConfirmation);
  }

  #onConfirm(): void {
    const surface = this.#surface;
    if (!surface) return;
    const cta = ctaFor(surface);
    if (!cta.enabled) return;
    this.dispatchEvent(
      new CustomEvent("a3ui-dispatch", {
        bubbles: true,
        composed: true,
        detail: { action: "confirm", oggetto: surface.oggetto, mark: surface.mark },
      }),
    );
  }

  #renderReject(): void {
    const message = this.#reject?.message ?? "surface rejected";
    this.setAttribute("mark", "rejected");
    this.setAttribute("aria-label", message);
    this.#el(".oggetto").textContent = "surface rejected";
    this.#el(".badge").hidden = true;
    this.#el(".age").hidden = true;
    this.#el(".payload").hidden = false;
    this.#el(".payload").textContent = message;
    this.#el(".reserved").hidden = true;
    this.#el(".reason").hidden = false;
    this.#el(".reason").textContent = message;
    this.#cta().disabled = true;
    this.#cta().setAttribute("aria-disabled", "true");
  }

  #el(selector: string): HTMLElement {
    const node = this.#root.querySelector(selector);
    if (!(node instanceof HTMLElement)) throw new SurfaceReject("internal", `missing ${selector}`);
    return node;
  }

  #cta(): HTMLButtonElement {
    const node = this.#root.querySelector(".cta");
    if (!(node instanceof HTMLButtonElement)) throw new SurfaceReject("internal", "missing cta");
    return node;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "a3ui-surface": A3uiSurface;
  }
}
