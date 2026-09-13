import { expect, test, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expectedSemantic } from "../../src/semantic.ts";
import { parseSurface } from "../../src/tuple.ts";
import calendar from "../../fixtures/calendar-contradicted.json" with { type: "json" };
import flight from "../../fixtures/flight-fact.json" with { type: "json" };
import hotel from "../../fixtures/hotel-stale.json" with { type: "json" };
import train from "../../fixtures/train-pending.json" with { type: "json" };

const assets = join(dirname(fileURLToPath(import.meta.url)), "../../review-assets/web");
mkdirSync(assets, { recursive: true });

type Observed = {
  mark: string | null;
  ariaLabel: string | null;
  ctaEnabled: boolean;
  ctaLabel: string | null;
  reasonVisible: boolean;
  reason: string | null;
  warningVisible: boolean;
  warning: string | null;
  pendingReserved: boolean;
  spinnerDisplay: string | null;
  badge: string | null;
  age: string | null;
  ctaWidth: number;
  ctaHeight: number;
};

async function observe(page: Page, mark: string): Promise<Observed> {
  const surface = page.locator(`a3ui-surface[mark="${mark}"]`).first();
  await surface.waitFor();
  return surface.evaluate((el) => {
    const root = el.shadowRoot;
    if (!root) throw new Error("open shadow root required");
    const cta = root.querySelector(".cta");
    const reason = root.querySelector(".reason");
    const warning = root.querySelector(".warning");
    const reserved = root.querySelector(".reserved");
    const spinner = root.querySelector(".spinner");
    const badge = root.querySelector(".badge");
    const age = root.querySelector(".age");
    if (!(cta instanceof HTMLButtonElement)) throw new Error("cta");
    const ctaBox = cta.getBoundingClientRect();
    const hidden = (node: Element | null) => node instanceof HTMLElement && node.hidden;
    return {
      mark: el.getAttribute("mark"),
      ariaLabel: el.getAttribute("aria-label"),
      ctaEnabled: !cta.disabled,
      ctaLabel: cta.getAttribute("aria-label"),
      reasonVisible: !hidden(reason),
      reason: hidden(reason) ? null : reason?.textContent ?? null,
      warningVisible: !hidden(warning),
      warning: hidden(warning) ? null : warning?.textContent ?? null,
      pendingReserved: !hidden(reserved),
      spinnerDisplay: spinner ? getComputedStyle(spinner).display : "none",
      badge: hidden(badge) ? null : badge?.textContent ?? null,
      age: hidden(age) ? null : age?.textContent ?? null,
      ctaWidth: ctaBox.width,
      ctaHeight: ctaBox.height,
    };
  });
}

async function evidence(page: Page, id: string, mark?: string): Promise<Observed | null> {
  await page.screenshot({ path: join(assets, `${id}.png`), fullPage: true });
  const shot = mark ? await observe(page, mark) : null;
  const dump = {
    url: page.url(),
    observed: shot,
    bodyText: await page.locator("body").innerText(),
  };
  writeFileSync(join(assets, `${id}.dom.json`), `${JSON.stringify(dump, null, 2)}\n`);
  return shot;
}

test.describe.configure({ mode: "serial" });

test("W-001 CONTRADICTED disables CTA and exposes the forbid reason", async ({ page }) => {
  await page.goto("/?view=surface&fixture=calendar-contradicted");
  const shot = await evidence(page, "W-001", "contradicted");
  expect(shot?.ctaEnabled).toBe(false);
  expect(shot?.reasonVisible).toBe(true);
  expect(shot?.reason).toBe("contradicted: resolve conflict first");
  expect(shot?.ariaLabel).toBe(
    "Calendario, contradicted, conferma disabilitata, ragione: contradicted resolve conflict first",
  );
  expect(shot?.ariaLabel).not.toMatch(/dimmed/i);
});

test("W-002 STALE keeps confirm enabled with warning stale 2 ore", async ({ page }) => {
  await page.goto("/?view=surface&fixture=hotel-stale");
  const shot = await evidence(page, "W-002", "stale");
  expect(shot?.ctaEnabled).toBe(true);
  expect(shot?.warning).toBe("stale 2 ore");
  expect(shot?.age).toBe("2h fa");
  expect(shot?.ariaLabel).toBe(
    "Hotel, stale 2 ore, prezzo 89 euro, conferma abilitata, warning: stale 2 ore",
  );
});

test("W-003 PENDING reserves the slot, disables CTA, and has no spinner", async ({ page }) => {
  await page.goto("/?view=surface&fixture=train-pending");
  const shot = await evidence(page, "W-003", "pending");
  expect(shot?.ctaEnabled).toBe(false);
  expect(shot?.pendingReserved).toBe(true);
  expect(shot?.spinnerDisplay).toBe("none");
  expect(shot?.ariaLabel).toContain("in verifica, slot riservato");
  await expect(page.locator("a3ui-surface[mark='pending']")).not.toContainText("spinner");
});

