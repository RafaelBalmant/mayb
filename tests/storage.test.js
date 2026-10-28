import { describe, expect, it } from "vitest";
import { migrateV2 } from "../src/store/legacy-storage.js";
import { loadState, persistState } from "../src/store/storage.js";

const KEY = "site-mayara:v3";
const LEGACY_KEY = "site-mayara:v2";

const memoryStorage = (initial = {}) => {
  const data = { ...initial };
  return { data, getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => void (data[k] = String(v)) };
};
const blockedStorage = {
  getItem() {
    throw new Error("blocked");
  },
  setItem() {
    throw new Error("blocked");
  },
};

describe("loadState", () => {
  it("starts empty when nothing was saved", () => {
    const s = loadState(memoryStorage());
    expect(s).toMatchObject({ face: null, about: { name: "" }, areas: [] });
    expect(s.ui).toEqual({
      screen: "start",
      view: "front",
      index: 0,
      agendaMonth: 0,
      openCase: null,
      viewedCases: false,
    });
  });

  it("restores the saved state and ui", () => {
    const saved = {
      state: { face: "male", about: { name: "Ana" }, areas: [] },
      ui: { screen: "map", view: "profile", index: 2 },
    };
    const s = loadState(memoryStorage({ [KEY]: JSON.stringify(saved) }));
    expect(s.face).toBe("male");
    expect(s.about.name).toBe("Ana");
    expect(s.ui).toMatchObject(saved.ui);
    expect(s.ui.agendaMonth).toBe(0); // missing keys keep their defaults
  });

  it("drops ui fields that no longer exist in a save from an older version", () => {
    const saved = { state: { face: "male", about: {}, areas: [] }, ui: { screen: "map", consent: true } };
    const s = loadState(memoryStorage({ [KEY]: JSON.stringify(saved) }));
    expect(s.ui).not.toHaveProperty("consent");
    expect(s.ui.screen).toBe("map");
  });

  it("ignores invalid JSON and uses the defaults", () => {
    expect(loadState(memoryStorage({ [KEY]: "{broken" })).face).toBeNull();
  });

  it("works when sessionStorage is unavailable", () => {
    expect(loadState(blockedStorage).areas).toEqual([]);
    expect(loadState(null).areas).toEqual([]);
  });

  it("converts data saved by the old Portuguese-named version", () => {
    const legacy = {
      estado: {
        rosto: "feminino",
        sobre: { nome: "Ana" },
        areas: [
          {
            codigo: "testa",
            incomoda: ["Linhas ao franzir", "Texto que não existe mais"],
            lado: "direito",
            intensidade: 4,
          },
        ],
      },
      ui: { tela: "detalhes", vista: "perfil", indice: 1, aceite: true },
    };
    const s = loadState(memoryStorage({ [LEGACY_KEY]: JSON.stringify(legacy) }));
    expect(s.face).toBe("female");
    expect(s.about.name).toBe("Ana");
    expect(s.areas[0]).toMatchObject({ code: "forehead", side: "right", intensity: 4, concerns: ["frown_lines"] });
    expect(s.ui).toMatchObject({ screen: "details", view: "profile", index: 1 });
    expect(s.ui).not.toHaveProperty("consent"); // the checkbox no longer exists
  });
});

describe("persistState", () => {
  it("saves answers and position but not the transient UI", () => {
    const storage = memoryStorage();
    persistState(
      { face: "female", about: { name: "Ana" }, areas: [], ui: { screen: "map" }, otherOpen: ["eyes"] },
      storage,
    );
    const saved = JSON.parse(storage.data[KEY]);
    expect(saved).toEqual({ state: { face: "female", about: { name: "Ana" }, areas: [] }, ui: { screen: "map" } });
  });

  it("does not throw when storage is blocked", () => {
    expect(() => persistState({ face: null, about: {}, areas: [], ui: {} }, blockedStorage)).not.toThrow();
  });
});

describe("migrateV2", () => {
  it("maps every legacy value to the new code", () => {
    const { state } = migrateV2({
      estado: {
        rosto: "masculino",
        areas: [
          { codigo: "mandibula", desde: "6m_2a", quandoAparece: "parado", procedimento: "nao_lembro", lado: "os_dois" },
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
