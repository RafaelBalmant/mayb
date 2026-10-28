import { isMapEnabled, screenFromHash } from "../domain/features.js";
import { browserStorage, loadState } from "./storage.js";

/**
 * The state the app starts with: what this tab saved, plus the page-level bits that come from the address —
 * whether the map is on (?mapa=1) and a direct link such as /#agenda.
 */
export function createInitialState({ storage = browserStorage(), location = globalThis.location } = {}) {
  const mapEnabled = isMapEnabled({ search: location?.search, storage });
  const state = loadState(storage);
  const shortcut = screenFromHash(location?.hash ?? "", mapEnabled);
  return {
    ...state,
    features: { map: mapEnabled },
    ui: shortcut ? { ...state.ui, screen: shortcut } : state.ui,
  };
}
