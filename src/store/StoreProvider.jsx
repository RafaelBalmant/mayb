import { createContext } from "preact";
import { useCallback, useContext, useLayoutEffect, useMemo, useReducer } from "preact/hooks";
import { reducer } from "./reducer.js";
import { loadState, persistState } from "./storage.js";

const StoreContext = createContext(null);

/**
 * Holds the app state. `initialState` (tests) and `storage` can be injected;
 * by default it loads from and saves to the browser's sessionStorage.
 */
export function StoreProvider({ children, initialState, storage }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState ?? loadState(storage));
  // layout effect: saves right after each render instead of after the next paint, so a quick reload loses nothing
  useLayoutEffect(() => persistState(state, storage), [state, storage]);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

/** { state, dispatch } of the nearest StoreProvider. */
export const useStore = () => useContext(StoreContext);

/** goTo(screen, index = 0): changes the screen. */
export function useNavigation() {
  const { dispatch } = useStore();
  const goTo = useCallback((screen, index = 0) => dispatch({ type: "GO_TO", screen, index }), [dispatch]);
  return { goTo };
}
