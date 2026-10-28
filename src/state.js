// The visitor's answers. They live only in the browser (memory + sessionStorage, so a reload keeps them).
// Nothing is sent to a server.
//
// Shape, shared by the summary and the WhatsApp message:
// {
//   face: "female" | "male" | null,
//   about: { name: string },        // only the name for now (age and period come with the "About you" step)
//   areas: [{                       // in the order they were marked
//     code,                         // see data/content.json
//     concerns: [string],           // chosen options, in content order
//     concernsOther: string,        // free-text "Other"
//     description: string,          // only for the "other" area
//     side, since, appearsWhen,     // codes from labels.*, or null
//     intensity: 1..5 | null,
//     procedure: "no" | "yes" | "dont_remember" | null,
//     procedureDetail: string,
//     comment: string
//   }]
// }
import { LEGACY_STORAGE_KEY, STORAGE_KEY } from "./config.js";
import { migrateV2 } from "./legacy-storage.js";

export const state = { face: null, about: { name: "" }, areas: [] };
export const ui = { screen: "opening", view: "front", index: 0, consent: false };

/** Areas whose "Other" field is open but still empty (not part of the state, not saved). */
export const openOther = new Set();

function load() {
  const current = sessionStorage.getItem(STORAGE_KEY);
  if (current) return JSON.parse(current);
  const legacy = sessionStorage.getItem(LEGACY_STORAGE_KEY);
  return legacy ? migrateV2(JSON.parse(legacy)) : null;
}

try {
  const saved = load();
  if (saved) {
    Object.assign(state, saved.state);
    Object.assign(ui, saved.ui);
  }
  state.about = { name: "", ...state.about };
} catch {
  // storage unavailable or corrupted: start empty
}

export function save() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ state, ui }));
  } catch {
    // storage unavailable: the app keeps working in memory
  }
}

export function newArea(code) {
  return {
    code,
    concerns: [],
    concernsOther: "",
    description: "",
    side: null,
    since: null,
    intensity: null,
    appearsWhen: null,
    procedure: null,
    procedureDetail: "",
    comment: "",
  };
}

export const isMarked = code => state.areas.some(a => a.code === code);

/** Marks or unmarks the area. Returns true if it ended up marked. */
export function toggleArea(code) {
  if (isMarked(code)) state.areas = state.areas.filter(a => a.code !== code);
  else state.areas.push(newArea(code));
  save();
  return isMarked(code);
}

export function restart() {
  state.face = null;
  state.about = { name: "" };
  state.areas = [];
  Object.assign(ui, { screen: "opening", view: "front", index: 0 });
  save();
}
