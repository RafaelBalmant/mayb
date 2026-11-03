"use client";
import { AnalyticsProvider } from "../analytics/AnalyticsProvider.jsx";
import { RouterProvider } from "../navigation/RouterProvider.jsx";
import { StoreProvider } from "../store/StoreProvider.jsx";
import { CookieNotice } from "./CookieNotice.jsx";

/** What every page shares in the browser: the router bridge, analytics with its cookie notice, and the app state. */
export function ClientProviders({ children }) {
  return (
    <RouterProvider>
      <AnalyticsProvider>
        <StoreProvider>{children}</StoreProvider>
        <CookieNotice />
      </AnalyticsProvider>
    </RouterProvider>
  );
}
