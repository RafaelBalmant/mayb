import flow from "../data/flow.json";

export const TOTAL_STEPS = flow.totalSteps;

const byId = Object.fromEntries(flow.screens.map(s => [s.id, s]));

export const SCREEN_IDS = flow.screens.map(s => s.id);

/** Step number shown in the progress bar for a screen. */
export const stepOf = id => byId[id]?.step;

/**
 * The screen that can actually be shown for the requested one: without a face we are on the opening;
 * screens that need marked areas fall back to the map; unknown screens fall back to the map.
 */
export function resolveScreen(requested, { face, areas }) {
  if (requested === "opening" || !face) return "opening";
  const screen = byId[requested];
  if (!screen) return "map";
  if (screen.requires === "areas" && areas.length === 0) return "map";
  return requested;
}
