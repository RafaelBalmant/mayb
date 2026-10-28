import { useEffect } from "preact/hooks";
import { resolveScreen } from "./domain/flow.js";
import { SCREENS } from "./screens/index.js";
import { useStore } from "./store/StoreProvider.jsx";

/** Shows the screen that matches the state (see resolveScreen) and scrolls to the top when it changes. */
export function App() {
  const { state } = useStore();
  const screen = resolveScreen(state.ui.screen, { ...state, mapEnabled: state.features.map });
  const Screen = SCREENS[screen];

  useEffect(() => window.scrollTo(0, 0), [screen, state.ui.index]);

  // key: remount on every screen (and every area in the details), like a fresh page
  return <Screen key={`${screen}:${state.ui.index}`} />;
}
