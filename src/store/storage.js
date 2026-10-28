import { LEGACY_STORAGE_KEY, STORAGE_KEY } from "../config.js";
import { migrateV2 } from "./legacy-storage.js";
import { initialState } from "./reducer.js";

/** sessionStorage, or null when the browser blocks it. */
export function browserStorage() {
  try {
    return globalThis.sessionStorage ?? null;
  } catch {
    return null;
  }
}

function read(storage) {
  const current = storage.getItem(STORAGE_KEY);
  if (current) return JSON.parse(current);
  const legacy = storage.getItem(LEGACY_STORAGE_KEY);
  return legacy ? migrateV2(JSON.parse(legacy)) : null;
}

/** The initial app state: what was saved in this tab, or a fresh one. */
export function loadState(storage = browserStorage()) {
  const fresh = initialState();
  try {
    const saved = storage && read(storage);
    if (!saved) return fresh;
    return {
      ...fresh,
      face: saved.state?.face ?? null,
      about: { ...fresh.about, ...saved.state?.about },
      areas: saved.state?.areas ?? [],
      // only the keys we know: a save from an older version may carry fields that no longer exist
      ui: Object.fromEntries(Object.entries({ ...fresh.ui, ...saved.ui }).filter(([key]) => key in fresh.ui)),
    };
  } catch {
    return fresh; // storage unavailable or corrupted: start empty
  }
}

/** Saves the visitor's answers and position (not the transient UI bits). */
export function persistState({ face, about, areas, ui }, storage = browserStorage()) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify({ state: { face, about, areas }, ui }));
  } catch {
    // storage unavailable: the app keeps working in memory
  }
}
