import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const siblingA3 = resolve(dirname(fileURLToPath(import.meta.url)), "../../a3");
const a3 = process.env.A3_REPO ?? siblingA3;
const frozenPaths = [
  "core/",
  "broker/",
  "agent/",
  "renderers/",
  "launcher/",
  "overlay/",
  "adapters/",
  "conformance/",
  "a3ui-web/",
  "spec/",
];

describe("W-014 freeze", () => {
  it("does not modify the frozen paths in repo a3", () => {
    if (!existsSync(join(a3, ".git"))) return;
    const pathspec = ["--", ...frozenPaths];
    const porcelain = execFileSync("git", ["-C", a3, "status", "--porcelain", ...pathspec], { encoding: "utf8" });
    const diff = execFileSync("git", ["-C", a3, "diff", "--name-only", ...pathspec], { encoding: "utf8" });
    const cachedDiff = execFileSync("git", ["-C", a3, "diff", "--cached", "--name-only", ...pathspec], { encoding: "utf8" });
    expect(porcelain).toBe("");
    expect(diff).toBe("");
    expect(cachedDiff).toBe("");
  });
});
