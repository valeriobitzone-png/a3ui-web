import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { stateDescription } from "../src/speech.ts";
import { parseSurface } from "../src/tuple.ts";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "../fixtures");

function surface(name: string) {
  return parseSurface(JSON.parse(readFileSync(join(fixtures, name), "utf8")) as unknown);
}

describe("stateDescription", () => {
  it("W-001 CONTRADICTED aria-label names type, disabled confirm, and reason", () => {
    expect(stateDescription(surface("calendar-contradicted.json"))).toBe(
      "Calendario, contradicted, conferma disabilitata, ragione: contradicted resolve conflict first",
    );
  });

  it("W-002 STALE aria-label is complete with stale 2 ore", () => {
    expect(stateDescription(surface("hotel-stale.json"))).toBe(
      "Hotel, stale 2 ore, prezzo 89 euro, conferma abilitata, warning: stale 2 ore",
    );
  });

  it("W-003 PENDING aria-label keeps in verifica, slot riservato", () => {
    expect(stateDescription(surface("train-pending.json"))).toBe(
      "Treno, in verifica, slot riservato, conferma disabilitata, ragione: in verifica, slot riservato",
    );
  });

  it("W-004 FACT aria-label is the enabled baseline", () => {
    expect(stateDescription(surface("flight-fact.json"))).toBe("Volo, conferma abilitata");
  });
});
