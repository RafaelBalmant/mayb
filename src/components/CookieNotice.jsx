import { CONSENT } from "../analytics/consent.js";
import { useAnalytics } from "../analytics/AnalyticsProvider.jsx";
import { t } from "../content.js";

/** LGPD notice at the bottom of the page: the analytics tools load only after "Aceitar". */
export function CookieNotice() {
  const { showNotice, choose } = useAnalytics();
  if (!showNotice) return null;

  return (
    <section class="cookie-notice" id="cookie-notice" role="region" aria-label={t("cookies.label")}>
      <div class="in">
        <p>{t("cookies.text")}</p>
        <div class="cookie-actions">
          <button class="btn secondary" id="cookies-decline" onClick={() => choose(CONSENT.denied)}>
            {t("cookies.decline")}
          </button>
          <button class="btn primary" id="cookies-accept" onClick={() => choose(CONSENT.granted)}>
            {t("cookies.accept")}
          </button>
        </div>
      </div>
    </section>
  );
}
