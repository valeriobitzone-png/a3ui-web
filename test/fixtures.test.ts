import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const names = ["hotel-stale.json", "calendar-contradicted.json", "train-pending.json", "flight-fact.json"];

function sha(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

describe("fixtures are the a3ui conformance bytes", () => {
  it("keeps the four JSON files byte-identical to :a3ui:conformance when a3 is present", () => {
    const a3 = process.env.A3_REPO ?? resolve(here, "../../a3");
    const source = join(a3, "conformance/a3ui/fixtures");
    if (!existsSync(source)) return;
    for (const name of names) {
      expect(sha(join(here, "../fixtures", name)), name).toBe(sha(join(source, name)));
    }
  });
});
