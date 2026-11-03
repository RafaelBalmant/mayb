"use client";
import { useCallback } from "react";
import { useStore } from "../store/StoreProvider.jsx";
import { PAGE_OF_SCREEN, PATHS } from "./routes.js";
import { useRouterBridge } from "./RouterProvider.jsx";

/**
 * goTo(screen, index = 0): shows a screen. The start page, the agenda and the cases page are pages of their own;
 * the steps of the face-map flow change inside the flow page (opening it first when coming from elsewhere).
 */
export function useNavigation() {
  const { dispatch } = useStore();
  const router = useRouterBridge();
  const goTo = useCallback(
    (screen, index = 0) => {
      const page = PAGE_OF_SCREEN[screen];
      if (page) return router.push(page);
      dispatch({ type: "GO_TO", screen, index });
      if (router.pathname !== PATHS.flow) router.push(PATHS.flow);
    },
    [dispatch, router],
  );
  return { goTo };
}
