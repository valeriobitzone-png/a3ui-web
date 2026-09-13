import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SurfaceReject } from "../src/reject.ts";
import { parseSurface, parseTuple, TUPLE_FIELDS } from "../src/tuple.ts";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "../fixtures");

function load(name: string): unknown {
  return JSON.parse(readFileSync(join(fixtures, name), "utf8")) as unknown;
}

const complete = {
  oggetto: "X",
  truth_class: "FACT",
  provenance: "OBSERVED_SIGNED",
  age: "ora",
  confidence: 1,
  actions_permitted: ["confirm"],
  actions_forbidden: [] as string[],
};

describe("W-013 surface tuple", () => {
  it("accepts the four a3ui fixtures", () => {
    expect(parseSurface(load("hotel-stale.json")).mark).toBe("STALE");
    expect(parseSurface(load("calendar-contradicted.json")).mark).toBe("CONTRADICTED");
    expect(parseSurface(load("train-pending.json")).mark).toBe("PENDING");
    expect(parseSurface(load("flight-fact.json")).mark).toBe("FACT");
  });

  it.each([...TUPLE_FIELDS])("rejects missing %s instead of filling a placeholder", (field) => {
    const copy = { ...complete, mark: "FACT" } as Record<string, unknown>;
    delete copy[field];
    expect(() => parseTuple(copy)).toThrow(SurfaceReject);
    expect(() => parseTuple(copy)).toThrow(/missing-field/);
    expect(() => parseTuple(copy)).toThrow(field);
  });

  it("rejects null fields", () => {
    expect(() => parseTuple({ ...complete, age: null })).toThrow(/missing-field/);
  });

  it("rejects overlapping action lists", () => {
    expect(() =>
      parseTuple({ ...complete, actions_permitted: ["confirm"], actions_forbidden: ["confirm"] }),
    ).toThrow(/disjoint/);
  });

  it("rejects invalid truth_class", () => {
    expect(() => parseTuple({ ...complete, truth_class: "BELIEVED" })).toThrow(/truth_class/);
  });

  it("accepts declared placeholders when the field is present", () => {
    const tuple = parseTuple({
      oggetto: "unknown-object",
      truth_class: "UNKNOWN",
      provenance: "INFERRED",
      age: "unknown-age",
      confidence: 0,
      actions_permitted: [],
      actions_forbidden: ["unknown-action"],
    });
    expect(tuple.oggetto).toBe("unknown-object");
  });
});
