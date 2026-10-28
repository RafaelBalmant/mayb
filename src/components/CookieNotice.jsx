import { CONSENT } from "../analytics/consent.js";
import { useAnalytics } from "../analytics/AnalyticsProvider.jsx";
import { t } from "../content.js";

/** LGPD notice at the bottom of the page: the analytics tools load only after "OK"; the × declines them. */
export function CookieNotice() {
  const { showNotice, choose } = useAnalytics();
  if (!showNotice) return null;

  return (
    <section class="cookie-notice" id="cookie-notice" role="region" aria-label={t("cookies.label")}>
      <div class="in">
        <p>{t("cookies.text")}</p>
        <button class="btn primary" id="cookies-accept" onClick={() => choose(CONSENT.granted)}>
          {t("cookies.accept")}
        </button>
        <button
          class="cookie-close"
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
