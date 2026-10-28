import { describe, expect, it } from "vitest";
import { FIELDS, hasAnswers, newArea } from "../src/domain/questions.js";

describe("newArea", () => {
  it("creates the area with every field empty", () => {
    expect(newArea("forehead")).toEqual({
      code: "forehead",
      concerns: [],
      concernsOther: "",
      description: "",
      side: null,
      since: null,
      intensity: null,
      appearsWhen: null,
      procedure: null,
      procedureDetail: "",
      comment: "",
    });
  });

  it("does not share array defaults between areas", () => {
    const a = newArea("forehead");
    a.concerns.push("frown_lines");
    expect(newArea("eyes").concerns).toEqual([]);
  });
});

describe("hasAnswers", () => {
  it("is false for an untouched area", () => {
    expect(hasAnswers(newArea("forehead"))).toBe(false);
  });

  it.each([
    ["concerns", ["frown_lines"]],
    ["concernsOther", "algo"],
    ["side", "left"],
    ["since", "always"],
    ["intensity", 1],
    ["appearsWhen", "still"],
    ["procedure", "no"],
    ["comment", "oi"],
  ])("is true when %s is filled", (field, value) => {
    expect(hasAnswers({ ...newArea("forehead"), [field]: value })).toBe(true);
  });

  it("ignores a comment with only spaces", () => {
    expect(hasAnswers({ ...newArea("forehead"), comment: "   " })).toBe(false);
  });

  it("does not count the 'other' description or the procedure detail as answers", () => {
    expect(hasAnswers({ ...newArea("other"), description: "x", procedureDetail: "y" })).toBe(false);
  });

  it("every field with an answer rule exists in the defaults", () => {
    expect(Object.entries(FIELDS).filter(([, f]) => f.answer).length).toBeGreaterThan(0);
  });
});
