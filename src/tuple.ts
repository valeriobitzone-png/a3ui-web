// SPDX-License-Identifier: Apache-2.0
// Part of the A3 universe. See LICENSE.
/** SPEC_A3UI §2 Surface tuple. Placeholders apply only when a field is present and unknown. */
import { SurfaceReject } from "./reject.ts";

export const TUPLE_FIELDS = [
  "oggetto",
  "truth_class",
  "provenance",
  "age",
  "confidence",
  "actions_permitted",
  "actions_forbidden",
] as const;

export type TupleField = (typeof TUPLE_FIELDS)[number];

export const TRUTH_CLASSES = ["FACT", "OBSERVATION", "HYPOTHESIS", "UNKNOWN"] as const;
export type TruthClass = (typeof TRUTH_CLASSES)[number];

export const PROVENANCES = ["OBSERVED_SIGNED", "DERIVED_MODEL", "INFERRED", "HUMAN_ADMITTED"] as const;
export type Provenance = (typeof PROVENANCES)[number];

export const MARKS = ["UNKNOWN", "STALE", "HELD", "CONTRADICTED", "PENDING", "FACT"] as const;
export type Mark = (typeof MARKS)[number];

export const PLACEHOLDERS = {
  oggetto: "unknown-object",
  truth_class: "UNKNOWN",
  provenance: "INFERRED",
  age: "unknown-age",
  confidence: 0,
  actions_permitted: [] as const,
  actions_forbidden: ["unknown-action"] as const,
} as const;

export type SurfaceTuple = {
  oggetto: string;
  truth_class: TruthClass;
  provenance: Provenance;
  age: string;
  confidence: number;
  actions_permitted: readonly string[];
  actions_forbidden: readonly string[];
};

export type Surface = SurfaceTuple & {
  mark: Mark;
  id?: string;
  price?: string;
  slots?: readonly string[];
  reason?: string;
  warning?: string;
  pending_label?: string;
  spinner?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOwn(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function asStringList(field: TupleField, value: unknown): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new SurfaceReject("invalid-field", `${field} MUST be a list of action identifiers`);
  }
  return [...value];
}

function asTruthClass(value: unknown): TruthClass {
  if (typeof value !== "string" || !TRUTH_CLASSES.includes(value as TruthClass)) {
    throw new SurfaceReject("invalid-field", `truth_class MUST be one of ${TRUTH_CLASSES.join(", ")}`);
  }
  return value as TruthClass;
}

function asProvenance(value: unknown): Provenance {
  if (typeof value !== "string" || !PROVENANCES.includes(value as Provenance)) {
    throw new SurfaceReject("invalid-field", `provenance MUST be one of ${PROVENANCES.join(", ")}`);
  }
  return value as Provenance;
}

function asMark(value: unknown): Mark {
  if (typeof value !== "string" || !MARKS.includes(value as Mark)) {
    throw new SurfaceReject("invalid-field", `mark MUST be one of ${MARKS.join(", ")}`);
  }
  return value as Mark;
}

export function parseTuple(input: unknown): SurfaceTuple {
  if (!isRecord(input)) {
    throw new SurfaceReject("invalid-tuple", "surface MUST be an object");
  }

  for (const field of TUPLE_FIELDS) {
    if (!hasOwn(input, field) || input[field] === undefined) {
      throw new SurfaceReject("missing-field", `surface tuple field '${field}' is missing; refusing silent placeholder`);
    }
    if (input[field] === null) {
      throw new SurfaceReject("missing-field", `surface tuple field '${field}' is null; refusing silent placeholder`);
    }
  }

  const oggetto = input.oggetto;
  if (typeof oggetto !== "string" || oggetto.length === 0) {
    throw new SurfaceReject("invalid-field", "oggetto MUST be a non-empty string (use unknown-object when unknown)");
  }

  const age = input.age;
  if (typeof age !== "string" || age.length === 0) {
    throw new SurfaceReject("invalid-field", "age MUST be a declared duration or unknown-age");
  }

  const confidence = input.confidence;
  if (typeof confidence !== "number" || Number.isNaN(confidence) || confidence < 0 || confidence > 1) {
    throw new SurfaceReject("invalid-field", "confidence MUST be an A3-EP aggregate score in [0, 1]");
  }

  const actions_permitted = asStringList("actions_permitted", input.actions_permitted);
  const actions_forbidden = asStringList("actions_forbidden", input.actions_forbidden);
  const overlap = actions_permitted.filter((action) => actions_forbidden.includes(action));
  if (overlap.length > 0) {
    throw new SurfaceReject("invalid-field", `actions_permitted and actions_forbidden MUST be disjoint (overlap: ${overlap.join(", ")})`);
  }

  return {
    oggetto,
    truth_class: asTruthClass(input.truth_class),
    provenance: asProvenance(input.provenance),
    age,
    confidence,
    actions_permitted,
    actions_forbidden,
  };
}

export function parseSurface(input: unknown): Surface {
  const tuple = parseTuple(input);
  if (!isRecord(input) || !hasOwn(input, "mark") || input.mark === undefined || input.mark === null) {
    throw new SurfaceReject("missing-field", "renderer mark is missing; refusing silent FACT");
  }
  const mark = asMark(input.mark);
  const surface: Surface = { ...tuple, mark };
  if (typeof input.id === "string") surface.id = input.id;
  if (typeof input.price === "string") surface.price = input.price;
  if (Array.isArray(input.slots) && input.slots.every((slot) => typeof slot === "string")) {
    surface.slots = input.slots;
  }
  if (typeof input.reason === "string") surface.reason = input.reason;
  if (typeof input.warning === "string") surface.warning = input.warning;
  if (typeof input.pending_label === "string") surface.pending_label = input.pending_label;
  if (typeof input.spinner === "boolean") surface.spinner = input.spinner;
  return surface;
}
