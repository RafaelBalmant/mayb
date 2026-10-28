import { describe, expect, it } from "vitest";
import { countCases, isAfter, partsWithCases } from "../src/domain/cases.js";

describe("cases", () => {
  it("only parts listed in cases.json get a card, in marking order ('other' has none)", () => {
    const areas = [{ code: "eyes" }, { code: "other" }, { code: "forehead" }];
    expect(partsWithCases(areas)).toEqual(["eyes", "forehead"]);
  });

  it("photos alternate before/after", () => {
    expect([0, 1, 2, 3].map(isAfter)).toEqual([false, true, false, true]);
  });

  it("counts before/after pairs across procedures", () => {
    expect(countCases([{ photos: [1, 2, 3, 4] }, { photos: [1, 2] }])).toBe(3);
    expect(countCases([{ photos: [] }])).toBe(0);
    expect(countCases([])).toBe(0);
  });
});
