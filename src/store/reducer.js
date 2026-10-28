import { newArea } from "../domain/questions.js";
import { isMarked } from "../domain/areas.js";

export const initialState = () => ({
  face: null,
  about: { name: "" },
  areas: [],
  ui: { screen: "opening", view: "front", index: 0, consent: false },
  // areas whose "Other" field is open but still empty; not persisted
  otherOpen: [],
});

const updateArea = (areas, code, patch) => areas.map(a => (a.code === code ? { ...a, ...patch } : a));

/** Pure state transitions. Every action is a plain object: { type, ...payload }. */
export function reducer(state, action) {
  switch (action.type) {
    case "SET_FACE":
      return { ...state, face: action.face };
    case "SET_VIEW":
      return { ...state, ui: { ...state.ui, view: action.view } };
    case "SET_NAME":
      return { ...state, about: { ...state.about, name: action.name } };
    case "SET_CONSENT":
      return { ...state, ui: { ...state.ui, consent: action.value } };
    case "GO_TO":
      return { ...state, ui: { ...state.ui, screen: action.screen, index: action.index ?? 0 } };
    case "TOGGLE_AREA":
      return {
        ...state,
        areas: isMarked(state.areas, action.code)
          ? state.areas.filter(a => a.code !== action.code)
          : [...state.areas, newArea(action.code)],
      };
    case "UPDATE_AREA":
      return { ...state, areas: updateArea(state.areas, action.code, action.patch) };
    case "SAVE_OTHER": {
      const areas = isMarked(state.areas, "other") ? state.areas : [...state.areas, newArea("other")];
      return { ...state, areas: updateArea(areas, "other", { description: action.text }) };
    }
    case "SET_OTHER_OPEN": {
      const rest = state.otherOpen.filter(c => c !== action.code);
      return { ...state, otherOpen: action.open ? [...rest, action.code] : rest };
    }
    case "RESTART":
      return initialState();
    default:
      return state;
  }
}
