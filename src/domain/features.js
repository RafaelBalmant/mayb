import { MAP_ENABLED, MAP_PREVIEW_KEY } from "../config.js";

/**
 * Whether the face-map flow is shown: on for everyone (MAP_ENABLED) or, for this tab only, when the address
 * has ?mapa=1 (remembered in the storage until the tab closes); ?mapa=0 forgets it again.
 * The query and hash names are part of the public links, so they stay in Portuguese.
 */
export function isMapEnabled({ search = "", storage = null } = {}) {
  if (MAP_ENABLED) return true;
  const asked = new URLSearchParams(search).get("mapa");
  try {
    if (asked === "1") storage?.setItem(MAP_PREVIEW_KEY, "1");
    if (asked === "0") storage?.removeItem(MAP_PREVIEW_KEY);
    return storage?.getItem(MAP_PREVIEW_KEY) === "1";
  } catch {
    return asked === "1";
  }
}

/** The screen a link like /#agenda or /#mapa opens directly, or null. */
export function screenFromHash(hash, mapEnabled) {
  return { agenda: "agenda", mapa: mapEnabled ? "opening" : "start" }[hash.replace(/^#/, "")] ?? null;
}
