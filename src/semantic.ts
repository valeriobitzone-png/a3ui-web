// SPDX-License-Identifier: Apache-2.0
// Part of the A3 universe. See LICENSE.
/** Semantic observation for W-012. Same marks, CTA state, reason — not pixels. */
import { ctaFor } from "./marks.ts";
import { stateDescription } from "./speech.ts";
import type { Surface } from "./tuple.ts";

export type SemanticShot = {
  mark: string;
  ctaEnabled: boolean;
  reasonVisible: boolean;
  reason: string | null;
  warningVisible: boolean;
  warning: string | null;
  pendingReserved: boolean;
  spinner: boolean;
  ariaLabel: string;
};

export function expectedSemantic(surface: Surface): SemanticShot {
  const cta = ctaFor(surface);
  return {
    mark: surface.mark,
    ctaEnabled: cta.enabled,
    reasonVisible: cta.reasonVisible,
    reason: cta.reasonText,
    warningVisible: cta.warningVisible,
    warning: cta.warningText,
    pendingReserved: cta.pendingReserved,
    spinner: false,
    ariaLabel: stateDescription(surface),
  };
}
