// Script of the static service pages (/toxina-botulinica-maringa/ …): the same cookie notice and analytics as the
// app, and a page view with the page's own path. The page content itself is plain HTML written at build time
// (scripts/seo/pages.mjs); the WhatsApp buttons are measured through their data-track attributes.
import { render } from "preact";
import { useEffect } from "preact/hooks";
import "../styles.js";
import { AnalyticsProvider, useAnalytics } from "../analytics/AnalyticsProvider.jsx";
import { CookieNotice } from "../components/CookieNotice.jsx";

function PageView() {
  const { trackScreen } = useAnalytics();
  useEffect(() => trackScreen(location.pathname), [trackScreen]);
  return null;
}

render(
  <AnalyticsProvider>
    <PageView />
    <CookieNotice />
  </AnalyticsProvider>,
  document.getElementById("page-analytics"),
);
