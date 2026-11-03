"use client";
import { CONSENT } from "../analytics/consent.js";
import { useAnalytics } from "../analytics/AnalyticsProvider.jsx";
import { t } from "../content.js";

/** LGPD notice at the bottom of the page: the analytics tools load only after "OK"; the × declines them. */
export function CookieNotice() {
  const { showNotice, consentMode, choose } = useAnalytics();
  if (!showNotice) return null;

  return (
    <section className="cookie-notice" id="cookie-notice" role="region" aria-label={t("cookies.label")}>
      <div className="in">
        <p>{t(consentMode ? "cookies.textConsentMode" : "cookies.text")}</p>
        <button className="btn primary" id="cookies-accept" onClick={() => choose(CONSENT.granted)}>
          {t("cookies.accept")}
        </button>
        <button
          className="cookie-close"
          id="cookies-decline"
          aria-label={t("cookies.decline")}
          onClick={() => choose(CONSENT.denied)}
        >
          ×
        </button>
      </div>
    </section>
  );
}
