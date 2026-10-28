import { describe, expect, it } from "vitest";
import { SCREEN_IDS, resolveScreen, stepOf } from "../src/domain/flow.js";
import { SCREENS } from "../src/screens/index.js";

const marked = [{ code: "eyes" }];
const MAP_SCREENS = ["opening", "map", "results", "next", "details", "review", "sent"];

describe("resolveScreen with the map on", () => {
  const on = { mapEnabled: true };

  it("always starts on the opening when no face was chosen (for the map flow)", () => {
    for (const id of MAP_SCREENS) expect(resolveScreen(id, { ...on, face: null, areas: marked })).toBe("opening");
  });

  it("start and agenda never depend on a face", () => {
    expect(resolveScreen("start", { ...on, face: null, areas: [] })).toBe("start");
    expect(resolveScreen("agenda", { ...on, face: null, areas: [] })).toBe("agenda");
  });

  it("shows the requested screen when its requirements are met", () => {
    for (const id of SCREEN_IDS) expect(resolveScreen(id, { ...on, face: "female", areas: marked })).toBe(id);
  });

  it("falls back to the map when areas are required but none is marked", () => {
    for (const id of ["results", "next", "details", "review", "sent"]) {
      expect(resolveScreen(id, { ...on, face: "female", areas: [] })).toBe("map");
    }
    expect(resolveScreen("map", { ...on, face: "female", areas: [] })).toBe("map");
  });

  it("falls back to the map for unknown screens", () => {
    expect(resolveScreen("nope", { ...on, face: "male", areas: marked })).toBe("map");
  });
});

describe("resolveScreen with the map off", () => {
  const off = { mapEnabled: false, face: "female", areas: marked };

  it("every map screen sends the visitor to the start page", () => {
    for (const id of MAP_SCREENS) expect(resolveScreen(id, off)).toBe("start");
  });

  it("start and agenda stay available", () => {
    expect(resolveScreen("start", off)).toBe("start");
    expect(resolveScreen("agenda", off)).toBe("agenda");
  });

  it("unknown screens go to the start page", () => {
    expect(resolveScreen("nope", off)).toBe("start");
  });
});

describe("flow wiring", () => {
  it("every screen in flow.json has a component and vice versa", () => {
    expect(Object.keys(SCREENS).sort()).toEqual([...SCREEN_IDS].sort());
  });

  it("exposes flow and step for the progress bars", () => {
    expect(stepOf("details")).toEqual({ flow: "face", step: 4 });
    expect(stepOf("next")).toEqual({ flow: "face", step: 4 });
    expect(stepOf("review")).toEqual({ flow: "face", step: 5 });
    expect(stepOf("agenda")).toEqual({ flow: "agenda", step: 1 });
    expect(stepOf("start")).toEqual({ flow: undefined, step: undefined });
  });
});
