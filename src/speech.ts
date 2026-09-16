// SPDX-License-Identifier: Apache-2.0
// Part of the A3 universe. See LICENSE.
/** SPEC_A3UI §7: non-sensory stateDescription. Type plus reason plus forbidden action. */
import { ctaFor, staleWarning } from "./marks.ts";
import type { Surface } from "./tuple.ts";

export function spokenReason(reason: string): string {
  return reason.replace(/:\s*/g, " ").replace(/\s+/g, " ").trim();
}

export function spokenPrice(price: string): string {
  const numeric = price.replace(/[€$]/g, "").trim();
  if (price.includes("€") || price.toLowerCase().includes("eur")) return `${numeric} euro`;
  return numeric;
}

export function stateDescription(surface: Surface): string {
  const cta = ctaFor(surface);
  switch (surface.mark) {
    case "CONTRADICTED": {
      const reason = spokenReason(cta.reasonText ?? "contradicted resolve conflict first");
      return `${surface.oggetto}, contradicted, conferma disabilitata, ragione: ${reason}`;
    }
    case "STALE": {
      const warning = cta.warningText ?? staleWarning(surface.age);
      const price = surface.price ? `, prezzo ${spokenPrice(surface.price)}` : "";
      const conferm = cta.enabled ? "conferma abilitata" : "conferma disabilitata";
      return `${surface.oggetto}, ${warning}${price}, ${conferm}, warning: ${warning}`;
    }
    case "PENDING":
      return `${surface.oggetto}, in verifica, slot riservato, conferma disabilitata, ragione: in verifica, slot riservato`;
    case "FACT": {
      const conferm = cta.enabled ? "conferma abilitata" : "conferma disabilitata";
      return `${surface.oggetto}, ${conferm}`;
    }
    case "HELD":
      return `${surface.oggetto}, held, conferma disabilitata, ragione: quarantine`;
    case "UNKNOWN":
      return `${surface.oggetto}, unknown, conferma limitata, ragione: insufficient evidence`;
  }
}

export function ctaSpeech(surface: Surface): string {
  const cta = ctaFor(surface);
  if (!cta.enabled && cta.reasonText) {
    return `Conferma, disabilitata, ${spokenReason(cta.reasonText)}`;
  }
  if (cta.enabled && cta.warningText) {
    return `Conferma, ${cta.warningText}`;
  }
  return cta.enabled ? "Conferma" : "Conferma, disabilitata";
}

export function essentialGlyph(mark: Surface["mark"]): string {
  if (mark === "UNKNOWN") return "?";
  if (mark === "FACT") return "✓";
  return "…";
}

export function essentialSpeech(surface: Surface): string {
  return `${surface.oggetto}, ${surface.mark.toLowerCase()}`;
}
