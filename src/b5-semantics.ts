// SPDX-License-Identifier: Apache-2.0
// Part of the A3 universe. See LICENSE.
import { SurfaceReject } from "./reject.ts";

export type SurfaceState = "PROPOSED" | "MOUNTED" | "ALIVE" | "FROZEN" | "DISMISSED";

export type SurfaceSnapshot = {
  preserved: Readonly<Record<string, unknown>>;
  discarded: ReadonlySet<string>;
};

export type SurfaceRestoration = {
  restored: Readonly<Record<string, unknown>>;
  discarded: ReadonlySet<string>;
};

export class SurfaceLifecycle {
  readonly id: string;
  #state: SurfaceState = "PROPOSED";
  #snapshot: SurfaceSnapshot | null = null;
  #restoration: SurfaceRestoration | null = null;

  private constructor(id: string) {
    if (!id.trim()) throw new SurfaceReject("invalid-surface", "surfaceId is required");
    this.id = id;
  }

  static proposed(id: string): SurfaceLifecycle {
    return new SurfaceLifecycle(id);
  }

  static proposedByShell(id: string): never {
    throw new SurfaceReject("illegal-transition", `shell MUST NOT create PROPOSED surface '${id}'`);
  }

  get state(): SurfaceState {
    return this.#state;
  }

  get snapshot(): SurfaceSnapshot | null {
    return this.#snapshot;
  }

  get restoration(): SurfaceRestoration | null {
    return this.#restoration;
  }

  producerDismiss(): never {
    throw new SurfaceReject("illegal-transition", `producer MUST NOT dismiss surface '${this.id}'`);
  }

  mount(): this {
    this.transition("PROPOSED", "MOUNTED");
    return this;
  }

  activate(): this {
    this.transition("MOUNTED", "ALIVE");
    return this;
  }

  freeze(snapshot: SurfaceSnapshot): this {
    this.transition("ALIVE", "FROZEN");
    this.#snapshot = snapshot;
    this.#restoration = null;
    return this;
  }

