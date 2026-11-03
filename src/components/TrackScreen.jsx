"use client";
import { useEffect } from "react";
import { useAnalytics } from "../analytics/AnalyticsProvider.jsx";

/**
 * Sends the page view of a page built ahead of time. `name` is the screen name the reports already use ("start" →
 * "/", "agenda" → "/agenda"); without it, the page's own path is sent (service pages, 404).
 */
export function TrackScreen({ name }) {
  const { trackScreen } = useAnalytics();
  useEffect(() => {
    trackScreen(name ?? location.pathname);
  }, [name, trackScreen]);
  return null;
}
