import { describe, expect, it } from "vitest";
import { areas } from "../src/content.js";
import { getFace, parseFace } from "../src/faces/index.js";

describe("parseFace", () => {
  it("extracts the viewBox, the art and the zones", () => {
    const raw = `<svg viewBox="0 0 10 20"><g class="art">
      <path class="skin" d="M0 0"/>
    </g>
    <g class="zones">
      <path class="zone" data-area="forehead" d="M1 1"/>
      <path class="zone zone-line" data-area="jawline" d="M2 2"/>
    </g></svg>`;
    const face = parseFace(raw);
    expect(face.viewBox).toBe("0 0 10 20");
    expect(face.art).toBe('<path class="skin" d="M0 0"/>');
    expect(face.zones).toEqual([
      { className: "zone", code: "forehead", d: "M1 1" },
      { className: "zone zone-line", code: "jawline", d: "M2 2" },
    ]);
  });
});

describe("shipped faces", () => {
  // "skin" and "other" have no zone on the drawing: they are buttons beside it
  const codes = areas.map(a => a.code).filter(c => c !== "other" && c !== "skin");

  it.each([
    ["female", "front"],
    ["female", "profile"],
    ["male", "front"],
    ["male", "profile"],
  ])("%s %s has art and a zone for every area", (face, view) => {
    const parsed = getFace(face, view);
    expect(parsed.art.length).toBeGreaterThan(100);
    expect(parsed.zones.map(z => z.code).sort()).toEqual([...codes].sort());
  });
});
