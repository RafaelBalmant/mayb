"use client";
import { useAnalytics } from "../../analytics/AnalyticsProvider.jsx";
import { t } from "../../content.js";

/** "Privacy and cookies" at the bottom of the start page: opens the cookie notice again (only with analytics on). */
export function CookiesLink() {
  const analytics = useAnalytics();
  if (!analytics.enabled) return null;
  return (
    <button type="button" className="cookie-link" id="cookies-open" onClick={analytics.reopen}>
      {t("start.cookies")}
    </button>
  );
}
