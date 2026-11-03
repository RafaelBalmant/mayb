"use client";
import { useEffect } from "react";
import { useRouterBridge } from "../navigation/RouterProvider.jsx";
import { targetOfHash } from "../navigation/routes.js";
import { useStore } from "../store/StoreProvider.jsx";

/**
 * Keeps the old direct links working: /#agenda opens /agenda/, /#casos opens /casos/ and /#mapa opens the face
 * map (these two only while the map is on). Runs once the tab's state is read, since ?mapa=1 decides it.
 */
export function LegacyHashLinks() {
  const { state, dispatch } = useStore();
  const router = useRouterBridge();
  useEffect(() => {
    if (!state.loaded) return;
    const target = targetOfHash(location.hash, state.features.map);
    if (!target) return;
    if (target.screen === "opening") dispatch({ type: "GO_TO", screen: "opening" });
    router.replace(target.path);
  }, [state.loaded, state.features.map, dispatch, router]);
  return null;
}
