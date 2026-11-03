"use client";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useMemo } from "react";
import { PATHS } from "./routes.js";

// The screens change pages through this context instead of calling Next.js directly, so they can be rendered (tests)
// without a Next.js router. Outside a RouterProvider every move is ignored and the page counts as the flow page.
const RouterContext = createContext({ push: () => {}, replace: () => {}, pathname: PATHS.flow });

/** Gives the screens Next.js's router: push(path), replace(path) and the current pathname. */
export function RouterProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const value = useMemo(
    () => ({ push: (path) => router.push(path), replace: (path) => router.replace(path), pathname }),
    [router, pathname],
  );
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

/** { push, replace, pathname } of the nearest RouterProvider. */
export const useRouterBridge = () => useContext(RouterContext);
