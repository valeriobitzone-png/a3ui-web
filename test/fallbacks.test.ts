// SPDX-License-Identifier: Apache-2.0
// Part of the A3 universe. See LICENSE.
import { blurFallback, frostAllowed, openGraphFallback, permissionFallback } from "../src/fallbacks.ts";

describe("declared fallbacks", () => {
  it("W-007 blur-off shows blur unavailable and forbids fake frost", () => {
    const fallback = blurFallback("blur-off", true);
    expect(fallback.visible).toBe(true);
    expect(fallback.message).toBe("blur unavailable");
    expect(frostAllowed("blur-off", true)).toBe(false);
  });

  it("unsupported backdrop-filter shows blur unavailable", () => {
    expect(blurFallback("high-end", false).visible).toBe(true);
    expect(frostAllowed("high-end", false)).toBe(false);
  });

  it("permission denied is an honest overlay denial", () => {
    const denied = permissionFallback(false);
    expect(denied.visible).toBe(true);
    expect(denied.message).toMatch(/overlay disabled/);
  });

  it("OpenGraph blocked keeps a minimal honest preview", () => {
    const blocked = openGraphFallback(true);
    expect(blocked.visible).toBe(true);
    expect(blocked.message).toMatch(/OpenGraph blocked/);
  });
});
