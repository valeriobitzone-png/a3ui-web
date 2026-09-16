import { execFileSync } from "node:child_process";
import { SurfaceReject } from "../src/reject.ts";
import {
  FormRegistry,
  SurfaceBinding,
  SurfaceExtensions,
  SurfaceLifecycle,
  SurfaceMemory,
  SurfaceQueue,
  WebRendererStub,
} from "../src/b5-semantics.ts";

function ref(key: string) {
  return { key, source: "web-test-source", lineage: `web-test-lineage-${key}` };
}

describe("B5b lifecycle, re-binding, and opaque extension conformance", () => {
  it("W-015 queues pre-mount surface and mounts it when the container arrives", () => {
    const queue = new SurfaceQueue();
    const surface = SurfaceLifecycle.proposed("w-015");
    queue.enqueue("container-015", surface);
    expect(surface.state).toBe("PROPOSED");
    expect(queue.mount("container-015")).toEqual([surface]);
    expect(surface.state).toBe("MOUNTED");
  });

  it("W-016 rejects producer dismissal explicitly", () => {
    const surface = SurfaceLifecycle.proposed("w-016");
    expect(() => surface.producerDismiss()).toThrow(SurfaceReject);
    expect(() => surface.producerDismiss()).toThrow(/MUST NOT dismiss/);
  });

  it("W-017 removes a dismissed surface from the registry", () => {
    const memory = new SurfaceMemory();
    const surface = memory.register(SurfaceLifecycle.proposed("w-017"));
    surface.mount().activate();
    memory.dismiss(surface.id);
    expect(memory.get("w-017")).toBeUndefined();
    expect(memory.size).toBe(0);
  });

  it("W-018 keeps generation count at one for N value updates", () => {
    const registry = new FormRegistry();
    const binding = SurfaceBinding.proposed(SurfaceLifecycle.proposed("w-018"), "card", ref("initial"), registry);
    for (let i = 0; i < 20; i += 1) binding.rebind(ref(`value-${i}`));
    expect(registry.generationCount).toBe(1);
    expect(binding.dataRef.key).toBe("value-19");
  });

  it("W-019 keeps surfaceId stable through N rebinds", () => {
    const registry = new FormRegistry();
    const binding = SurfaceBinding.proposed(SurfaceLifecycle.proposed("stable-w-019"), "card", ref("initial"), registry);
    for (let i = 0; i < 20; i += 1) binding.rebind(ref(`value-${i}`));
    expect(binding.surfaceId).toBe("stable-w-019");
    expect(binding.surface.id).toBe("stable-w-019");
  });

  it("W-020 regenerates on formKey change and exposes generation two", () => {
    const registry = new FormRegistry();
    const binding = SurfaceBinding.proposed(SurfaceLifecycle.proposed("w-020"), "card", ref("initial"), registry);
    binding.regenerate("list");
    expect(registry.generationCount).toBe(2);
    expect(binding.form.formKey).toBe("list");
    expect(binding.form.generation).toBe(2);
  });

  it("W-021 transports x-mono-gate opaquely", () => {
    const payload = { status: "pending" };
    const extensions = SurfaceExtensions.of({ "x-mono-gate": payload });
    expect(extensions.entries.get("x-mono-gate")).toBe(payload);
  });

  it("W-022 rejects an extension key without x- explicitly", () => {
    expect(() => SurfaceExtensions.of({ gate: { status: "pending" } })).toThrow(SurfaceReject);
    expect(() => SurfaceExtensions.of({ gate: { status: "pending" } })).toThrow(/MUST start with x-/);
  });

  it("W-023 ignores an unknown extension while drawing the surface", () => {
    const extensions = SurfaceExtensions.of({ "x-mono-gate": { status: "pending" } });
    const rendered = new WebRendererStub().render("w-023", extensions);
    expect(rendered.drawn).toBe(true);
    expect(rendered.ignoredExtensions).toEqual(new Set(["x-mono-gate"]));
  });

  it("W-024 keeps a surface valid without extensions", () => {
    const rendered = new WebRendererStub().render("w-024");
    expect(rendered.drawn).toBe(true);
    expect(rendered.ignoredExtensions.size).toBe(0);
    expect(SurfaceExtensions.empty().entries.size).toBe(0);
  });

  it("W-025 leaves fixtures and frozen inputs unchanged", () => {
    const frozenPaths = ["fixtures/", "spec/"];
    const pathspec = ["--", ...frozenPaths];
    const porcelain = execFileSync("git", ["status", "--porcelain", ...pathspec], { encoding: "utf8" });
    const diff = execFileSync("git", ["diff", "--name-only", ...pathspec], { encoding: "utf8" });
    const cachedDiff = execFileSync("git", ["diff", "--cached", "--name-only", ...pathspec], { encoding: "utf8" });
    expect(porcelain).toBe("");
    expect(diff).toBe("");
    expect(cachedDiff).toBe("");
  });
});
