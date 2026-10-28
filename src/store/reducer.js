import { newArea } from "../domain/questions.js";
import { isMarked } from "../domain/areas.js";

export const initialState = ({ mapEnabled = false } = {}) => ({
  face: null,
  about: { name: "" },
  areas: [],
  // agendaMonth: month tab chosen in the agenda; openCase: expanded results card; viewedCases: opened any
  ui: { screen: "start", view: "front", index: 0, agendaMonth: 0, openCase: null, viewedCases: false },
  // not persisted: areas whose "Other" field is open but still empty, and the page-level feature flags
  otherOpen: [],
  features: { map: mapEnabled },
});

const updateArea = (areas, code, patch) => areas.map((a) => (a.code === code ? { ...a, ...patch } : a));

/** Pure state transitions. Every action is a plain object: { type, ...payload }. */
export function reducer(state, action) {
  switch (action.type) {
    case "SET_FACE":
      return { ...state, face: action.face };
    case "SET_VIEW":
      return { ...state, ui: { ...state.ui, view: action.view } };
    case "SET_NAME":
      return { ...state, about: { ...state.about, name: action.name } };
    case "SET_AGENDA_MONTH":
      return { ...state, ui: { ...state.ui, agendaMonth: action.index } };
    case "TOGGLE_CASE": {
      const open = state.ui.openCase === action.code ? null : action.code;
      return { ...state, ui: { ...state.ui, openCase: open, viewedCases: state.ui.viewedCases || open !== null } };
    }
    case "GO_TO":
      return { ...state, ui: { ...state.ui, screen: action.screen, index: action.index ?? 0 } };
    case "TOGGLE_AREA":
      return {
        ...state,
        areas: isMarked(state.areas, action.code)
          ? state.areas.filter((a) => a.code !== action.code)
          : [...state.areas, newArea(action.code)],
      };
    case "UPDATE_AREA":
      return { ...state, areas: updateArea(state.areas, action.code, action.patch) };
    case "SAVE_OTHER": {
      const areas = isMarked(state.areas, "other") ? state.areas : [...state.areas, newArea("other")];
      return { ...state, areas: updateArea(areas, "other", { description: action.text }) };
    }
    case "SET_OTHER_OPEN": {
      const rest = state.otherOpen.filter((c) => c !== action.code);
      return { ...state, otherOpen: action.open ? [...rest, action.code] : rest };
    }
    case "RESTART":
      return {
        ...initialState({ mapEnabled: state.features.map }),
        ui: { ...initialState().ui, screen: "opening", agendaMonth: state.ui.agendaMonth },
      };
    default:
      return state;
  }
}
