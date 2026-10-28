import flow from "../data/flow.json";

const byId = Object.fromEntries(flow.screens.map((s) => [s.id, s]));

export const SCREEN_IDS = flow.screens.map((s) => s.id);

/** { flow, step } of a screen in its progress bar ("face" or "agenda"), or {} for screens without one. */
export const stepOf = (id) => ({ flow: byId[id]?.flow, step: byId[id]?.step });

/**
 * The screen that can actually be shown for the requested one:
 * - unknown screens and the face-map screens (while the map is off) fall back to the start page;
 * - without a face we are on the opening;
 * - screens that need marked areas fall back to the map when none is marked.
 */
export function resolveScreen(requested, { face, areas, mapEnabled }) {
  const screen = byId[requested];
  if (!screen) return mapEnabled ? "map" : "start";
  if (screen.needsMap && !mapEnabled) return "start";
  if (!screen.needsMap) return requested;
  if (requested === "opening" || !face) return "opening";
  if (screen.requires === "areas" && areas.length === 0) return "map";
  return requested;
}
