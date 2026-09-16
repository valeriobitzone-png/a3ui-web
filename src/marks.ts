// SPDX-License-Identifier: Apache-2.0
// Part of the A3 universe. See LICENSE.
/** SPEC_A3UI §4 Mark to CTA permission. Closed table. Law, not decoration. */
import type { Mark, Surface } from "./tuple.ts";

export type CtaDecision = {
  enabled: boolean;
  requireConfirmation: boolean;
  warningVisible: boolean;
  warningText: string | null;
  reasonVisible: boolean;
  reasonText: string | null;
  forbiddenAction: string | null;
  pendingReserved: boolean;
};

const CONFIRM = "confirm";

function forbidden(surface: Surface): string | null {
  return surface.actions_forbidden[0] ?? (surface.actions_permitted.includes(CONFIRM) ? null : CONFIRM);
}

/** Visible age on STALE: declared duration plus "fa" when the token is a relative duration. */
export function visibleAge(age: string): string {
  if (age === "unknown-age" || age === "ora") return age;
  if (/\sfa$/.test(age) || /fa$/.test(age)) return age;
  return `${age} fa`;
}

/**
 * STALE warning copy for CTA and speech. Fixture token `stale 2h` is duration chrome.
 * SPEC §7 requires a non-sensory warning; Italian duration words match the a3ui a11y gate.
 */
export function staleWarning(age: string): string {
  const hours = /^(\d+)\s*h$/i.exec(age.trim());
  if (hours) {
    const n = hours[1] ?? "0";
    return n === "1" ? "stale 1 ora" : `stale ${n} ore`;
  }
  const minutes = /^(\d+)\s*m$/i.exec(age.trim());
  if (minutes) return `stale ${minutes[1] ?? "0"} min`;
  if (age === "ora") return "stale ora";
  return `stale ${age}`;
}

export function ctaFor(surface: Surface): CtaDecision {
  const mark: Mark = surface.mark;
  switch (mark) {
    case "CONTRADICTED": {
      const reason = surface.reason ?? "contradicted: resolve conflict first";
      return {
        enabled: false,
        requireConfirmation: false,
        warningVisible: false,
        warningText: null,
        reasonVisible: true,
        reasonText: reason,
        forbiddenAction: forbidden(surface) ?? CONFIRM,
        pendingReserved: false,
      };
    }
    case "HELD":
      return {
        enabled: false,
        requireConfirmation: true,
        warningVisible: false,
        warningText: null,
        reasonVisible: true,
        reasonText: "quarantine",
        forbiddenAction: forbidden(surface) ?? CONFIRM,
        pendingReserved: false,
      };
    case "UNKNOWN":
      return {
        enabled: false,
        requireConfirmation: true,
        warningVisible: false,
        warningText: null,
        reasonVisible: true,
        reasonText: "insufficient evidence",
        forbiddenAction: forbidden(surface),
        pendingReserved: false,
      };
    case "FACT":
      return {
        enabled: true,
        requireConfirmation: false,
        warningVisible: false,
        warningText: null,
        reasonVisible: false,
        reasonText: null,
        forbiddenAction: null,
        pendingReserved: false,
      };
    case "STALE": {
      const warning = staleWarning(surface.age);
      return {
        enabled: true,
        requireConfirmation: false,
        warningVisible: true,
        warningText: warning,
        reasonVisible: false,
        reasonText: null,
        forbiddenAction: null,
        pendingReserved: false,
      };
    }
    case "PENDING":
      return {
        enabled: false,
        requireConfirmation: false,
        warningVisible: false,
        warningText: null,
        reasonVisible: true,
        reasonText: "in verifica, slot riservato",
        forbiddenAction: forbidden(surface) ?? CONFIRM,
        pendingReserved: true,
      };
  }
}
