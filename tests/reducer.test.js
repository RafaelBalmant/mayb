import { describe, expect, it } from "vitest";
import { initialState, reducer } from "../src/store/reducer.js";

const run = (...actions) => actions.reduce(reducer, initialState());

describe("reducer", () => {
  it("toggles areas keeping the marking order", () => {
    const s = run(
      { type: "TOGGLE_AREA", code: "eyes" },
      { type: "TOGGLE_AREA", code: "forehead" },
      { type: "TOGGLE_AREA", code: "mouth" },
      { type: "TOGGLE_AREA", code: "forehead" },
    );
    expect(s.areas.map(a => a.code)).toEqual(["eyes", "mouth"]);
  });

  it("updates one area without touching the others", () => {
    const s = run(
      { type: "TOGGLE_AREA", code: "eyes" },
      { type: "TOGGLE_AREA", code: "nose" },
      { type: "UPDATE_AREA", code: "nose", patch: { side: "left", intensity: 3 } },
    );
    expect(s.areas[1]).toMatchObject({ code: "nose", side: "left", intensity: 3 });
    expect(s.areas[0].side).toBeNull();
  });

  it("never mutates the previous state", () => {
    const before = run({ type: "TOGGLE_AREA", code: "eyes" });
    const snapshot = JSON.stringify(before);
    reducer(before, { type: "UPDATE_AREA", code: "eyes", patch: { comment: "x" } });
    reducer(before, { type: "TOGGLE_AREA", code: "nose" });
    expect(JSON.stringify(before)).toBe(snapshot);
  });

  it("SAVE_OTHER marks the 'other' area when needed and keeps it when it exists", () => {
    const first = run({ type: "SAVE_OTHER", text: "perto da orelha" });
    expect(first.areas).toHaveLength(1);
    expect(first.areas[0]).toMatchObject({ code: "other", description: "perto da orelha" });
    const second = reducer(first, { type: "SAVE_OTHER", text: "outra coisa" });
    expect(second.areas).toHaveLength(1);
    expect(second.areas[0].description).toBe("outra coisa");
  });

  it("GO_TO sets screen and index (index defaults to 0)", () => {
    const s = run({ type: "GO_TO", screen: "details", index: 2 }, { type: "GO_TO", screen: "review" });
    expect(s.ui).toMatchObject({ screen: "review", index: 0 });
  });

  it("tracks the open 'Other' field per area without duplicates", () => {
    const s = run(
      { type: "SET_OTHER_OPEN", code: "eyes", open: true },
      { type: "SET_OTHER_OPEN", code: "eyes", open: true },
      { type: "SET_OTHER_OPEN", code: "nose", open: true },
      { type: "SET_OTHER_OPEN", code: "nose", open: false },
    );
    expect(s.otherOpen).toEqual(["eyes"]);
  });

  it("RESTART clears everything, including the consent given before", () => {
    const s = run(
      { type: "SET_FACE", face: "female" },
      { type: "SET_NAME", name: "Ana" },
      { type: "TOGGLE_AREA", code: "eyes" },
      { type: "SET_CONSENT", value: true },
      { type: "SET_OTHER_OPEN", code: "eyes", open: true },
      { type: "GO_TO", screen: "sent" },
      { type: "RESTART" },
    );
    expect(s).toEqual(initialState());
    expect(s.ui.consent).toBe(false);
  });

  it("ignores unknown actions", () => {
    const s = initialState();
    expect(reducer(s, { type: "NOPE" })).toBe(s);
  });
});
