import { describe, expect, it } from "vitest";
import { isMapEnabled, screenFromHash } from "../src/domain/features.js";
import { targetOfHash } from "../src/navigation/routes.js";
import { createInitialState } from "../src/store/init.js";

const memoryStorage = (initial = {}) => {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => void (data[k] = String(v)),
    removeItem: (k) => void delete data[k],
  };
};
const KEY = "site-mayara:mapa";

describe("isMapEnabled", () => {
  it("is off by default", () => {
    expect(isMapEnabled({ search: "", storage: memoryStorage() })).toBe(false);
  });

  it("?mapa=1 turns it on and remembers it for the tab; ?mapa=0 forgets", () => {
    const storage = memoryStorage();
    expect(isMapEnabled({ search: "?mapa=1", storage })).toBe(true);
    expect(storage.data[KEY]).toBe("1");
    expect(isMapEnabled({ search: "", storage })).toBe(true); // later pages of the same tab
    expect(isMapEnabled({ search: "?mapa=0", storage })).toBe(false);
    expect(storage.data[KEY]).toBeUndefined();
  });

  it("still honors ?mapa=1 when the storage is blocked", () => {
    const blocked = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
    };
    expect(isMapEnabled({ search: "?mapa=1", storage: blocked })).toBe(true);
    expect(isMapEnabled({ search: "", storage: blocked })).toBe(false);
  });
});

describe("screenFromHash", () => {
  it("#agenda opens the agenda only when it is on, else the start page", () => {
    expect(screenFromHash("#agenda", false, true)).toBe("agenda");
    expect(screenFromHash("#agenda", true, true)).toBe("agenda");
    expect(screenFromHash("#agenda", true, false)).toBe("start");
    expect(screenFromHash("#agenda", true)).toBe("start"); // the agenda is off by default
  });
  it("#mapa opens the map flow only when it is on, else the start page", () => {
    expect(screenFromHash("#mapa", true)).toBe("opening");
    expect(screenFromHash("#mapa", false)).toBe("start");
  });
  it("#casos opens the cases page only when the map is on, else the start page", () => {
    expect(screenFromHash("#casos", true)).toBe("cases");
    expect(screenFromHash("#casos", false)).toBe("start");
  });
  it("anything else does nothing", () => {
    expect(screenFromHash("", true)).toBeNull();
    expect(screenFromHash("#outra", true)).toBeNull();
  });
});

describe("createInitialState", () => {
  it("starts on the start page with the map off", () => {
    const s = createInitialState({ storage: memoryStorage(), location: { search: "", hash: "" } });
    expect(s.ui.screen).toBe("start");
    expect(s.features.map).toBe(false);
  });

  it("keeps the saved screen (direct links are pages now, see targetOfHash)", () => {
    const saved = { state: { face: null, about: {}, areas: [] }, ui: { screen: "map" } };
    const storage = memoryStorage({ "site-mayara:v3": JSON.stringify(saved) });
    expect(createInitialState({ storage, location: { search: "", hash: "#agenda" } }).ui.screen).toBe("map");
  });

  it("?mapa=1 turns the map on", () => {
    const s = createInitialState({ storage: memoryStorage(), location: { search: "?mapa=1", hash: "" } });
    expect(s.features.map).toBe(true);
  });
});

describe("old direct links (/#agenda, /#mapa, /#casos)", () => {
  it("lead to the pages that replaced them", () => {
    expect(targetOfHash("#casos", true)).toEqual({ screen: "cases", path: "/casos/" });
    expect(targetOfHash("#mapa", true)).toEqual({ screen: "opening", path: "/mapa/" });
  });

  it("stay on the start page for the map and the cases while the map is off, and ignore other hashes", () => {
    expect(targetOfHash("#agenda", true)).toBeNull(); // the agenda is off
    expect(targetOfHash("#mapa", false)).toBeNull();
    expect(targetOfHash("#casos", false)).toBeNull();
    expect(targetOfHash("#qualquer", true)).toBeNull();
    expect(targetOfHash("", true)).toBeNull();
  });
});
