// SPDX-License-Identifier: Apache-2.0
// Part of the A3 universe. See LICENSE.
/** Page host. Skip link lives in light DOM (first focus). Marks are web components. */
import { HOST_CSS } from "./css.ts";
import {
  BLUR_UNAVAILABLE,
  OPENGRAPH_BLOCKED,
  PERMISSION_DENIED,
  HAPTIC_LIMITED,
  blurFallback,
  frostAllowed,
  hapticFallback,
  openGraphFallback,
  permissionFallback,
  supportsBackdropFilter,
  type Profile,
} from "./fallbacks.ts";
import type { Surface } from "./tuple.ts";
import { parseSurface } from "./tuple.ts";

import calendarJson from "../fixtures/calendar-contradicted.json" with { type: "json" };
import flightJson from "../fixtures/flight-fact.json" with { type: "json" };
import hotelJson from "../fixtures/hotel-stale.json" with { type: "json" };
import trainJson from "../fixtures/train-pending.json" with { type: "json" };

const FIXTURES = {
  "calendar-contradicted": calendarJson,
  "hotel-stale": hotelJson,
  "train-pending": trainJson,
  "flight-fact": flightJson,
} as const;

export type FixtureId = keyof typeof FIXTURES;

const DEMO_UNKNOWN: Surface = {
  oggetto: "Sorgente",
  truth_class: "UNKNOWN",
  provenance: "INFERRED",
  age: "unknown-age",
  confidence: 0,
  actions_permitted: [],
  actions_forbidden: ["unknown-action"],
  mark: "UNKNOWN",
};

const DEMO_HELD: Surface = {
  oggetto: "Documento",
  truth_class: "HYPOTHESIS",
  provenance: "HUMAN_ADMITTED",
  age: "ora",
  confidence: 0.2,
  actions_permitted: [],
  actions_forbidden: ["confirm"],
  mark: "HELD",
};

export function fixtureSurface(id: FixtureId): Surface {
  return parseSurface(FIXTURES[id]);
}

function params(): URLSearchParams {
  return new URLSearchParams(location.search);
}

function profileOf(search: URLSearchParams): Profile {
  const raw = search.get("profile") ?? "high-end";
  if (raw === "mid" || raw === "blur-off" || raw === "particles-off" || raw === "high-end") return raw;
  return "high-end";
}

function mountSurface(parent: ParentNode, surface: Surface, chrome: string | null): HTMLElement {
  const el = document.createElement("a3ui-surface");
  if (chrome) el.setAttribute("chrome", chrome);
  el.surface = surface;
  parent.append(el);
  return el;
}

export function boot(root: HTMLElement = document.body): void {
  const search = params();
  const view = search.get("view") ?? "gallery";
  const profile = profileOf(search);
  const permissionGranted = search.get("permission") !== "denied";
  const ogBlocked = search.get("og") === "blocked";
  const supportedBlur = supportsBackdropFilter();
  const blur = blurFallback(profile, supportedBlur);
  console.info(HAPTIC_LIMITED);
  const haptic = hapticFallback(search.get("haptic") !== "limited");
  const permission = permissionFallback(permissionGranted);
  const og = openGraphFallback(ogBlocked);
  const chrome = blur.visible ? "blur-off" : null;
  const frost = frostAllowed(profile, supportedBlur);

  if (!root.querySelector("style[data-a3ui-host]")) {
    const style = document.createElement("style");
    style.dataset.a3uiHost = "true";
    style.textContent = HOST_CSS.replaceAll(":host", "body");
    document.head.append(style);
  }

  const fallbacks = document.createElement("div");
  fallbacks.className = "fallbacks";
  fallbacks.innerHTML = `
    <p class="fallback" data-fallback="blur" hidden></p>
    <p class="fallback" data-fallback="haptic" hidden></p>
    <p class="fallback" data-fallback="permission" hidden></p>
    <p class="fallback" data-fallback="opengraph" hidden></p>
  `;
  const setFallback = (kind: string, visible: boolean, message: string) => {
    const node = fallbacks.querySelector(`[data-fallback="${kind}"]`);
    if (!(node instanceof HTMLElement)) return;
    node.hidden = !visible;
    node.textContent = message;
  };
  setFallback("blur", blur.visible, BLUR_UNAVAILABLE);
  setFallback("haptic", haptic.visible, HAPTIC_LIMITED);
  setFallback("permission", permission.visible, PERMISSION_DENIED);
  setFallback("opengraph", og.visible, OPENGRAPH_BLOCKED);

  const under = document.createElement("section");
  under.className = "under-app";
  under.dataset.underApp = "true";
  under.innerHTML = `
    <h1>App sotto</h1>
    <p>Hit-test target when the overlay is COLLAPSED.</p>
    <button type="button" id="under-app-cta">Apri messaggio</button>
    <output id="under-hits">0</output>
  `;
  const underCta = under.querySelector("#under-app-cta");
  const underHits = under.querySelector("#under-hits");
  if (underCta instanceof HTMLButtonElement && underHits instanceof HTMLElement) {
    underCta.addEventListener("click", () => {
      underHits.textContent = String(Number(underHits.textContent ?? "0") + 1);
    });
  }

  const marks = document.createElement("section");
  marks.id = "a3ui-marks";
  marks.className = "marks";
  if (frost) marks.classList.add("frost", "live");
  else if (blur.visible) marks.classList.add("frost");

  root.replaceChildren(fallbacks);

  if (permission.visible) {
    root.append(under, marks);
    return;
  }

  if (view === "overlay") {
    const fixtureId = (search.get("fixture") as FixtureId | null) ?? "flight-fact";
    const surface = fixtureSurface(fixtureId);
    const marks = document.createElement("section");
    marks.id = "a3ui-marks";
    const overlay = document.createElement("a3ui-overlay");
    overlay.setAttribute("mark", surface.mark.toLowerCase());
    const panel = document.createElement("a3ui-surface");
    if (chrome) panel.setAttribute("chrome", chrome);
    panel.surface = surface;
    overlay.append(panel);
    root.append(under, marks, overlay);
    return;
  }

  root.append(under, marks);

  if (view === "reject") {
    const el = document.createElement("a3ui-surface");
    el.applyJson({ oggetto: "broken" });
    marks.append(el);
    return;
  }

  if (view === "surface") {
    const fixtureId = (search.get("fixture") as FixtureId | null) ?? "flight-fact";
    mountSurface(marks, fixtureSurface(fixtureId), chrome);
    return;
  }

  if (view === "marks") {
    mountSurface(marks, DEMO_UNKNOWN, chrome);
    mountSurface(marks, fixtureSurface("hotel-stale"), chrome);
    mountSurface(marks, DEMO_HELD, chrome);
    mountSurface(marks, fixtureSurface("calendar-contradicted"), chrome);
    mountSurface(marks, fixtureSurface("train-pending"), chrome);
    mountSurface(marks, fixtureSurface("flight-fact"), chrome);
    return;
  }

  mountSurface(marks, fixtureSurface("calendar-contradicted"), chrome);
  mountSurface(marks, fixtureSurface("hotel-stale"), chrome);
  mountSurface(marks, fixtureSurface("train-pending"), chrome);
  mountSurface(marks, fixtureSurface("flight-fact"), chrome);
}
