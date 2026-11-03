import { isMapEnabled } from "../domain/features.js";
import { browserStorage, loadState } from "./storage.js";

/** The state the app starts with in the browser: what this tab saved, plus whether the map is on (?mapa=1). */
export function createInitialState({ storage = browserStorage(), location = globalThis.location } = {}) {
  const mapEnabled = isMapEnabled({ search: location?.search, storage });
  return { ...loadState(storage), features: { map: mapEnabled } };
}
