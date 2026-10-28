import { renderToString } from "preact-render-to-string";
import { describe, expect, it } from "vitest";
import { App } from "../src/App.jsx";
import { SCREEN_IDS } from "../src/domain/flow.js";
import { newArea } from "../src/domain/questions.js";
import { initialState } from "../src/store/reducer.js";
import { StoreProvider } from "../src/store/StoreProvider.jsx";

const stateOn = (screen, patch = {}, ui = {}) => ({
  ...initialState(),
  face: "female",
  areas: [
    { ...newArea("forehead"), concerns: ["frown_lines"], side: "right", intensity: 4 },
    { ...newArea("nose") },
    { ...newArea("other"), description: "perto da orelha" },
  ],
  ...patch,
  ui: { ...initialState().ui, screen, ...ui },
});
const html = (state, index) => renderToString(<StoreProvider initialState={{ ...state, ui: { ...state.ui, index: index ?? state.ui.index } }}><App /></StoreProvider>);

describe("screens render from the state", () => {
  it.each(SCREEN_IDS)("%s renders inside the shared layout", id => {
    const out = html(stateOn(id));
    expect(out).toContain('id="app"');
    expect(out).toContain('id="bar-in"');
  });

  it("opening: the start button is disabled until a face is chosen", () => {
    expect(html({ ...stateOn("opening"), face: null })).toMatch(/id="start"[^>]*disabled/);
    expect(html(stateOn("opening"))).not.toMatch(/id="start"[^>]*disabled/);
  });

  it("map: zones are buttons and reflect what is marked", () => {
    const out = html(stateOn("map"));
    expect(out).toContain('aria-label="Testa"');
    expect(out).toMatch(/class="zone selected"[^>]*data-area="forehead"/);
    expect(out).toContain("Você marcou (3)");
    expect(out).toContain("Outra parte: perto da orelha");
  });

  it("map: without marked areas it shows the empty hint and disables continue", () => {
    const out = html(stateOn("map", { areas: [] }));
    expect(out).toContain("Toque no rosto para marcar.");
    expect(out).toMatch(/id="proceed"[^>]*disabled/);
  });

  it("details: shows the area's own options and only asks 'when it appears' for areas with movement", () => {
    const forehead = html(stateOn("details"), 0);
    expect(forehead).toContain("Linhas ao franzir");
    expect(forehead).toContain("Quando aparece mais?");
    const nose = html(stateOn("details"), 1);
    expect(nose).toContain("Calombo");
    expect(nose).not.toContain("Quando aparece mais?");
  });

  it("details: the 'other' area asks for a description instead of options", () => {
    const out = html(stateOn("details"), 2);
    expect(out).toContain("Qual parte é e o que te incomoda?");
    expect(out).toContain('id="description"');
    expect(out).not.toContain('id="other-btn"');
  });

  it("details: the procedure detail field only appears after answering 'yes'", () => {
    const withYes = stateOn("details", { areas: [{ ...newArea("forehead"), procedure: "yes" }] });
    expect(html(withYes, 0)).toContain('id="procedureDetail-txt"');
    expect(html(stateOn("details"), 0)).not.toContain('id="procedureDetail-txt"');
  });

  it("review: the link carries the message and is aria-disabled until consent", () => {
    const without = html(stateOn("review"));
    expect(without).toContain("https://wa.me/5543988540963?text=");
    expect(without).toMatch(/id="send"[^>]*aria-disabled="true"/);
    const withConsent = html(stateOn("review", {}, { consent: true }));
    expect(withConsent).toMatch(/id="send"[^>]*aria-disabled="false"/);
    expect(withConsent).toContain("checked");
  });

  it("falls back to the map when a screen needs areas and none is marked", () => {
    expect(html(stateOn("review", { areas: [] }))).toContain("Toque no rosto para marcar.");
  });
});
