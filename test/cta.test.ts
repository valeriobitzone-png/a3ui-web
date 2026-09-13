import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ctaFor, staleWarning, visibleAge } from "../src/marks.ts";
import { parseSurface } from "../src/tuple.ts";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "../fixtures");

function surface(name: string) {
  return parseSurface(JSON.parse(readFileSync(join(fixtures, name), "utf8")) as unknown);
}

describe("mark → CTA law", () => {
  it("W-001 CONTRADICTED disables CTA and shows the forbid reason", () => {
    const cta = ctaFor(surface("calendar-contradicted.json"));
    expect(cta.enabled).toBe(false);
    expect(cta.reasonVisible).toBe(true);
    expect(cta.reasonText).toBe("contradicted: resolve conflict first");
  });

  it("W-002 STALE may enable CTA and must warn stale 2 ore", () => {
    const stale = surface("hotel-stale.json");
    const cta = ctaFor(stale);
    expect(cta.enabled).toBe(true);
    expect(cta.warningVisible).toBe(true);
    expect(cta.warningText).toBe("stale 2 ore");
    expect(staleWarning(stale.age)).toBe("stale 2 ore");
    expect(visibleAge(stale.age)).toBe("2h fa");
  });

  it("W-003 PENDING does not confirm as done and keeps the reserved slot", () => {
    const cta = ctaFor(surface("train-pending.json"));
    expect(cta.enabled).toBe(false);
    expect(cta.pendingReserved).toBe(true);
    expect(cta.reasonText).toContain("in verifica");
  });

  it("W-004 FACT enables CTA", () => {
    expect(ctaFor(surface("flight-fact.json")).enabled).toBe(true);
  });

  it("HELD disables or requires confirmation", () => {
    const cta = ctaFor({
      oggetto: "Documento",
      truth_class: "HYPOTHESIS",
      provenance: "HUMAN_ADMITTED",
      age: "ora",
      confidence: 0.2,
      actions_permitted: [],
      actions_forbidden: ["confirm"],
      mark: "HELD",
    });
    expect(cta.enabled === false || cta.requireConfirmation).toBe(true);
    expect(cta.enabled).toBe(false);
  });

  it("UNKNOWN limits CTA or requires confirmation", () => {
    const cta = ctaFor({
      oggetto: "Sorgente",
      truth_class: "UNKNOWN",
      provenance: "INFERRED",
      age: "unknown-age",
      confidence: 0,
      actions_permitted: [],
      actions_forbidden: ["unknown-action"],
      mark: "UNKNOWN",
    });
    expect(cta.enabled === false || cta.requireConfirmation).toBe(true);
  });
});
