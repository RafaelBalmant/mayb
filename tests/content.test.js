import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import content from "../src/data/content.json";
import flow from "../src/data/flow.json";
import questions from "../src/data/questions.json";

const { areas, labels, texts } = content;
const source = dir =>
  readdirSync(dir, { recursive: true })
    .filter(f => f.endsWith(".js"))
    .map(f => readFileSync(`${dir}/${f}`, "utf8"))
    .join("\n");
const lookup = (obj, path) => path.split(".").reduce((o, k) => o?.[k], obj);

describe("content.json", () => {
  it("has unique area codes and unique option ids inside each area", () => {
    expect(new Set(areas.map(a => a.code)).size).toBe(areas.length);
    for (const a of areas) {
      const ids = a.options.map(o => o.id);
      expect(new Set(ids).size, a.code).toBe(ids.length);
    }
  });

  it("every literal t()/tn() key used in the code exists in texts", () => {
    const code = source("src");
    const keys = [...code.matchAll(/\bt\("([\w.]+)"/g)].map(m => m[1]);
    const pluralKeys = [...code.matchAll(/\btn\("([\w.]+)"/g)].map(m => m[1]);
    expect(keys.length).toBeGreaterThan(20);
    for (const k of keys) expect(lookup(texts, k), `t("${k}")`).toBeDefined();
    for (const k of pluralKeys) {
      expect(lookup(texts, `${k}.one`), `tn("${k}") one`).toBeDefined();
      expect(lookup(texts, `${k}.many`), `tn("${k}") many`).toBeDefined();
    }
  });

  it("the face SVGs have a tappable zone for every area except 'other'", () => {
    const needed = areas.map(a => a.code).filter(c => c !== "other");
    const svgs = readdirSync("src/faces").filter(f => f.endsWith(".svg"));
    expect(svgs).toHaveLength(4);
    for (const f of svgs) {
      const zones = new Set([...readFileSync(`src/faces/${f}`, "utf8").matchAll(/data-area="(\w+)"/g)].map(m => m[1]));
      for (const code of zones) expect(needed, `${f}: zone ${code}`).toContain(code);
    }
  });
});

describe("questions.json", () => {
  it("every question points to existing fields, labels and texts", () => {
    for (const q of questions.questions) {
      expect(questions.fields[q.field], q.field).toBeDefined();
      if (q.labels) expect(labels[q.labels], q.labels).toBeDefined();
      expect(lookup(texts, `details.questions.${q.labelKey ?? q.field}`), q.field).toBeDefined();
      if (q.placeholder) expect(lookup(texts, q.placeholder), q.placeholder).toBeDefined();
      if (q.detail) {
        expect(questions.fields[q.detail.field]).toBeDefined();
        expect(lookup(texts, q.detail.placeholder)).toBeDefined();
        expect(labels[q.labels][q.detail.showWhen]).toBeDefined();
      }
      if (q.requires) expect(areas.some(a => a[q.requires])).toBe(true);
    }
  });
});

describe("flow.json", () => {
  it("steps are within the total and ids are unique", () => {
    const ids = flow.screens.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of flow.screens) if (s.step) expect(s.step).toBeLessThanOrEqual(flow.totalSteps);
  });
});
