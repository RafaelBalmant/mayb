"use client";
import { useEffect } from "react";
import { useStore } from "../store/StoreProvider.jsx";
import { PATHS } from "./routes.js";
import { useRouterBridge } from "./RouterProvider.jsx";

/**
 * For the pages behind the map switch (the face map and the cases page): true once they may show. While the map is
 * off for this tab (no ?mapa=1 and MAP_ENABLED false), the visitor is sent to the start page, as before.
 * Until the tab's saved state is read it is true only when the map is on for everyone.
 */
export function useMapGate() {
  const { state } = useStore();
  const router = useRouterBridge();
  const open = state.features.map;
  useEffect(() => {
    if (state.loaded && !open) router.replace(PATHS.start);
  }, [state.loaded, open, router]);
  return open;
}
