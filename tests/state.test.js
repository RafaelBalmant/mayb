import { beforeEach, describe, expect, it, vi } from "vitest";
import { migrateV2 } from "../src/legacy-storage.js";

const KEY = "site-mayara:v3";
const LEGACY_KEY = "site-mayara:v2";

function stubStorage(initial = {}) {
  const data = { ...initial };
  vi.stubGlobal("sessionStorage", {
    getItem: k => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v);
    },
  });
  return data;
}

// state.js reads sessionStorage on import, so each test imports a fresh module.
async function load(initial) {
  vi.resetModules();
  const data = stubStorage(initial);
  return { data, mod: await import("../src/state.js") };
}

beforeEach(() => vi.unstubAllGlobals());

describe("toggleArea", () => {
  it("marks, unmarks and persists", async () => {
    const { mod, data } = await load();
    expect(mod.toggleArea("forehead")).toBe(true);
    expect(mod.isMarked("forehead")).toBe(true);
    expect(JSON.parse(data[KEY]).state.areas).toHaveLength(1);

    expect(mod.toggleArea("forehead")).toBe(false);
    expect(mod.state.areas).toEqual([]);
  });

  it("keeps the order in which areas were marked", async () => {
    const { mod } = await load();
    ["eyes", "forehead", "mouth"].forEach(mod.toggleArea);
    expect(mod.state.areas.map(a => a.code)).toEqual(["eyes", "forehead", "mouth"]);
  });
});

describe("persistence", () => {
  it("restores the saved state and ui", async () => {
    const saved = {
      state: { face: "male", about: { name: "Ana" }, areas: [] },
      ui: { screen: "map", view: "profile", index: 2 },
    };
    const { mod } = await load({ [KEY]: JSON.stringify(saved) });
    expect(mod.state.face).toBe("male");
    expect(mod.state.about.name).toBe("Ana");
    expect(mod.ui).toMatchObject(saved.ui);
  });

  it("ignores invalid JSON and uses the defaults", async () => {
    const { mod } = await load({ [KEY]: "{broken" });
    expect(mod.state).toEqual({ face: null, about: { name: "" }, areas: [] });
    expect(mod.ui).toEqual({ screen: "opening", view: "front", index: 0, consent: false });
  });

  it("works when sessionStorage is unavailable", async () => {
    vi.resetModules();
    vi.stubGlobal("sessionStorage", {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
    });
    const mod = await import("../src/state.js");
    expect(() => mod.toggleArea("forehead")).not.toThrow();
  });

  it("converts data saved by the old Portuguese-named version", async () => {
    const legacy = {
      estado: {
        rosto: "feminino",
        sobre: { nome: "Ana" },
        areas: [{ codigo: "testa", incomoda: ["Linhas ao franzir", "Texto que não existe mais"], lado: "direito", intensidade: 4 }],
      },
      ui: { tela: "detalhes", vista: "perfil", indice: 1, aceite: true },
    };
    const { mod } = await load({ [LEGACY_KEY]: JSON.stringify(legacy) });
    expect(mod.state.face).toBe("female");
    expect(mod.state.about.name).toBe("Ana");
    expect(mod.state.areas[0]).toMatchObject({ code: "forehead", side: "right", intensity: 4, concerns: ["frown_lines"] });
    expect(mod.ui).toEqual({ screen: "details", view: "profile", index: 1, consent: true });
  });
});

describe("migrateV2", () => {
  it("maps every legacy value to the new code", () => {
    const { state } = migrateV2({
      estado: {
        rosto: "masculino",
        areas: [
          {
            codigo: "mandibula",
            desde: "6m_2a",
            quandoAparece: "parado",
            procedimento: "nao_lembro",
            lado: "os_dois",
          },
        ],
      },
    });
    expect(state.face).toBe("male");
    expect(state.areas[0]).toMatchObject({
      code: "jawline",
      since: "6m_2y",
      appearsWhen: "still",
      procedure: "dont_remember",
      side: "both",
    });
  });

  it("drops areas with unknown codes and survives empty input", () => {
    expect(migrateV2({ estado: { areas: [{ codigo: "xyz" }] } }).state.areas).toEqual([]);
    expect(migrateV2(null).ui.screen).toBe("opening");
  });
});

describe("restart", () => {
  it("clears everything and goes back to the opening", async () => {
    const { mod } = await load();
    mod.state.face = "female";
    mod.state.about.name = "Ana";
    mod.toggleArea("forehead");
    Object.assign(mod.ui, { screen: "review", index: 3 });

    mod.restart();

    expect(mod.state).toEqual({ face: null, about: { name: "" }, areas: [] });
    expect(mod.ui).toMatchObject({ screen: "opening", view: "front", index: 0, consent: false });
  });
});
