"use client";
import { useEffect } from "react";
import { useAnalytics } from "../analytics/AnalyticsProvider.jsx";
import { resolveScreen } from "../domain/flow.js";
import { useMapGate } from "../navigation/useMapGate.js";
import { useStore } from "../store/StoreProvider.jsx";
import { FLOW_SCREENS } from "./index.js";

/**
 * The face-map flow (page /mapa/): shows the step that matches the state (see resolveScreen) and scrolls to the top
 * when it changes. A screen that is not a step of the flow (a saved "start" or "agenda") opens the flow at its start.
 * Nothing shows until the tab's saved answers are read, so a reload lands on the step the visitor was on.
 */
export function FaceFlow() {
  const { state } = useStore();
  const open = useMapGate();
  const resolved = resolveScreen(state.ui.screen, { ...state, mapEnabled: open });
  const screen = FLOW_SCREENS[resolved] ? resolved : "opening";
  const Screen = FLOW_SCREENS[screen];
  const ready = state.loaded && open;
  const { trackScreen } = useAnalytics();

  // braces: scrollTo returns a promise in newer browsers, and an effect may only return its clean-up
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen, state.ui.index]);
  useEffect(() => {
    if (ready) trackScreen(screen);
  }, [ready, screen, trackScreen]);

  if (!ready) return null;
  // key: remount on every screen (and every area in the details), like a fresh page
  return <Screen key={`${screen}:${state.ui.index}`} />;
}
