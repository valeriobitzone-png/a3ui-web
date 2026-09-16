// SPDX-License-Identifier: Apache-2.0
// Part of the A3 universe. See LICENSE.
import { OverlaySession, reduceOverlay } from "../src/overlay.ts";

describe("overlay lifecycle", () => {
  it("W-008 starts COLLAPSED, expands on tap, collapses after dispatch", () => {
    expect(reduceOverlay("collapsed", "tap-pill")).toBe("expanded");
    expect(reduceOverlay("expanded", "choice-dispatch")).toBe("collapsed");
    const session = new OverlaySession();
    expect(session.phase).toBe("collapsed");
    session.apply("tap-pill");
    expect(session.phase).toBe("expanded");
    session.apply("choice-dispatch");
    expect(session.phase).toBe("collapsed");
  });

  it("collapses on dismiss, timeout, under-app focus, and terminal action", () => {
    expect(reduceOverlay("expanded", "dismiss")).toBe("collapsed");
    expect(reduceOverlay("expanded", "timeout")).toBe("collapsed");
    expect(reduceOverlay("expanded", "under-app-focus")).toBe("collapsed");
    expect(reduceOverlay("expanded", "terminal-action")).toBe("collapsed");
  });

  it("expands only on pill, intent, or agent event", () => {
    expect(reduceOverlay("collapsed", "intent")).toBe("expanded");
    expect(reduceOverlay("collapsed", "agent-event")).toBe("expanded");
    expect(reduceOverlay("collapsed", "dismiss")).toBe("collapsed");
  });

  it("idle timer collapses after 20s without interaction", () => {
    const timers: Array<() => void> = [];
    const clock = {
      now: () => 0,
      schedule: (_ms: number, fn: () => void) => {
        timers.push(fn);
        return () => undefined;
      },
    };
    const session = new OverlaySession(clock);
    session.idleMs = 20_000;
    session.apply("tap-pill");
    expect(session.phase).toBe("expanded");
    expect(timers).toHaveLength(1);
    timers[0]?.();
    expect(session.phase).toBe("collapsed");
  });
});