  revive(): SurfaceRestoration {
    this.transition("FROZEN", "ALIVE");
    if (!this.#snapshot) throw new SurfaceReject("illegal-transition", `frozen surface '${this.id}' lacks declaration`);
    this.#restoration = {
      restored: { ...this.#snapshot.preserved },
      discarded: new Set(this.#snapshot.discarded),
    };
    return this.#restoration;
  }

  dismiss(): this {
    if (this.#state !== "MOUNTED" && this.#state !== "ALIVE" && this.#state !== "FROZEN") {
      this.reject("MOUNTED, ALIVE, or FROZEN", "DISMISSED");
    }
    this.#state = "DISMISSED";
    this.#snapshot = null;
    this.#restoration = null;
    return this;
  }

  private transition(from: SurfaceState, to: SurfaceState): void {
    if (this.#state !== from) this.reject(from, to);
    this.#state = to;
  }

  private reject(expected: string, next: SurfaceState): never {
    throw new SurfaceReject("illegal-transition", `surface '${this.id}': ${this.#state} -> ${next}; expected ${expected}`);
  }
}

export class SurfaceQueue {
  #pending = new Map<string, Map<string, SurfaceLifecycle>>();

  enqueue(containerId: string, surface: SurfaceLifecycle): void {
    if (surface.state !== "PROPOSED") {
      throw new SurfaceReject("illegal-transition", `only PROPOSED surfaces can be queued: ${surface.id}`);
    }
    const container = this.#pending.get(containerId) ?? new Map<string, SurfaceLifecycle>();
    container.set(surface.id, surface);
    this.#pending.set(containerId, container);
  }

  mount(containerId: string): SurfaceLifecycle[] {
    const waiting = [...(this.#pending.get(containerId)?.values() ?? [])];
    this.#pending.delete(containerId);
    waiting.forEach((surface) => surface.mount());
    return waiting;
  }

  pendingCount(containerId: string): number {
    return this.#pending.get(containerId)?.size ?? 0;
  }
}

export class SurfaceMemory {
  #registry = new Map<string, SurfaceLifecycle>();

  register(surface: SurfaceLifecycle): SurfaceLifecycle {
    if (surface.state === "DISMISSED") throw new SurfaceReject("illegal-transition", "dismissed surface cannot be registered");
    if (this.#registry.has(surface.id)) throw new SurfaceReject("duplicate-surface", surface.id);
    this.#registry.set(surface.id, surface);
    return surface;
  }

  dismiss(id: string): void {
    const surface = this.#registry.get(id);
    if (!surface) return;
    surface.dismiss();
    this.#registry.delete(id);
  }

  get(id: string): SurfaceLifecycle | undefined {
    return this.#registry.get(id);
  }

  get size(): number {
    return this.#registry.size;
  }
}

export type DataRef = {
  readonly key: string;
  readonly source: string;
  readonly lineage: string;
};

export type Form = {
  readonly formKey: string;
  readonly schemaKey: string;
  readonly generation: number;
};

export class FormRegistry {
  #forms = new Map<string, Form>();
  #generationCount = 0;

  get generationCount(): number {
    return this.#generationCount;
  }

  getOrCreate(formKey: string, schemaKey = formKey): Form {
    const current = this.#forms.get(formKey);
    if (current && current.schemaKey === schemaKey) return current;
    const form = { formKey, schemaKey, generation: ++this.#generationCount };
    this.#forms.set(formKey, form);
    return form;
  }
}

export class SurfaceBinding {
  readonly surface: SurfaceLifecycle;
  readonly registry: FormRegistry;
  readonly surfaceId: string;
  #form: Form;
  #dataRef: DataRef;
  #pending: DataRef | null = null;

  private constructor(surface: SurfaceLifecycle, registry: FormRegistry, form: Form, dataRef: DataRef) {
    this.surface = surface;
    this.registry = registry;
    this.#form = form;
    this.#dataRef = dataRef;
    this.surfaceId = surface.id;
  }

  static proposed(surface: SurfaceLifecycle, formKey: string, dataRef: DataRef, registry: FormRegistry): SurfaceBinding {
    if (surface.state !== "PROPOSED") throw new SurfaceReject("illegal-transition", "binding starts at PROPOSED");
    return new SurfaceBinding(surface, registry, registry.getOrCreate(formKey), dataRef);
  }

  get form(): Form {
    return this.#form;
  }

  get dataRef(): DataRef {
    return this.#dataRef;
  }

  get hasPendingRestore(): boolean {
    return this.#pending !== null;
  }

  rebind(dataRef: DataRef): this {
    this.rejectDismissed();
    if (this.surface.state === "FROZEN") this.#pending = dataRef;
    else this.#dataRef = dataRef;
    return this;
  }

  regenerate(formKey: string, schemaKey = formKey): this {
    this.rejectDismissed();
    this.#form = this.registry.getOrCreate(formKey, schemaKey);
    return this;
  }

  restore(): DataRef {
    if (this.surface.state !== "FROZEN") throw new SurfaceReject("illegal-transition", "binding restore requires FROZEN");
    this.surface.revive();
    if (this.#pending) {
      this.#dataRef = this.#pending;
      this.#pending = null;
    }
    return this.#dataRef;
  }

  private rejectDismissed(): void {
    if (this.surface.state === "DISMISSED") throw new SurfaceReject("illegal-transition", "cannot rebind DISMISSED surface");
  }
}

export class ExtensionValidator {
  static validateKey(key: string): void {
    if (!key.startsWith("x-") || key.length <= 2) {
      throw new SurfaceReject("invalid-extension-key", `extension key '${key}' MUST start with x-`);
    }
  }
}

export class SurfaceExtensions {
  readonly entries: ReadonlyMap<string, unknown>;

  private constructor(entries: ReadonlyMap<string, unknown>) {
    this.entries = entries;
  }

  static of(entries: Record<string, unknown>): SurfaceExtensions {
    for (const key of Object.keys(entries)) ExtensionValidator.validateKey(key);
    return new SurfaceExtensions(new Map(Object.entries(entries)));
  }

  static empty(): SurfaceExtensions {
    return new SurfaceExtensions(new Map());
  }
}

export type WebRenderResult = {
  readonly surfaceId: string;
  readonly drawn: true;
  readonly ignoredExtensions: ReadonlySet<string>;
};

export class WebRendererStub {
  readonly recognized: ReadonlySet<string>;

  constructor(recognized: ReadonlySet<string> = new Set()) {
    recognized.forEach(ExtensionValidator.validateKey);
    this.recognized = new Set(recognized);
  }

  render(surfaceId: string, extensions = SurfaceExtensions.empty()): WebRenderResult {
    return {
      surfaceId,
      drawn: true,
      ignoredExtensions: new Set([...extensions.entries.keys()].filter((key) => !this.recognized.has(key))),
    };
  }
}
