// SPDX-License-Identifier: Apache-2.0
// Part of the A3 universe. See LICENSE.
import { A3uiOverlay } from "./a3ui-overlay.ts";
import { A3uiSurface } from "./a3ui-surface.ts";
import { boot } from "./a3ui-host.ts";

export { A3uiOverlay, A3uiSurface, boot };
export { parseSurface, parseTuple, TUPLE_FIELDS } from "./tuple.ts";
export { SurfaceReject } from "./reject.ts";
export { ctaFor, staleWarning, visibleAge } from "./marks.ts";
export { stateDescription } from "./speech.ts";
export { reduceOverlay, OverlaySession, OVERLAY_IDLE_MS } from "./overlay.ts";
export { expectedSemantic } from "./semantic.ts";
export {
  ExtensionValidator,
  FormRegistry,
  SurfaceBinding,
  SurfaceExtensions,
  SurfaceLifecycle,
  SurfaceMemory,
  SurfaceQueue,
  WebRendererStub,
} from "./b5-semantics.ts";

export function register(): void {
  if (!customElements.get("a3ui-surface")) customElements.define("a3ui-surface", A3uiSurface);
  if (!customElements.get("a3ui-overlay")) customElements.define("a3ui-overlay", A3uiOverlay);
}

register();

const mount = document.querySelector("[data-a3ui-boot]");
if (mount instanceof HTMLElement) boot(mount);
