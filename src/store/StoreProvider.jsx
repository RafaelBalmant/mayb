"use client";
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useReducer } from "react";
import { MAP_ENABLED } from "../config.js";
import { createInitialState } from "./init.js";
import { initialState as emptyState, reducer } from "./reducer.js";
import { persistState } from "./storage.js";

const StoreContext = createContext(null);

/**
 * Holds the app state, shared by every page (it lives in the root layout, so it survives moving between pages).
 * The pages are built ahead of time, so the first render is the same for everyone: an empty state. Right after it,
 * what this tab saved (sessionStorage) and the ?mapa switch are loaded, and `state.loaded` turns true.
 * `initialState` (tests) is used as it is, already loaded; `storage` can be injected too.
 */
export function StoreProvider({ children, initialState, storage }) {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    initialState ? { ...initialState, loaded: true } : emptyState({ mapEnabled: MAP_ENABLED }),
  );
  useEffect(() => {
    if (!initialState) dispatch({ type: "LOAD", state: createInitialState({ storage }) });
  }, [initialState, storage]);
  // layout effect: saves right after each render instead of after the next paint, so a quick reload loses nothing.
  // Nothing is saved before the load, or the empty first state would overwrite what the tab had.
  useLayoutEffect(() => {
    if (state.loaded) persistState(state, storage);
  }, [state, storage]);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

/** { state, dispatch } of the nearest StoreProvider. */
export const useStore = () => useContext(StoreContext);
