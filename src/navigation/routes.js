// The site's public addresses. The face-map flow is one page; its steps (opening, map, results…) are screens inside
// it, kept in the state as before. The names are public links, so they stay in Portuguese.
import { screenFromHash } from "../domain/features.js";

export const PATHS = {
  start: "/",
  agenda: "/agenda/",
  cases: "/casos/",
  flow: "/mapa/",
};

/** Slug built while there is no service page yet (a static export needs one); scripts/postbuild.mjs deletes it. */
export const PLACEHOLDER_SLUG = "_no-service-pages";

/** Screens that are pages of their own; every other screen is a step of the flow at PATHS.flow. */
export const PAGE_OF_SCREEN = { start: PATHS.start, agenda: PATHS.agenda, cases: PATHS.cases };

/** The address a screen lives at. */
export const pathOfScreen = (screen) => PAGE_OF_SCREEN[screen] ?? PATHS.flow;

/**
 * Where an old direct link (/#agenda, /#mapa, /#casos) leads now: { screen, path }, or null for any other hash.
 * While the map is off, #mapa and #casos stay on the start page (null).
 */
export function targetOfHash(hash, mapEnabled) {
  const screen = screenFromHash(hash, mapEnabled);
  if (!screen || screen === "start") return null;
  return { screen, path: pathOfScreen(screen) };
}
