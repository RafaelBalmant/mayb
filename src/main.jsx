import { render } from "preact";
import "./styles.js";
import { AnalyticsProvider } from "./analytics/AnalyticsProvider.jsx";
import { App } from "./App.jsx";
import { CookieNotice } from "./components/CookieNotice.jsx";
import { t } from "./content.js";
import { StoreProvider } from "./store/StoreProvider.jsx";

document.title = t("general.pageTitle");

const root = document.getElementById("root");
root.textContent = ""; // drops the text the build puts there for search engines; the first screen replaces it

render(
  <AnalyticsProvider>
    <StoreProvider>
      <App />
    </StoreProvider>
    <CookieNotice />
  </AnalyticsProvider>,
  root,
);
