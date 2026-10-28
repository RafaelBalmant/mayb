import { describe, expect, it } from "vitest";
import { areas } from "../src/content.js";
import { getFace, parseFace, zonesOf } from "../src/faces/index.js";

describe("parseFace", () => {
  const raw = `<svg viewBox="0 0 10 20">
    <defs><clipPath id="crop-0"><path d="M0 0"/></clipPath></defs>
    <g class="art">
      <path class="skin" d="M0 0"/>
    </g>
    <g class="zones" clip-path="url(#crop-0)">
      <path class="zone" data-area="forehead" d="M1 1"/>
      <path class="zone" data-area="jawline" d="M2 2"/>
    </g>
    <g class="art details">
      <path class="stroke" d="M3 3"/>
    </g>
  </svg>`;

  it("extracts the viewBox, the defs and the groups in drawing order", () => {
    const face = parseFace(raw);
    expect(face.viewBox).toBe("0 0 10 20");
    expect(face.defs).toBe('<clipPath id="crop-0"><path d="M0 0"/></clipPath>');
    expect(face.groups.map((g) => g.type)).toEqual(["art", "zones", "art"]);
    expect(face.groups[0]).toEqual({ type: "art", className: "art", html: '<path class="skin" d="M0 0"/>' });
    expect(face.groups[1].clipPath).toBe("url(#crop-0)");
    expect(face.groups[2].className).toBe("art details");
  });

  it("lists the zones with their classes and area codes", () => {
    expect(zonesOf(parseFace(raw))).toEqual([
      { className: "zone", code: "forehead", d: "M1 1" },
      { className: "zone", code: "jawline", d: "M2 2" },
    ]);
  });
});

describe("shipped faces", () => {
  // "skin" and "other" have no zone on the drawing: they are buttons beside it
  const codes = areas.map((a) => a.code).filter((c) => c !== "other" && c !== "skin");

  it.each([
    ["female", "front"],
    ["female", "profile"],
    ["male", "front"],
    ["male", "profile"],
  ])("%s %s has art, clip paths and a zone for every area", (face, view) => {
    const parsed = getFace(face, view);
    expect(parsed.groups.some((g) => g.type === "art" && g.html.length > 100)).toBe(true);
    expect(
      zonesOf(parsed)
        .map((z) => z.code)
        .sort(),
    ).toEqual([...codes].sort());
    for (const g of parsed.groups.filter((x) => x.type === "zones")) {
      const id = g.clipPath.match(/url\(#([^)]+)\)/)[1];
      expect(parsed.defs, `${face} ${view}: clip path ${id}`).toContain(`id="${id}"`);
    }
  });
});