test("W-004 FACT enables the baseline CTA", async ({ page }) => {
  await page.goto("/?view=surface&fixture=flight-fact");
  const shot = await evidence(page, "W-004", "fact");
  expect(shot?.ctaEnabled).toBe(true);
  expect(shot?.ariaLabel).toBe("Volo, conferma abilitata");
  expect(shot?.badge).toBeNull();
});

test("W-005 prefers-reduced-motion zeros motion and keeps marks", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?view=marks");
  const held = page.locator('a3ui-surface[mark="held"]');
  await held.waitFor();
  const motion = await held.evaluate((el) => {
    const chrome = el.shadowRoot?.querySelector(".chrome");
    const badge = el.shadowRoot?.querySelector(".badge");
    if (!(chrome instanceof HTMLElement) || !(badge instanceof HTMLElement)) throw new Error("held chrome");
    const style = getComputedStyle(chrome);
    return {
      animation: style.animationName,
      duration: style.animationDuration,
      badge: badge.hidden ? null : badge.textContent,
    };
  });
  expect(motion.badge).toBe("quarantena");
  expect(motion.duration === "0s" || motion.animation === "none").toBe(true);
  const contradicted = await observe(page, "contradicted");
  expect(contradicted.reasonVisible).toBe(true);
  expect(contradicted.badge).toBe("contradicted");
  const pending = await observe(page, "pending");
  expect(pending.pendingReserved).toBe(true);
  await evidence(page, "W-005");
});

test("W-006 prefers-contrast more keeps hatch, label, and strikethrough", async ({ page }) => {
  await page.emulateMedia({ contrast: "more" });
  await page.goto("/?view=marks");
  const cues = await page.evaluate(() => {
    const read = (mark: string) => {
      const el = document.querySelector(`a3ui-surface[mark="${mark}"]`);
      const chrome = el?.shadowRoot?.querySelector(".chrome");
      const payload = el?.shadowRoot?.querySelector(".payload");
      const reserved = el?.shadowRoot?.querySelector(".reserved-slot");
      const badge = el?.shadowRoot?.querySelector(".badge");
      if (!(chrome instanceof HTMLElement)) throw new Error(mark);
      const chromeStyle = getComputedStyle(chrome);
      return {
        mark,
        backgroundImage: chromeStyle.backgroundImage,
        borderStyle: chromeStyle.borderStyle,
        outlineStyle: chromeStyle.outlineStyle,
        strikethrough: payload ? getComputedStyle(payload).textDecorationLine : "",
        reservedOutline: reserved instanceof HTMLElement ? getComputedStyle(reserved).outlineStyle : "",
        badge: badge instanceof HTMLElement && !badge.hidden ? badge.textContent : null,
        age: el?.shadowRoot?.querySelector(".age") instanceof HTMLElement &&
          !(el.shadowRoot.querySelector(".age") as HTMLElement).hidden
          ? el.shadowRoot.querySelector(".age")?.textContent
          : null,
      };
    };
    return {
      unknown: read("unknown"),
      stale: read("stale"),
      contradicted: read("contradicted"),
      pending: read("pending"),
    };
  });
  expect(cues.unknown.backgroundImage).toMatch(/repeating-linear-gradient/);
  expect(cues.unknown.badge).toBe("uncertain");
  expect(cues.stale.age).toBe("2h fa");
  expect(cues.contradicted.strikethrough).toMatch(/line-through/);
  expect(cues.contradicted.badge).toBe("contradicted");
  expect(cues.pending.reservedOutline).not.toBe("none");
  await evidence(page, "W-006");
});

test("W-007 backdrop-filter off keeps marks and declares blur unavailable", async ({ page }) => {
  await page.goto("/?view=marks&profile=blur-off");
  await expect(page.locator('[data-fallback="blur"]')).toHaveText("blur unavailable");
  await expect(page.locator('[data-fallback="blur"]')).toBeVisible();
  const contradicted = await observe(page, "contradicted");
  expect(contradicted.reasonVisible).toBe(true);
  expect(contradicted.ctaEnabled).toBe(false);
  const pending = await observe(page, "pending");
  expect(pending.pendingReserved).toBe(true);
  await evidence(page, "W-007");
});

test("W-008 overlay is COLLAPSED by default, expands on tap, collapses after dispatch", async ({ page }) => {
  await page.goto("/?view=overlay&fixture=flight-fact");
  const overlay = page.locator("a3ui-overlay");
  await expect(overlay).toHaveAttribute("phase", "collapsed");
  await expect(overlay.locator(".panel")).toBeHidden();
  await page.screenshot({ path: join(assets, "W-008-collapsed.png"), fullPage: true });
  await overlay.locator(".pill").click();
  await expect(overlay).toHaveAttribute("phase", "expanded");
  await page.screenshot({ path: join(assets, "W-008-expanded.png"), fullPage: true });
  await overlay.locator("a3ui-surface .cta").click();
  await expect(overlay).toHaveAttribute("phase", "collapsed");
  await evidence(page, "W-008");
});

