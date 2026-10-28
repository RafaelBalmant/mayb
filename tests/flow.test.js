import { describe, expect, it } from "vitest";
import { SCREEN_IDS, resolveScreen, stepOf } from "../src/domain/flow.js";
import { SCREENS } from "../src/screens/index.js";

const marked = [{ code: "eyes" }];

describe("resolveScreen", () => {
  it("always starts on the opening when no face was chosen", () => {
    for (const id of SCREEN_IDS) expect(resolveScreen(id, { face: null, areas: marked })).toBe("opening");
  });

  it("shows the requested screen when its requirements are met", () => {
    for (const id of SCREEN_IDS) expect(resolveScreen(id, { face: "female", areas: marked })).toBe(id);
  });

  it("falls back to the map when areas are required but none is marked", () => {
    for (const id of ["next", "details", "review", "sent"]) {
      expect(resolveScreen(id, { face: "female", areas: [] })).toBe("map");
    }
    expect(resolveScreen("map", { face: "female", areas: [] })).toBe("map");
  });

  it("falls back to the map for unknown screens", () => {
    expect(resolveScreen("nope", { face: "male", areas: marked })).toBe("map");
  });
});

describe("flow wiring", () => {
  it("every screen in flow.json has a component and vice versa", () => {
    expect(Object.keys(SCREENS).sort()).toEqual([...SCREEN_IDS].sort());
  });

  it("exposes the step numbers used by the progress bar", () => {
    expect(stepOf("details")).toBe(4);
    expect(stepOf("review")).toBe(8);
    expect(stepOf("opening")).toBeUndefined();
  });
});
