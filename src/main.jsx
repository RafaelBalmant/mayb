import { render } from "preact";
import "@fontsource/jost/400.css";
import "@fontsource/jost/500.css";
import "@fontsource/jost/600.css";
import "@fontsource/jost/700.css";
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/500.css";
import "@fontsource/playfair-display/400-italic.css";
import "./theme.css";
import "./style.css";
import { App } from "./App.jsx";
import { t } from "./content.js";
import { StoreProvider } from "./store/StoreProvider.jsx";

document.title = t("general.pageTitle");

const root = document.getElementById("root");
root.textContent = ""; // drops the text the build puts there for search engines; the first screen replaces it

render(
  <StoreProvider>
    <App />
  </StoreProvider>,
  root,
);
