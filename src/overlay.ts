// SPDX-License-Identifier: Apache-2.0
// Part of the A3 universe. See LICENSE.
/** SPEC_A3UI §5 Overlay lifecycle. COLLAPSED default. Pass-through outside the pill. */

export type OverlayPhase = "collapsed" | "expanded";

export type OverlayCause =
  | "tap-pill"
  | "intent"
  | "agent-event"
  | "choice-dispatch"
  | "dismiss"
  | "timeout"
  | "under-app-focus"
  | "terminal-action";

export const OVERLAY_IDLE_MS = 20_000;

const EXPAND: ReadonlySet<OverlayCause> = new Set(["tap-pill", "intent", "agent-event"]);
const COLLAPSE: ReadonlySet<OverlayCause> = new Set([
  "choice-dispatch",
  "dismiss",
  "timeout",
  "under-app-focus",
  "terminal-action",
]);

export function reduceOverlay(phase: OverlayPhase, cause: OverlayCause): OverlayPhase {
  if (EXPAND.has(cause)) return "expanded";
  if (COLLAPSE.has(cause)) return "collapsed";
  return phase;
}

export type OverlayClock = {
  now: () => number;
  schedule: (ms: number, fn: () => void) => () => void;
};

export const realClock: OverlayClock = {
  now: () => Date.now(),
  schedule: (ms, fn) => {
    const id = setTimeout(fn, ms);
    return () => clearTimeout(id);
  },
};

export class OverlaySession {
  phase: OverlayPhase = "collapsed";
  idleMs = OVERLAY_IDLE_MS;
  private cancelIdle: (() => void) | null = null;
  private readonly clock: OverlayClock;
  private readonly onChange: (phase: OverlayPhase, cause: OverlayCause) => void;

  constructor(clock: OverlayClock = realClock, onChange: (phase: OverlayPhase, cause: OverlayCause) => void = () => undefined) {
    this.clock = clock;
    this.onChange = onChange;
  }

  apply(cause: OverlayCause): OverlayPhase {
    const next = reduceOverlay(this.phase, cause);
    if (next === this.phase && !(EXPAND.has(cause) && this.phase === "expanded")) {
      if (EXPAND.has(cause) && this.phase === "expanded") this.armIdle();
      return this.phase;
    }
    this.phase = next;
    if (next === "expanded") this.armIdle();
    else this.disarmIdle();
    this.onChange(next, cause);
    return next;
  }

  noteInteraction(): void {
    if (this.phase === "expanded") this.armIdle();
  }

  dispose(): void {
    this.disarmIdle();
  }

  private armIdle(): void {
    this.disarmIdle();
    this.cancelIdle = this.clock.schedule(this.idleMs, () => {
      this.apply("timeout");
    });
  }

  private disarmIdle(): void {
    this.cancelIdle?.();
    this.cancelIdle = null;
  }
}