test("W-009 COLLAPSED pass-through delivers clicks outside the pill to the app underneath", async ({ page }) => {
  await page.goto("/?view=overlay&fixture=flight-fact");
  await expect(page.locator("a3ui-overlay")).toHaveAttribute("phase", "collapsed");
  await expect(page.locator("#under-hits")).toHaveText("0");
  await page.locator("#under-app-cta").click();
  await expect(page.locator("#under-hits")).toHaveText("1");
  await expect(page.locator("a3ui-overlay")).toHaveAttribute("phase", "collapsed");
  await evidence(page, "W-009");
});

test("W-010 every CTA touch target is at least 48px", async ({ page }) => {
  await page.goto("/?view=marks");
  const sizes = await page.locator("a3ui-surface .cta").evaluateAll((nodes) =>
    nodes.map((node) => {
      const box = node.getBoundingClientRect();
      return { width: box.width, height: box.height, disabled: node instanceof HTMLButtonElement && node.disabled };
    }),
  );
  expect(sizes.length).toBeGreaterThanOrEqual(6);
  for (const size of sizes) {
    expect(size.width).toBeGreaterThanOrEqual(48);
    expect(size.height).toBeGreaterThanOrEqual(48);
  }
  const skip = await page.locator("a.skip").boundingBox();
  expect(skip?.width ?? 0).toBeGreaterThanOrEqual(48);
  expect(skip?.height ?? 0).toBeGreaterThanOrEqual(48);
  await page.goto("/?view=overlay&fixture=flight-fact");
  const pill = await page.locator("a3ui-overlay .pill").boundingBox();
  expect(pill?.width ?? 0).toBeGreaterThanOrEqual(48);
  expect(pill?.height ?? 0).toBeGreaterThanOrEqual(48);
  writeFileSync(join(assets, "W-010.dom.json"), `${JSON.stringify({ sizes, skip, pill }, null, 2)}\n`);
});

test("W-011 skip link is first in focus order", async ({ page }) => {
  await page.goto("/?view=gallery");
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? "");
  expect(focused).toBe("Salta ai marchi");
  writeFileSync(join(assets, "W-011.focus.txt"), `${focused}\n`);
  await evidence(page, "W-011");
});

test("W-012 semantic output matches the a3ui fixtures", async ({ page }) => {
  const cases = [
    { fixture: "calendar-contradicted", mark: "contradicted", json: calendar },
    { fixture: "hotel-stale", mark: "stale", json: hotel },
    { fixture: "train-pending", mark: "pending", json: train },
    { fixture: "flight-fact", mark: "fact", json: flight },
  ] as const;
  const rows = [];
  for (const item of cases) {
    await page.goto(`/?view=surface&fixture=${item.fixture}`);
    const shot = await observe(page, item.mark);
    const expected = expectedSemantic(parseSurface(item.json));
    expect(shot.mark).toBe(item.mark);
    expect(shot.ctaEnabled).toBe(expected.ctaEnabled);
    expect(shot.reasonVisible).toBe(expected.reasonVisible);
    expect(shot.reason).toBe(expected.reason);
    expect(shot.warningVisible).toBe(expected.warningVisible);
    expect(shot.warning).toBe(expected.warning);
    expect(shot.pendingReserved).toBe(expected.pendingReserved);
    expect(shot.spinnerDisplay).toBe("none");
    expect(shot.ariaLabel).toBe(expected.ariaLabel);
    await page.screenshot({ path: join(assets, `W-012-${item.mark}.png`) });
    rows.push({ fixture: item.fixture, expected, observed: shot });
  }
  writeFileSync(join(assets, "W-012.semantic.json"), `${JSON.stringify(rows, null, 2)}\n`);
});

test("W-013 incomplete tuple is an explicit reject in the DOM", async ({ page }) => {
  await page.goto("/?view=reject");
  const surface = page.locator("a3ui-surface");
  await expect(surface).toContainText("missing-field");
  await expect(surface).toContainText("refusing silent placeholder");
  const shot = await surface.evaluate((el) => ({
    label: el.getAttribute("aria-label"),
    disabled: el.shadowRoot?.querySelector("button") instanceof HTMLButtonElement
      ? (el.shadowRoot.querySelector("button") as HTMLButtonElement).disabled
      : null,
  }));
  expect(shot.label).toMatch(/missing-field/);
  expect(shot.disabled).toBe(true);
  await evidence(page, "W-013");
});
